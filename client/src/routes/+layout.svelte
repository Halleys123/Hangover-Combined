<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';

	const { children } = $props();

	onMount(() => {
		// Initialize theme from localStorage or system preference
		const saved = localStorage.getItem('theme');
		if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<!-- ROOT LAYOUT WRAPPER -->
<div class="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200 relative overflow-x-hidden">
	{#if $navigating}
		<!-- Thin animated progress bar for network loading feedback -->
		<div transition:fade={{ duration: 120 }} class="fixed top-0 left-0 right-0 h-[2px] z-[100] overflow-hidden bg-blue-100 dark:bg-blue-950/50">
			<div class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full nav-progress-bar"></div>
		</div>
	{/if}

	<!-- Page content rendered cleanly without artificial fading or black flashes -->
	<div class="w-full min-h-screen flex flex-col">
		{@render children()}
	</div>
</div>

<style>
	.nav-progress-bar {
		animation: progress-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes progress-sweep {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}
</style>
