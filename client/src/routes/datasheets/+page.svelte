<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import NavBar from '$lib/components/NavBar.svelte';
	import { authUser } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import ExtractionReviewModal from '$lib/components/datasheets/ExtractionReviewModal.svelte';
	import ErrorBanner from '$lib/components/ui/ErrorBanner.svelte';
	import type { Sheet } from '$lib/types/index.js';

	// Use centralized Sheet type (alias for local readability)
	type Datasheet = Sheet;


	interface Props {
		// optional props
	}

	let datasheets = $state<Datasheet[]>([]);
	let loading = $state(true);
	let uploading = $state(false);
	let selectedId = $state<string | null>(null);
	let pdfBlobUrl = $state<string | null>(null);
	let loadingPdf = $state(false);
	let uploadError = $state('');
	let deleteError = $state('');
	let pendingFiles = $state<File[]>([]);
	let reviewModalSheet = $state<Datasheet | null>(null);

	let projectId = $derived($page.url.searchParams.get('project') || '');
	let projectName = $state('');
	let projectDatasheetIds = $state<string[]>([]);

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		if (!$authUser) { goto('/login'); return; }

		const activeProject = $page.url.searchParams.get('project');
		if (activeProject) {
			try {
				const project = await api.get<any>(`/projects/${activeProject}`);
				projectName = project.name;
				projectDatasheetIds = (project.datasheets || []).map((d: any) => d._id || d.toString());
			} catch (e) {
				console.error('Failed to load project details for filtering:', e);
			}
		}

		try {
			const allSheets = await api.get<Datasheet[]>('/datasheets');
			if (activeProject) {
				datasheets = allSheets.filter(d => projectDatasheetIds.includes(d._id));
			} else {
				datasheets = allSheets;
			}
		} catch { }
		finally { loading = false; }

		pollTimer = setInterval(async () => {
			const hasPending = datasheets.some(d => d.status === 'waiting' || d.status === 'processing' || (!d.parsed && d.status !== 'failed'));
			if (hasPending) {
				try {
					const updated = await api.get<Datasheet[]>('/datasheets');
					if (activeProject) {
						try {
							const project = await api.get<any>(`/projects/${activeProject}`);
							projectDatasheetIds = (project.datasheets || []).map((d: any) => d._id || d.toString());
						} catch {}
						datasheets = updated.filter(d => projectDatasheetIds.includes(d._id));
					} else {
						datasheets = updated;
					}
				} catch (e) {
					console.error('[datasheets] Poll error:', e);
				}
			} else {
				// All datasheets processed — stop polling
				clearInterval(pollTimer!);
				pollTimer = null;
			}
		}, 3000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

	async function viewDatasheet(id: string) {
		if (pendingFiles.length > 0) cancelUpload();
		if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
		selectedId = id;
		loadingPdf = true;
		try {
			// Uses api.blob() — no raw fetch, no hardcoded localhost
			const blob = await api.blob(`/datasheets/${id}/file`);
			pdfBlobUrl = URL.createObjectURL(blob);
		} catch (e) {
			console.error('Failed to load PDF:', e);
			pdfBlobUrl = null;
		} finally {
			loadingPdf = false;
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files ? Array.from(input.files) : [];
		if (files.length === 0) return;
		
		uploadError = '';
		if (pdfBlobUrl && !selectedId) URL.revokeObjectURL(pdfBlobUrl);
		pdfBlobUrl = URL.createObjectURL(files[0]);
		pendingFiles = files;
		selectedId = null;
		input.value = '';
	}

	async function confirmUpload() {
		if (pendingFiles.length === 0) return;
		uploading = true;
		uploadError = '';
		try {
			const form = new FormData();
			form.append('multi', pendingFiles.length > 1 ? 'true' : 'false');
			if (projectId) {
				form.append('projectId', projectId);
			}
			pendingFiles.forEach(f => form.append('files', f));
			const res = await api.upload<Datasheet | Datasheet[]>('/datasheets', form);
			const newSheets = Array.isArray(res) ? res : [res];

			if (projectId) {
				projectDatasheetIds = Array.from(new Set([...projectDatasheetIds, ...newSheets.map(s => s._id)]));
			}
			datasheets = [...newSheets, ...datasheets];
			pendingFiles = [];
			if (newSheets.length > 0) selectedId = newSheets[0]._id;
		} catch (err: any) {
			uploadError = err.message;
		} finally {
			uploading = false;
		}
	}

	function cancelUpload() {
		pendingFiles = [];
		if (pdfBlobUrl && !selectedId) URL.revokeObjectURL(pdfBlobUrl);
		pdfBlobUrl = null;
		uploadError = '';
	}

	async function deleteDatasheet(id: string, e: MouseEvent) {
		e.stopPropagation();
		if (!confirm('Delete this datasheet? This cannot be undone.')) return;
		deleteError = '';
		try {
			await api.delete(`/datasheets/${id}`);
			if (selectedId === id) { selectedId = null; if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); pdfBlobUrl = null; } }
			datasheets = datasheets.filter((d) => d._id !== id);
		} catch (err: any) {
			deleteError = err.message || 'Failed to delete datasheet.';
		}
	}

	function formatDate(iso: string) {
		try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
		catch { return iso; }
	}
</script>

<!-- DATASHEET INGESTION & LIBRARY PAGE -->
<div class="h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors duration-200 overflow-hidden">
	<NavBar 
		activeLink="datasheets" 
		showBack={true} 
		onLogoClick={projectId ? () => goto(`/projects/${projectId}`) : () => goto('/')} 
		onBackClick={projectId ? () => goto(`/projects/${projectId}`) : () => goto('/projects')}
		projectName={projectName}
		projectId={projectId}
	/>

	<div class="flex-1 flex overflow-hidden">
		<!-- Left: PDF Viewer -->
		<div class="flex-1 flex flex-col bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 overflow-hidden">
			{#if loadingPdf}
				<div class="flex-1 flex flex-col p-8 gap-6 animate-pulse bg-slate-50/80 dark:bg-zinc-900/50 overflow-hidden">
					<div class="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-200 to-rose-100 dark:from-rose-950/60 dark:to-zinc-800 shrink-0 shadow-inner"></div>
							<div class="space-y-2">
								<div class="h-4 w-48 bg-slate-200 dark:bg-zinc-800 rounded"></div>
								<div class="h-3 w-24 bg-slate-100 dark:bg-zinc-800/60 rounded"></div>
							</div>
						</div>
						<div class="h-8 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
					</div>
					<div class="flex-1 border border-slate-200 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-sm">
						<div class="h-6 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded"></div>
						<div class="space-y-3 pt-4">
							<div class="h-3 w-full bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
							<div class="h-3 w-full bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
							<div class="h-3 w-5/6 bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
							<div class="h-3 w-4/6 bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
						</div>
						<div class="h-40 w-full bg-slate-100 dark:bg-zinc-800/50 rounded-lg my-6"></div>
						<div class="space-y-3">
							<div class="h-3 w-full bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
							<div class="h-3 w-11/12 bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
							<div class="h-3 w-3/4 bg-slate-100 dark:bg-zinc-800/70 rounded"></div>
						</div>
					</div>
				</div>
			{:else if pdfBlobUrl}
				<div class="relative w-full h-full">
					<button 
						onclick={() => { URL.revokeObjectURL(pdfBlobUrl!); pdfBlobUrl = null; selectedId = null; if (pendingFiles.length > 0) cancelUpload(); }}
						class="absolute top-4 right-6 z-10 px-4 py-2 bg-slate-900/70 hover:bg-rose-600 text-white rounded-lg backdrop-blur shadow-lg text-xs font-bold flex items-center gap-2 transition-colors border border-white/10"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
						Close PDF
					</button>
					<embed src={pdfBlobUrl} type="application/pdf" class="w-full h-full" />
				</div>
			{:else}
				<div class="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
					<svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p class="text-base font-medium text-gray-400">Select a datasheet to preview</p>
					<p class="text-sm text-gray-300 mt-1">PDF will render here</p>
				</div>
			{/if}
		</div>

		<!-- Right: List + Upload -->
		<div class="w-80 flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 overflow-hidden shrink-0 transition-colors">
			<div class="p-4 border-b border-gray-200 dark:border-zinc-800">
				<h2 class="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">Datasheet Library</h2>

				<ErrorBanner message={uploadError} onDismiss={() => (uploadError = '')} class="mb-2" />
				<ErrorBanner message={deleteError} onDismiss={() => (deleteError = '')} class="mb-2" />

				{#if pendingFiles.length > 0}
					<div class="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/50 mb-3">
						<p class="text-xs text-blue-900 dark:text-blue-200 font-medium truncate">
							{pendingFiles.length === 1 ? `Previewing: ${pendingFiles[0].name}` : `Ready to upload ${pendingFiles.length} files`}
						</p>
						<div class="flex gap-2">
							<button onclick={confirmUpload} disabled={uploading} class="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition">
								{uploading ? 'Saving…' : `Confirm Upload (${pendingFiles.length})`}
							</button>
							<button onclick={cancelUpload} disabled={uploading} class="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium rounded hover:bg-slate-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition">
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<label class="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition cursor-pointer {uploading ? 'opacity-60 pointer-events-none' : ''}">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
						</svg>
						Upload PDF Datasheet(s)
						<input type="file" accept=".pdf" multiple class="hidden" onchange={handleFileSelect} disabled={uploading} />
					</label>
				{/if}
			</div>

			<div class="flex-1 overflow-y-auto">
				{#if loading}
					{#each [1, 2, 3, 4, 5] as i (i)}
					<div class="p-4 border-b border-gray-100 dark:border-zinc-800/80 flex items-start gap-3.5 animate-pulse">
						<div class="w-8 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100 dark:from-zinc-800 dark:to-zinc-800/50 shrink-0 shadow-inner"></div>
						<div class="flex-1 min-w-0 space-y-2 py-0.5">
							<div class="h-3.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-zinc-800 dark:via-zinc-700/50 dark:to-zinc-800 rounded-full w-3/4"></div>
							<div class="flex items-center gap-2 pt-0.5">
								<div class="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-12"></div>
								<div class="h-4 bg-slate-200/80 dark:bg-zinc-800/80 rounded-md w-16"></div>
							</div>
							<div class="h-2.5 bg-slate-100 dark:bg-zinc-800/60 rounded w-1/3 pt-1"></div>
						</div>
					</div>
					{/each}
				{:else if datasheets.length === 0}
					<div class="p-8 text-center text-gray-400 dark:text-zinc-500">
						<svg class="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
						</svg>
						<p class="text-sm font-medium">No datasheets yet</p>
						<p class="text-xs mt-1">Upload a PDF to get started.</p>
					</div>
				{:else}
					{#each datasheets as doc (doc._id)}
					<div
						role="button"
						tabindex="0"
						onclick={() => viewDatasheet(doc._id)}
						onkeydown={(e) => e.key === 'Enter' && viewDatasheet(doc._id)}
						class="w-full text-left p-4 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group {selectedId === doc._id ? 'bg-blue-50 dark:bg-zinc-800 border-l-2 border-l-blue-500 dark:border-l-blue-400' : ''}"
					>
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 mt-0.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 14h8v2H8v-2zm0-4h8v2H8v-2z"/>
							</svg>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate {selectedId === doc._id ? 'text-blue-700 dark:text-blue-400' : ''}">{doc.name}</p>
								<div class="flex items-center gap-2 mt-1 flex-wrap">
									<span class="text-xs text-gray-400 dark:text-zinc-500">{doc.size}</span>
									{#if doc.status === 'waiting'}
										<span class="text-[10px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900/60 flex items-center gap-1">
											<span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span> Waiting in Queue
										</span>
									{:else if doc.status === 'processing'}
										<span class="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60 flex items-center gap-1 animate-pulse">
											<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-spin"></span> Processing…
										</span>
									{:else if doc.status === 'failed'}
										<span class="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60" title={doc.error || 'Extraction failed'}>Failed</span>
									{:else if doc.parsed || doc.status === 'completed'}
										{#if doc.verificationStatus === 'accepted'}
											<span class="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">Verified</span>
										{:else if doc.verificationStatus === 'rejected'}
											<span class="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">Discarded</span>
										{:else}
											<span class="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">Parsed</span>
										{/if}
									{:else}
										<span class="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-900/60">Processing…</span>
									{/if}
								</div>
								<p class="text-xs text-gray-400 dark:text-zinc-500 mt-1">{formatDate(doc.uploadedAt)}</p>
							</div>
							<button
								onclick={(e) => deleteDatasheet(doc._id, e)}
								class="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all rounded shrink-0"
								title="Delete"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
								</svg>
							</button>
						</div>

						{#if (doc.parsed || doc.status === 'completed') && doc.cogneeConfig}
						<div class="mt-2.5 ml-8">
							<button
								onclick={(e) => { e.stopPropagation(); reviewModalSheet = doc; }}
								class="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950/50 dark:to-blue-950/50 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-semibold flex items-center gap-1.5 transition shadow-2xs"
							>
								<svg class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								Review Extracted Knowledge
							</button>
						</div>
						{/if}
					</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<ExtractionReviewModal
		datasheet={reviewModalSheet}
		onClose={() => (reviewModalSheet = null)}
		onUpdated={(updated) => {
			datasheets = datasheets.map(d => d._id === updated._id ? updated : d);
		}}
	/>
</div>

<style>
	:global(body) { overflow: hidden; }
</style>
