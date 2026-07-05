<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { api } from '$lib/api';
	import ErrorBanner from '$lib/components/ui/ErrorBanner.svelte';
	import type { Sheet } from '$lib/types/index.js';

	interface Props {
		datasheet: Sheet | null;
		onClose: () => void;
		onUpdated: (updated: Sheet) => void;
	}

	let { datasheet, onClose, onUpdated }: Props = $props();

	let isImproving = $state(false);
	let improveTab = $state<'ai' | 'manual'>('ai');
	let refiningAi = $state(false);
	let feedbackText = $state('');
	let editedSpecsJson = $state('');
	let jsonError = $state('');
	let actionError = $state('');
	let loadingAction = $state(false);

	$effect(() => {
		if (datasheet?.cogneeConfig) {
			editedSpecsJson = JSON.stringify(datasheet.cogneeConfig, null, 2);
		}
		feedbackText = datasheet?.userNotes || '';
		actionError = '';
	});

	async function handleAccept() {
		if (!datasheet) return;
		loadingAction = true;
		actionError = '';
		try {
			const updated = await api.patch<Sheet>(`/datasheets/${datasheet._id}/review`, {
				action: 'accept'
			});
			onUpdated(updated);
			onClose();
		} catch (err: any) {
			actionError = err.message || 'Failed to accept specifications. Please try again.';
		} finally {
			loadingAction = false;
		}
	}

	async function handleImprove() {
		if (!datasheet) return;
		if (!isImproving) {
			isImproving = true;
			return;
		}

		jsonError = '';
		actionError = '';
		let parsedSpecs = null;
		try {
			parsedSpecs = JSON.parse(editedSpecsJson);
		} catch {
			jsonError = 'Invalid JSON syntax. Please check your formatting.';
			return;
		}

		loadingAction = true;
		try {
			const updated = await api.patch<Sheet>(`/datasheets/${datasheet._id}/review`, {
				action: 'improve',
				feedback: feedbackText.trim(),
				updatedSpecs: parsedSpecs
			});
			onUpdated(updated);
			isImproving = false;
			onClose();
		} catch (err: any) {
			actionError = err.message || 'Failed to save improvements. Please try again.';
		} finally {
			loadingAction = false;
		}
	}

	async function handleAiRefine() {
		if (!datasheet) return;
		refiningAi = true;
		actionError = '';
		try {
			const updated = await api.post<Sheet>(`/datasheets/${datasheet._id}/refine`, {
				prompt: feedbackText.trim()
			});
			onUpdated(updated);
			isImproving = false;
			onClose();
		} catch (err: any) {
			actionError = err.message || 'AI refinement failed. Please try again.';
		} finally {
			refiningAi = false;
		}
	}

	async function handleForget() {
		if (!datasheet) return;
		// Use a more accessible confirmation approach
		const confirmed = window.confirm(
			'Are you sure you want to forget and discard all extracted knowledge for this datasheet?'
		);
		if (!confirmed) return;
		loadingAction = true;
		actionError = '';
		try {
			const updated = await api.patch<Sheet>(`/datasheets/${datasheet._id}/review`, {
				action: 'forget'
			});
			onUpdated(updated);
			onClose();
		} catch (err: any) {
			actionError = err.message || 'Failed to discard specifications.';
		} finally {
			loadingAction = false;
		}
	}
</script>

{#if datasheet}
<div
	transition:fade={{ duration: 150 }}
	class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
	onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
	role="dialog"
	aria-modal="true"
	aria-labelledby="review-modal-title"
>
	<div
		transition:scale={{ duration: 180, start: 0.95 }}
		class="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
	>
		<!-- Modal Header -->
		<div class="px-6 py-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/80">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<div>
					<h3 id="review-modal-title" class="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">{datasheet.name}</h3>
					<div class="flex items-center gap-2 mt-0.5">
						<span class="text-xs text-slate-500 dark:text-zinc-400">Cognee Knowledge Graph</span>
						{#if datasheet.verificationStatus === 'accepted'}
							<span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">Verified &amp; Active</span>
						{:else if datasheet.verificationStatus === 'rejected'}
							<span class="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">Discarded</span>
						{:else}
							<span class="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">Pending Review</span>
						{/if}
					</div>
				</div>
			</div>
			<button onclick={onClose} class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition" aria-label="Close modal">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>

		<!-- Modal Body -->
		<div class="p-6 overflow-y-auto flex-1 space-y-6">
			<!-- Inline error display instead of alert() -->
			<ErrorBanner message={actionError} onDismiss={() => (actionError = '')} />

			<div class="bg-blue-50/60 dark:bg-indigo-950/30 border border-blue-200/60 dark:border-indigo-900/50 rounded-2xl p-4 text-xs text-blue-900 dark:text-indigo-200 leading-relaxed">
				<strong>Why verify?</strong> Verified hardware parameters are indexed into your Cognee Knowledge Graph, allowing the AI Copilot to accurately inspect pin compatibility, logic voltage thresholds, and pull-up requirements during schematic prototyping.
			</div>

			{#if !isImproving}
				<!-- View Mode: Rendered Specs -->
				<div>
					<h4 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Extracted Electrical Parameters</h4>
					{#if !datasheet.cogneeConfig || Object.keys(datasheet.cogneeConfig).length === 0}
						<div class="p-8 text-center text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
							No extracted details available. Click 'Improve / Refine' to manually input specifications.
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each Object.entries(datasheet.cogneeConfig) as [key, value]}
								<div class="p-3.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl {typeof value === 'object' && value !== null ? 'col-span-1 sm:col-span-2' : ''}">
									<span class="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">{key}</span>
									{#if typeof value === 'object' && value !== null}
										<pre class="text-xs font-mono text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-900 p-2.5 rounded-xl overflow-x-auto mt-1 leading-relaxed">{JSON.stringify(value, null, 2)}</pre>
									{:else}
										<span class="text-sm font-bold text-slate-900 dark:text-white break-words">{value}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Improve Mode: AI Refine or Manual JSON -->
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => (improveTab = 'ai')}
								class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 {improveTab === 'ai' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}"
							>
								✨ AI Refine (Recommended)
							</button>
							<button
								type="button"
								onclick={() => (improveTab = 'manual')}
								class="px-3 py-1.5 rounded-xl text-xs font-bold transition {improveTab === 'manual' ? 'bg-slate-800 dark:bg-zinc-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}"
							>
								Manual JSON Override
							</button>
						</div>
						<button onclick={() => (isImproving = false)} class="text-xs text-slate-500 dark:text-zinc-400 font-medium hover:underline">Cancel</button>
					</div>

					{#if improveTab === 'ai'}
						<div class="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-3">
							<p class="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
								Instruct Cognee AI on what specific parameters, pinout terminals, or dimensional accuracy to re-extract. Leave blank for automatic deep engineering re-analysis.
							</p>
							<div>
								<label class="block text-[11px] font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider mb-1.5" for="ai-prompt">Refinement Prompt</label>
								<input
									id="ai-prompt"
									type="text"
									bind:value={feedbackText}
									placeholder="e.g. Extract exact 5-pin terminal block L, N, FG, -V, +V and output current limit"
									class="w-full text-xs p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
								/>
							</div>
							<div class="flex justify-end pt-1">
								<button
									type="button"
									onclick={handleAiRefine}
									disabled={refiningAi}
									class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50"
								>
									{#if refiningAi}
										<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										Cognee Re-Analyzing...
									{:else}
										✨ AI Re-Analyze &amp; Refine Specs
									{/if}
								</button>
							</div>
						</div>
					{:else}
						{#if jsonError}
							<ErrorBanner message={jsonError} onDismiss={() => (jsonError = '')} />
						{/if}
						<div>
							<label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5" for="specs-json">Parameter Map (JSON)</label>
							<textarea id="specs-json" bind:value={editedSpecsJson} rows="8" class="w-full font-mono text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Modal Footer Actions -->
		<div class="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 flex items-center justify-between flex-wrap gap-3">
			<button
				onclick={handleForget}
				disabled={loadingAction || refiningAi}
				class="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1.5 disabled:opacity-50"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
				Forget / Discard
			</button>

			<div class="flex items-center gap-3">
				{#if !isImproving}
					<button
						onclick={handleImprove}
						disabled={loadingAction || refiningAi}
						class="px-4 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
					>
						✨ Improve / Refine with AI
					</button>
				{:else if improveTab === 'manual'}
					<button
						onclick={handleImprove}
						disabled={loadingAction || refiningAi}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
					>
						Save Manual JSON
					</button>
				{/if}

				{#if !isImproving}
					<button
						onclick={handleAccept}
						disabled={loadingAction || datasheet.verificationStatus === 'accepted'}
						class="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
						{datasheet.verificationStatus === 'accepted' ? 'Accepted' : 'Accept Knowledge'}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
{/if}
