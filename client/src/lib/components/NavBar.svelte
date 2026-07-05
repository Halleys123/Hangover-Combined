<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface Props {
		activeLink?: 'home' | 'projects' | 'workspace' | 'datasheets';
		onLogoClick?: () => void;
		actionLabel?: string;
		onAction?: () => void;
		wide?: boolean;
		compact?: boolean;
		showBack?: boolean;
		onBackClick?: () => void;
		projectName?: string;
		projectId?: string;
	}

	let {
		activeLink = 'projects',
		onLogoClick,
		actionLabel,
		onAction,
		wide = true,
		compact = true,
		showBack = false,
		onBackClick,
		projectName = '',
		projectId = ''
	}: Props = $props();

	let isDark = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function handleBack() {
		if (onBackClick) {
			onBackClick();
		} else {
			window.history.back();
		}
	}

	function logout() {
		authUser.logout();
		goto('/login');
	}
</script>

<!-- TOP NAVIGATION BAR COMPONENT -->
<nav class="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 z-40 transition-colors duration-200">
	<div class="{wide ? 'w-full' : 'max-w-7xl mx-auto'} px-6 {compact ? 'py-3' : 'py-3.5'} flex items-center justify-between">
		
		<!-- BRAND LOGO, OPTIONAL BACK BUTTON & TITLE -->
		<div class="flex items-center gap-4">
			{#if showBack}
				<button
					onclick={handleBack}
					title="Go Back"
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-slate-200/60 dark:border-zinc-700"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
					Back
				</button>
			{/if}

			<div
				class="flex items-center gap-3 cursor-pointer group"
				onclick={() => {
					sessionStorage.setItem('user_pressed_home', 'true');
					if (onLogoClick) onLogoClick();
					else goto('/');
				}}
			>
				<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2L2 7l10 5 10-5-10-5zm0 10L2 17l10 5 10-5-10-5z" fill="currentColor"/>
					</svg>
				</div>
				<div class="flex items-center gap-2">
					<h1 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Hardware Prototyping Copilot</h1>
					{#if projectName}
						<span class="text-slate-300 dark:text-zinc-700">|</span>
						<span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 max-w-[150px] truncate" title={projectName}>{projectName}</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- NAVIGATION LINKS & ACTIONS CONNECTED TOGETHER ON THE RIGHT -->
		<div class="flex items-center gap-6">
			<a
				href="/"
				onclick={() => sessionStorage.setItem('user_pressed_home', 'true')}
				class={activeLink === 'home'
					? `text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400 ${compact ? 'pb-3.5 -mb-3.5' : 'pb-4 -mb-4'}`
					: 'text-slate-500 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors'}
			>Home</a>
			<a
				href={projectId ? `/projects/${projectId}` : '/projects'}
				class={activeLink === 'projects' || activeLink === 'workspace'
					? `text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400 ${compact ? 'pb-3.5 -mb-3.5' : 'pb-4 -mb-4'}`
					: 'text-slate-500 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors'}
			>Projects</a>
			<a
				href={projectId ? `/datasheets?project=${projectId}` : '/datasheets'}
				class={activeLink === 'datasheets'
					? `text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400 ${compact ? 'pb-3.5 -mb-3.5' : 'pb-4 -mb-4'}`
					: 'text-slate-500 dark:text-zinc-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors'}
			>Datasheets</a>

			{#if actionLabel}
				<button
					onclick={onAction}
					class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all"
				>
					{actionLabel}
				</button>
			{/if}

			<!-- THEME TOGGLE BUTTON -->
			<button
				onclick={toggleTheme}
				title="Toggle Dark Mode"
				class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
			>
				{#if isDark}
					<!-- Sun Icon for Dark Mode -->
					<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<!-- Moon Icon for Light Mode -->
					<svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>

			<!-- USER PROFILE SECTION -->
			{#if $authUser}
				<div class="flex items-center gap-3 border-l border-slate-200/80 dark:border-zinc-800 pl-6">
					<div class="flex items-center gap-2">
						<div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-zinc-300">
							{$authUser.name ? $authUser.name[0].toUpperCase() : 'U'}
						</div>
						<span class="text-sm text-slate-700 dark:text-zinc-300 font-medium">{$authUser.name}</span>
					</div>
					<button
						onclick={logout}
						class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all border border-transparent hover:border-rose-200/60 dark:hover:border-rose-900/60"
					>Logout</button>
				</div>
			{:else}
				<div class="flex items-center gap-3 border-l border-slate-200/80 dark:border-zinc-800 pl-6">
					<a href="/login" class="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-zinc-800 transition-all">Log in</a>
					<a
						href="/signup"
						class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all"
					>Sign up</a>
				</div>
			{/if}
		</div>
	</div>
</nav>
