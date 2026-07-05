<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/projects', { replaceState: true });
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 text-sm font-medium">
	Redirecting to projects…
</div>
