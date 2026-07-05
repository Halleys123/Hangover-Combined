<script lang="ts">
	import { onMount } from 'svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import ProjectFormModal from '$lib/components/projects/ProjectFormModal.svelte';
	import ErrorBanner from '$lib/components/ui/ErrorBanner.svelte';
	import { authUser } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import type { Project, ProjectStatus } from '$lib/types/index.js';

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let pageError = $state('');

	// Create modal state
	let showCreateModal = $state(false);

	// Edit modal state
	let showEditModal = $state(false);
	let editingProject = $state<Project | null>(null);

	onMount(async () => {
		if (!$authUser) {
			goto('/login');
			return;
		}
		try {
			projects = await api.get<Project[]>('/projects');
		} catch (err: any) {
			pageError = err.message ?? 'Failed to load projects.';
		} finally {
			loading = false;
		}
	});

	async function handleCreate(values: { name: string; description: string; status: ProjectStatus }) {
		const project = await api.post<{ _id: string }>('/projects', values);
		goto(`/projects/${project._id}`);
	}

	async function handleEdit(values: { name: string; description: string; status: ProjectStatus }) {
		if (!editingProject) return;
		const updated = await api.put<Project>(`/projects/${editingProject._id}`, values);
		projects = projects.map((p) => (p._id === updated._id ? updated : p));
	}

	function openEditModal(project: Project, e: MouseEvent) {
		e.stopPropagation();
		editingProject = project;
		showEditModal = true;
	}
</script>

<svelte:head>
	<title>Projects — Hangover AI</title>
	<meta name="description" content="Manage your hardware prototype projects." />
</svelte:head>

<!-- WORKSPACE PROJECTS LIST PAGE -->
<div class="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-200">
	<NavBar
		activeLink="projects"
		showBack={true}
		onLogoClick={() => goto('/')}
	/>

	<div class="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
		<!-- HEADER -->
		<div class="flex justify-between items-center mb-8">
			<div>
				<h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
					{#if $authUser}Welcome back, {$authUser.name.split(' ')[0]}{:else}Projects{/if}
				</h2>
				<p class="text-slate-500 dark:text-zinc-400 text-sm mt-1">
					Manage and prototype your hardware architecture designs.
				</p>
			</div>
			<button
				onclick={() => (showCreateModal = true)}
				class="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-150 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
				</svg>
				New Project
			</button>
		</div>

		<!-- Page-level error -->
		<ErrorBanner message={pageError} onDismiss={() => (pageError = '')} class="mb-6" />

		<!-- PROJECTS GRID -->
		{#if loading}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each [1, 2, 3, 4] as i (i)}
					<div class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-pulse">
						<div class="h-5 bg-slate-200 dark:bg-zinc-800 rounded-lg w-3/4 mb-4"></div>
						<div class="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-md w-full mb-2"></div>
						<div class="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-md w-2/3 mb-6"></div>
						<div class="flex gap-2">
							<div class="h-6 w-16 bg-slate-100 dark:bg-zinc-800 rounded-md"></div>
							<div class="h-6 w-20 bg-slate-100 dark:bg-zinc-800 rounded-md"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if projects.length === 0}
			<div class="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 shadow-sm">
				<div class="w-14 h-14 bg-indigo-50 dark:bg-zinc-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
					</svg>
				</div>
				<h3 class="text-slate-900 dark:text-white font-semibold text-base mb-1">No hardware projects yet</h3>
				<p class="text-slate-500 dark:text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
					Create your first project to prototype schematics, inspect datasheets, and simulate pinouts.
				</p>
				<button
					onclick={() => (showCreateModal = true)}
					class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
				>
					Create First Project
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each projects as project (project._id)}
					<div
						role="button"
						tabindex="0"
						onclick={(e) => { if (!(e.target as HTMLElement).closest('button')) goto(`/projects/${project._id}`); }}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(`/projects/${project._id}`); }}
						class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/40 dark:hover:border-indigo-500/60 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 text-left group flex flex-col h-full relative overflow-hidden cursor-pointer"
					>
						<div class="flex items-start justify-between gap-4 mb-2.5 w-full">
							<div class="flex items-center min-w-0">
								<h3 class="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
									{project.name}
								</h3>
								<button
									type="button"
									onclick={(e) => openEditModal(project, e)}
									class="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors ml-2 shrink-0"
									title="Edit project details"
									aria-label="Edit {project.name}"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</button>
							</div>
							<span class="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide {project.status === 'completed'
								? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
								: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'}">
								{project.status === 'completed' ? 'Completed' : 'In Progress'}
							</span>
						</div>

						<p class="text-slate-500 dark:text-zinc-400 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
							{project.description || 'No project description provided.'}
						</p>

						<div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-auto w-full">
							<div class="flex flex-wrap gap-1.5 items-center">
								{#if project.components && project.components.length > 0}
									{#each project.components.slice(0, 3) as comp}
										<span class="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-medium rounded-md">{comp}</span>
									{/each}
									{#if project.components.length > 3}
										<span class="text-xs text-slate-400 font-medium pl-1">+{project.components.length - 3} more</span>
									{/if}
								{:else}
									<span class="text-xs text-slate-400 dark:text-zinc-500 italic">No components added</span>
								{/if}
							</div>
							<span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
								Open
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- CREATE MODAL (reused ProjectFormModal component) -->
<ProjectFormModal
	isOpen={showCreateModal}
	mode="create"
	onClose={() => (showCreateModal = false)}
	onSubmit={handleCreate}
/>

<!-- EDIT MODAL (same component, edit mode) -->
<ProjectFormModal
	isOpen={showEditModal}
	mode="edit"
	initialValues={editingProject ? { name: editingProject.name, description: editingProject.description, status: editingProject.status } : {}}
	onClose={() => { showEditModal = false; editingProject = null; }}
	onSubmit={handleEdit}
/>
