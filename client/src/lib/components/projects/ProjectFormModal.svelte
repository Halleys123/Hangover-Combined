<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import ErrorBanner from '$lib/components/ui/ErrorBanner.svelte';
	import type { Project, ProjectStatus } from '$lib/types/index.js';

	interface Props {
		isOpen: boolean;
		mode: 'create' | 'edit';
		initialValues?: { name?: string; description?: string; status?: ProjectStatus };
		onClose: () => void;
		onSubmit: (values: { name: string; description: string; status: ProjectStatus }) => Promise<void>;
	}

	let {
		isOpen,
		mode,
		initialValues = {},
		onClose,
		onSubmit,
	}: Props = $props();

	let name = $state(initialValues.name ?? '');
	let description = $state(initialValues.description ?? '');
	let status = $state<ProjectStatus>(initialValues.status ?? 'in-progress');
	let submitting = $state(false);
	let error = $state('');

	// Reset form when modal opens/closes or initialValues change
	$effect(() => {
		if (isOpen) {
			name = initialValues.name ?? '';
			description = initialValues.description ?? '';
			status = initialValues.status ?? 'in-progress';
			error = '';
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || submitting) return;
		submitting = true;
		error = '';
		try {
			await onSubmit({ name: name.trim(), description: description.trim(), status });
			onClose();
		} catch (err: any) {
			error = err.message ?? 'An error occurred. Please try again.';
		} finally {
			submitting = false;
		}
	}

	const title = mode === 'create' ? 'Create Hardware Project' : 'Edit Project Details';
	const submitLabel = mode === 'create' ? 'Create Project' : 'Save Changes';
	const submittingLabel = mode === 'create' ? 'Creating…' : 'Saving…';
</script>

<Modal {isOpen} {onClose}>
	<!-- Header -->
	<div class="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
		<h3 class="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
		<button
			type="button"
			onclick={onClose}
			class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
			aria-label="Close"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Form -->
	<form onsubmit={handleSubmit} class="p-6 space-y-5">
		<ErrorBanner message={error} onDismiss={() => (error = '')} />

		<!-- Project Name -->
		<div>
			<label
				class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5"
				for="proj-name"
			>
				Project Name <span class="text-rose-500">*</span>
			</label>
			<input
				id="proj-name"
				type="text"
				bind:value={name}
				placeholder="e.g., IoT Environmental Monitor v2"
				required
				class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
			/>
		</div>

		<!-- Description -->
		<div>
			<label
				class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5"
				for="proj-desc"
			>
				Description <span class="text-slate-400 text-xs font-normal">(Optional)</span>
			</label>
			<textarea
				id="proj-desc"
				bind:value={description}
				rows="3"
				placeholder="Brief overview of the schematic, microcontrollers, or power requirements..."
				class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
			></textarea>
		</div>

		<!-- Status -->
		<div>
			<label
				class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2"
				id="status-label"
			>
				{mode === 'create' ? 'Initial Status' : 'Status'}
			</label>
			<div class="grid grid-cols-2 gap-3" aria-labelledby="status-label">
				<button
					type="button"
					onclick={() => (status = 'in-progress')}
					class="p-3 border rounded-xl flex items-center gap-3 text-left transition-all {status === 'in-progress'
						? 'border-indigo-600 bg-indigo-50/50 dark:bg-zinc-900/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
						: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:border-slate-300 text-slate-700 dark:text-zinc-300'}"
				>
					<span class="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
					<div>
						<p class="text-sm font-medium">In Progress</p>
						<p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Actively prototyping</p>
					</div>
				</button>
				<button
					type="button"
					onclick={() => (status = 'completed')}
					class="p-3 border rounded-xl flex items-center gap-3 text-left transition-all {status === 'completed'
						? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600'
						: 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:border-slate-300 text-slate-700 dark:text-zinc-300'}"
				>
					<span class="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
					<div>
						<p class="text-sm font-medium">Completed</p>
						<p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Finalized design</p>
					</div>
				</button>
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
			<button
				type="button"
				onclick={onClose}
				class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={submitting || !name.trim()}
				class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
			>
				{#if submitting}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span>{submittingLabel}</span>
				{:else}
					<span>{submitLabel}</span>
				{/if}
			</button>
		</div>
	</form>
</Modal>
