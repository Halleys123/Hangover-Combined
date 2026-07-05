<script lang="ts">
	interface Props {
		message: string;
		onDismiss?: () => void;
		class?: string;
	}

	let { message, onDismiss, class: extraClass = '' }: Props = $props();
</script>

{#if message}
	<div
		class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3 {extraClass}"
		role="alert"
	>
		<svg class="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span class="flex-1">{message}</span>
		{#if onDismiss}
			<button
				onclick={onDismiss}
				class="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 shrink-0"
				aria-label="Dismiss error"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
