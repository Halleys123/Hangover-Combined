<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	interface Props {
		isOpen?: boolean;
		onClose: () => void;
		maxWidth?: string;
	}

	let {
		isOpen = false,
		onClose,
		maxWidth = 'max-w-lg',
		children
	}: Props & { children?: any } = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && isOpen) onClose(); }} />

{#if isOpen}
	<div
		transition:fade={{ duration: 150 }}
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div
			transition:fly={{ y: -20, duration: 250 }}
			class="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-800 w-full {maxWidth} overflow-hidden"
		>
			{@render children?.()}
		</div>
	</div>
{/if}
