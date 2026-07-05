<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import type { Comp, Sheet } from '$lib/types/index.js';

	interface Props {
		workspaceId?: string;
		projectDatasheets?: Sheet[];
		projectComponents?: string[];
		onComponentClick?: (comp: Comp) => void;
		onProjectUpdate?: (project: any) => void;
		/** Called when a datasheet is attached so the parent can reload the AI panel */
		onDatasheetAttached?: () => void;
	}

	let {
		workspaceId,
		projectDatasheets = $bindable([]),
		projectComponents = $bindable([]),
		onComponentClick,
		onProjectUpdate,
		onDatasheetAttached,
	}: Props = $props();

	let rightTab = $state<'components' | 'datasheets'>('components');
	let personalComponents = $state<Comp[]>([]);
	let catalogComponents = $state<Comp[]>([]);
	let allDatasheets = $state<Sheet[]>([]);
	let loadingComps = $state(true);
	let loadingSheets = $state(true);
	let componentSearchQuery = $state('');
	let showCatalog = $state(false);
	let addingId = $state<string | null>(null);
	let showAttachModal = $state(false);
	let attachingSheetId = $state<string | null>(null);

	// ── Derived state ─────────────────────────────────────────────────────────

	let availableDatasheets = $derived(
		allDatasheets.filter(d => !projectDatasheets.find(pd => pd._id === d._id))
	);

	let pendingDatasheets = $derived(
		allDatasheets.filter(d => !d.parsed && d.status !== 'failed')
	);

	let hasAnalyzedDatasheet = $derived(
		projectDatasheets.some(d => d.parsed || d.status === 'completed') ||
		allDatasheets.some(d => d.parsed || d.status === 'completed')
	);

	// Project-scoped component library (deduplicated by name)
	let myLibraryList = $derived(
		workspaceId
			? Array.from(new Map(
				personalComponents
					.filter(c => projectComponents.includes(c.name) || projectComponents.includes(c._id) || (c.id && projectComponents.includes(c.id)))
					.map(c => [c.name.trim().toLowerCase(), c])
			).values())
			: Array.from(new Map(personalComponents.map(c => [c.name.trim().toLowerCase(), c])).values())
	);

	// Components available to add (from datasheets attached to this project)
	let availableCatalogList = $derived(
		workspaceId
			? Array.from(new Map(
				[...personalComponents, ...catalogComponents]
					.filter(c => {
						if (!c.datasheetId) return false;
						const cDsId = typeof c.datasheetId === 'object' ? (c.datasheetId as any)._id : c.datasheetId;
						return (
							!projectComponents.includes(c.name) &&
							!projectComponents.includes(c._id) &&
							projectDatasheets.some(d => d._id === cDsId)
						);
					})
					.map(c => [c.name.trim().toLowerCase(), c])
			).values())
			: Array.from(new Map([...personalComponents, ...catalogComponents].map(c => [c.name.trim().toLowerCase(), c])).values())
	);

	// ── Initial data fetch ────────────────────────────────────────────────────

	onMount(async () => {
		const [personalRes, catalogRes, sheetsRes] = await Promise.allSettled([
			api.get<Comp[]>('/components'),
			api.get<Comp[]>('/components/catalog'),
			api.get<Sheet[]>('/datasheets'),
		]);
		if (personalRes.status === 'fulfilled') { personalComponents = personalRes.value; loadingComps = false; }
		if (catalogRes.status === 'fulfilled') catalogComponents = catalogRes.value;
		if (sheetsRes.status === 'fulfilled') { allDatasheets = sheetsRes.value; loadingSheets = false; }
		// Set loading false even on failure
		loadingComps = false;
		loadingSheets = false;
	});

	// ── Polling (only while datasheets are pending; stops automatically) ───────

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		const hasPending = pendingDatasheets.length > 0;
		if (hasPending && !pollTimer) {
			pollTimer = setInterval(async () => {
				try {
					const [sheets, comps] = await Promise.all([
						api.get<Sheet[]>('/datasheets'),
						api.get<Comp[]>('/components'),
					]);
					allDatasheets = sheets;
					personalComponents = comps;
				} catch { /* silent — polling will retry */ }
			}, 3000);
		} else if (!hasPending && pollTimer) {
			// Stop polling as soon as all datasheets are processed
			clearInterval(pollTimer);
			pollTimer = null;
		}
		return () => {
			if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
		};
	});

	// ── Filtering & Grouping ──────────────────────────────────────────────────

	function filterList(list: Comp[]): Comp[] {
		const q = componentSearchQuery.trim().toLowerCase();
		if (!q) return list;
		return list.filter(c =>
			c.name.toLowerCase().includes(q) ||
			c.description.toLowerCase().includes(q) ||
			c.category.toLowerCase().includes(q)
		);
	}

	function groupByCategory(list: Comp[]): Record<string, Comp[]> {
		return list.reduce((acc, c) => {
			if (!acc[c.category]) acc[c.category] = [];
			acc[c.category].push(c);
			return acc;
		}, {} as Record<string, Comp[]>);
	}

	let filteredPersonal = $derived(groupByCategory(filterList(myLibraryList)));
	let filteredCatalog = $derived(groupByCategory(filterList(availableCatalogList)));
	let hasPersonalMatches = $derived(Object.keys(filteredPersonal).length > 0);

	// ── Actions ───────────────────────────────────────────────────────────────

	async function addToLibrary(comp: Comp) {
		addingId = comp.id ?? comp._id ?? comp.name;
		try {
			if (workspaceId) {
				await api.post(`/projects/${workspaceId}/components`, { name: comp.name });
				if (!projectComponents.includes(comp.name)) {
					projectComponents = [...projectComponents, comp.name];
				}
			}
			if (!personalComponents.some(p => p.name?.trim().toLowerCase() === comp.name.trim().toLowerCase() || p._id === comp._id)) {
				const added = await api.post<Comp>('/components', {
					category: comp.category,
					name: comp.name,
					description: comp.description,
					diagram: comp.diagram,
				});
				personalComponents = [...personalComponents, added];
			}
		} catch (err) {
			console.error('Failed to add component to library:', err);
		} finally {
			addingId = null;
		}
	}

	async function removeFromProject(compName: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!workspaceId) return;
		try {
			const updatedProject = await api.delete<any>(`/projects/${workspaceId}/components/${encodeURIComponent(compName)}`);
			projectComponents = projectComponents.filter(n => n !== compName);
			onProjectUpdate?.(updatedProject);
		} catch (err) {
			console.error('Failed to remove component:', err);
		}
	}

	let showImproveModal = $state(false);
	let attachedSheetName = $state('');
	let improvingDataset = $state(false);

	async function attachDatasheet(sheet: Sheet) {
		if (!workspaceId) return;
		attachingSheetId = sheet._id;
		try {
			await api.post(`/projects/${workspaceId}/datasheets`, { datasheetId: sheet._id });
			projectDatasheets = [...projectDatasheets, sheet];
			// Notify parent via callback instead of window event bus
			onDatasheetAttached?.();
			attachedSheetName = sheet.name;
			showImproveModal = true;
		} catch (err) {
			console.error('Failed to attach datasheet:', err);
		} finally {
			attachingSheetId = null;
			showAttachModal = false;
		}
	}

	async function confirmImproveDataset() {
		if (!workspaceId) return;
		improvingDataset = true;
		try {
			await api.post(`/projects/${workspaceId}/improve-dataset`, {});
			showImproveModal = false;
		} catch (err) {
			console.error('Failed to improve dataset:', err);
		} finally {
			improvingDataset = false;
		}
	}

	function handleUploadMoreDatasheets() {
		showImproveModal = false;
		goto(workspaceId ? `/datasheets?project=${workspaceId}` : '/datasheets');
	}

	async function detachDatasheet(sheetId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!workspaceId) return;
		try {
			const updatedProject = await api.delete<any>(`/projects/${workspaceId}/datasheets/${sheetId}`);
			projectDatasheets = projectDatasheets.filter(d => d._id !== sheetId);
			onProjectUpdate?.(updatedProject);
		} catch (err) {
			console.error('Failed to detach datasheet:', err);
		}
	}

	function handleDragStart(event: DragEvent, comp: Comp) {
		if (event.dataTransfer) {
			const payload = JSON.stringify({ type: 'hardware', name: comp.name, diagram: comp.diagram });
			event.dataTransfer.setData('application/svelteflow', payload);
			event.dataTransfer.setData('text/plain', payload);
			event.dataTransfer.effectAllowed = 'move';
		}
	}
</script>

<!-- RIGHT PANEL: COMPONENT & DATASHEET LIBRARY -->
<div class="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
	<button
		class="flex-1 py-3 text-sm font-semibold transition-colors {rightTab === 'components' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}"
		onclick={() => (rightTab = 'components')}
	>Components</button>
	<button
		class="flex-1 py-3 text-sm font-semibold transition-colors {rightTab === 'datasheets' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}"
		onclick={() => (rightTab = 'datasheets')}
	>Datasheets</button>
</div>

{#if rightTab === 'components'}
	<div class="p-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
		<div class="relative">
			<svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
			<input type="text" bind:value={componentSearchQuery} placeholder="Search components…" class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 transition-all" />
		</div>
	</div>

	<div class="flex-1 overflow-y-auto transition-colors">
		<div class="p-3 pb-1">
			<h3 class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">My Library</h3>
			<p class="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal">💡 Drag components onto the canvas or click them to place instantly.</p>
		</div>

		{#if loadingComps}
			<div class="space-y-2 px-3 pb-3">
				{#each [1, 2, 3] as i (i)}
				<div class="p-2.5 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg bg-white/50 dark:bg-zinc-800/40 flex items-center justify-between gap-2.5 animate-pulse shadow-sm">
					<div class="flex items-center gap-2.5 flex-1 min-w-0">
						<div class="w-7 h-7 rounded-md bg-gradient-to-br from-slate-200 to-slate-100 dark:from-zinc-700 dark:to-zinc-800 shrink-0"></div>
						<div class="flex-1 space-y-1.5 py-0.5 min-w-0">
							<div class="h-3 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-zinc-700 dark:to-zinc-800 rounded w-2/3"></div>
							<div class="h-2 bg-slate-100 dark:bg-zinc-800 rounded w-5/6"></div>
						</div>
					</div>
				</div>
				{/each}
			</div>
		{:else if !hasPersonalMatches && componentSearchQuery}
			<p class="px-3 pb-3 text-xs text-slate-400 dark:text-zinc-500">No results for "{componentSearchQuery}"</p>
		{:else if myLibraryList.length === 0}
			<div class="px-3 pb-3 text-xs text-slate-400 dark:text-zinc-500">
				<p>No components added to this project yet.</p>
				{#if hasAnalyzedDatasheet || availableCatalogList.length > 0}
					<button onclick={() => (showCatalog = true)} class="text-blue-500 dark:text-blue-400 font-medium hover:underline mt-1">Browse catalog below to add →</button>
				{:else}
					<p class="mt-1 text-[10px] text-amber-500 dark:text-amber-400">Upload &amp; analyze a datasheet to unlock the component catalog!</p>
				{/if}
			</div>
		{:else}
			{#each Object.entries(filteredPersonal) as [category, comps]}
				<div class="px-3 mb-4">
					<p class="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{category}</p>
					<div class="space-y-1.5">
						{#each comps as comp (comp._id || comp.name)}
							<div
								draggable="true"
								ondragstart={(e) => handleDragStart(e, comp)}
								onclick={() => onComponentClick?.(comp)}
								class="group p-2.5 border border-slate-200 dark:border-zinc-800 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm bg-white dark:bg-zinc-800/80 flex items-center justify-between gap-2.5 transition-colors"
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<svg class="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
									<div class="min-w-0">
										<p class="text-xs font-semibold text-slate-900 dark:text-white truncate">{comp.name}</p>
										<p class="text-[10px] text-slate-400 dark:text-zinc-400 truncate">{comp.description}</p>
									</div>
								</div>
								{#if workspaceId}
									<button onclick={(e) => removeFromProject(comp.name, e)} title="Remove from project library" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity" aria-label="Remove {comp.name}">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}

		<!-- Catalog Section -->
		{#if loadingComps || hasAnalyzedDatasheet || availableCatalogList.length > 0}
			<div class="px-3 pt-1 pb-1 border-t border-slate-100 dark:border-zinc-800 mt-1">
				<button onclick={() => (showCatalog = !showCatalog)} class="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-zinc-300 w-full transition-colors">
					<svg class="w-3 h-3 transition-transform {showCatalog ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
					Catalog {#if availableCatalogList.length > 0}({availableCatalogList.length}){/if}
				</button>
			</div>

			{#if showCatalog}
				{#if loadingComps}
					<div class="space-y-2 px-3 pt-2 pb-3">
						{#each [1, 2] as i (i)}
						<div class="p-2.5 border border-dashed border-slate-200/80 dark:border-zinc-800/80 rounded-lg bg-slate-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-2.5 animate-pulse shadow-sm">
							<div class="flex items-center gap-2.5 flex-1 min-w-0">
								<div class="w-6 h-6 rounded bg-gradient-to-br from-slate-200 to-slate-100 dark:from-zinc-700 dark:to-zinc-800 shrink-0"></div>
								<div class="flex-1 space-y-1.5 min-w-0">
									<div class="h-3 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-zinc-700 dark:to-zinc-800 rounded w-1/2"></div>
									<div class="h-2 bg-slate-100 dark:bg-zinc-800 rounded w-3/4"></div>
								</div>
							</div>
							<div class="w-10 h-6 bg-slate-200 dark:bg-zinc-800 rounded shrink-0"></div>
						</div>
						{/each}
					</div>
				{:else}
					{#if pendingDatasheets.length > 0}
						<div class="px-3 mb-3">
							<p class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
								<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Live AI Datasheet Indexing
							</p>
							<div class="space-y-1.5">
								{#each pendingDatasheets as sheet (sheet._id)}
									<div class="p-2.5 border border-amber-200 dark:border-amber-900/60 rounded bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between text-xs">
										<div class="min-w-0 flex items-center gap-2">
											<svg class="w-4 h-4 text-amber-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
											<span class="font-medium text-slate-800 dark:text-zinc-200 truncate">{sheet.name}</span>
										</div>
										<span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">{sheet.status || 'parsing...'}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#each Object.entries(filteredCatalog) as [category, comps]}
						<div class="px-3 mb-3">
							<p class="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{category}</p>
							<div class="space-y-1.5">
								{#each comps as comp (comp.id ?? comp.name)}
									<div class="p-2.5 border border-dashed border-slate-200 dark:border-zinc-800 rounded bg-slate-50 dark:bg-zinc-800/40 flex items-center gap-2.5 group transition-colors">
										<div draggable="true" ondragstart={(e) => handleDragStart(e, comp)} class="flex-1 flex items-center gap-2 cursor-grab min-w-0">
											<svg class="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
											<div class="min-w-0">
												<p class="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{comp.name}</p>
												<p class="text-[10px] text-slate-400 dark:text-zinc-400 truncate">{comp.description}</p>
											</div>
										</div>
										<button
											onclick={() => addToLibrary(comp)}
											disabled={addingId === (comp.id ?? comp.name)}
											class="shrink-0 px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded font-bold disabled:opacity-50 transition-colors"
										>
											{addingId === (comp.id ?? comp.name) ? '…' : '+ Add'}
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			{/if}
		{/if}
	</div>

{:else}
	<!-- Datasheets Tab -->
	<div class="p-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors flex gap-2">
		<button onclick={() => (showAttachModal = !showAttachModal)} class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 dark:bg-zinc-800 text-white text-xs font-medium rounded hover:bg-slate-700 dark:hover:bg-zinc-700 transition">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			Attach from Library
		</button>
		<button onclick={() => goto(`/datasheets?project=${workspaceId}`)} class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
			Upload New PDF
		</button>
	</div>

	<div class="flex-1 overflow-y-auto transition-colors">
		<div class="p-3 pb-1">
			<h3 class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Attached Datasheets</h3>
		</div>

		{#if loadingSheets}
			<div class="space-y-2 px-3 pb-3">
				{#each [1, 2, 3] as i (i)}
				<div class="p-3 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg bg-white/50 dark:bg-zinc-800/40 flex items-center justify-between gap-2.5 animate-pulse shadow-sm">
					<div class="flex items-center gap-2.5 flex-1 min-w-0">
						<div class="w-8 h-8 rounded-md bg-gradient-to-br from-rose-200/60 to-rose-100/40 dark:from-rose-950/40 dark:to-zinc-800 shrink-0 flex items-center justify-center">
							<div class="w-4 h-4 rounded bg-rose-300/60 dark:bg-rose-800/40"></div>
						</div>
						<div class="flex-1 space-y-1.5 py-0.5 min-w-0">
							<div class="h-3 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-zinc-700 dark:to-zinc-800 rounded w-3/4"></div>
							<div class="flex items-center gap-2">
								<div class="h-2 bg-slate-100 dark:bg-zinc-800 rounded w-10"></div>
								<div class="h-2 bg-slate-200 dark:bg-zinc-700/60 rounded-full w-14"></div>
							</div>
						</div>
					</div>
					<div class="w-5 h-5 rounded bg-slate-100 dark:bg-zinc-800 shrink-0"></div>
				</div>
				{/each}
			</div>
		{:else if projectDatasheets.length === 0}
			<div class="px-3 pb-3 text-xs text-slate-400 dark:text-zinc-500">
				No datasheets attached to this project yet. Use "Attach from Library" above.
			</div>
		{:else}
			<div class="px-3 space-y-2">
				{#each projectDatasheets as sheet (sheet._id)}
					<div class="p-3 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-800/80 flex items-center justify-between gap-2 transition-colors">
						<div class="flex items-center gap-2 min-w-0">
							<svg class="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
							<div class="min-w-0">
								<p class="text-xs font-semibold text-slate-900 dark:text-white truncate">{sheet.name}</p>
								<div class="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-400">
									<span>{sheet.size}</span>
									{#if sheet.parsed}
										<span class="text-emerald-500 dark:text-emerald-400 font-medium">● Indexed</span>
									{:else}
										<span class="text-amber-500 dark:text-amber-400 font-medium animate-pulse">● {sheet.status || 'Processing'}</span>
									{/if}
								</div>
							</div>
						</div>
						<button onclick={(e) => detachDatasheet(sheet._id, e)} class="text-slate-400 hover:text-rose-500 p-1 transition-colors" title="Detach from project" aria-label="Detach {sheet.name}">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Attach Modal -->
{#if showAttachModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 p-4 backdrop-blur-sm"
		onclick={(e) => { if (e.target === e.currentTarget) showAttachModal = false; }}
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-colors">
			<div class="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-slate-900 dark:text-white">Attach Datasheet to Project</h3>
				<button onclick={() => (showAttachModal = false)} class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition" aria-label="Close">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<div class="p-4 max-h-80 overflow-y-auto space-y-2">
				{#if availableDatasheets.length === 0}
					<p class="text-xs text-slate-400 text-center py-4">No available datasheets found in library.</p>
				{:else}
					{#each availableDatasheets as sheet (sheet._id)}
						<div class="p-2.5 border border-slate-200 dark:border-zinc-800 rounded flex items-center justify-between gap-2">
							<div class="min-w-0">
								<p class="text-xs font-medium text-slate-900 dark:text-white truncate">{sheet.name}</p>
								<span class="text-[10px] text-slate-400">{sheet.size}</span>
							</div>
							<button
								onclick={() => attachDatasheet(sheet)}
								disabled={attachingSheetId === sheet._id}
								class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition"
							>
								{attachingSheetId === sheet._id ? 'Attaching…' : 'Attach'}
							</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Improve Dataset Confirmation Modal -->
{#if showImproveModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
			<div class="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
					</div>
					<h3 class="text-sm font-bold text-slate-900 dark:text-white">Knowledge Graph Synthesis</h3>
				</div>
			</div>
			<div class="p-5 space-y-3 text-xs text-slate-600 dark:text-zinc-300">
				<p class="leading-relaxed">
					You attached <span class="font-semibold text-slate-900 dark:text-white">"{attachedSheetName}"</span> to this project workspace.
				</p>
				<p class="leading-relaxed font-medium text-slate-800 dark:text-zinc-200">
					Have you added all the datasheets required for your circuit design?
				</p>
				<div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 leading-normal">
					⚡ Once all required documents are attached, we will run Cognee's AI improve API to build the unified hardware knowledge graph.
				</div>
			</div>
			<div class="px-5 py-3.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
				<button
					onclick={handleUploadMoreDatasheets}
					disabled={improvingDataset}
					class="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
				>
					No, upload more datasheets
				</button>
				<button
					onclick={confirmImproveDataset}
					disabled={improvingDataset}
					class="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
				>
					{#if improvingDataset}
						<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
						Synthesizing...
					{:else}
						Yes, synthesize knowledge graph
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}