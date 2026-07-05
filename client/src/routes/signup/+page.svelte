<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import { api } from '$lib/api';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSignup(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			const { token, user } = await api.post<{ token: string; user: any }>('/auth/signup', {
				name,
				email,
				password
			});
			authUser.login(user, token);
			window.location.href = '/projects';
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
	import NavBar from '$lib/components/NavBar.svelte';
</script>

<!-- SIGNUP PAGE CONTAINER -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col justify-between transition-colors duration-200">
	<NavBar showBack={true} onLogoClick={() => (window.location.href = '/')} />

	<div class="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
		<div class="sm:mx-auto sm:w-full sm:max-w-md">
			<h2 class="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create your account</h2>
			<p class="mt-1 text-center text-sm text-slate-500 dark:text-zinc-400">
				Already have an account? <a href="/login" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">Sign in here</a>
			</p>
		</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
		<div class="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl py-8 px-6 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-2xl border border-slate-200/80 dark:border-zinc-800 sm:px-10 transition-colors duration-200">
			{#if error}
				<div class="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
					<svg class="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={handleSignup} class="space-y-5">
				<div>
					<label class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5" for="name">Full Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						autocomplete="name"
						placeholder="Ada Lovelace"
						class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5" for="email">Email address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						placeholder="you@example.com"
						class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5" for="password">Password</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						minlength={8}
						autocomplete="new-password"
						placeholder="Min. 8 characters"
						class="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
					/>
				</div>

				<div class="pt-2">
					<button
						type="submit"
						disabled={loading}
						class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-medium rounded-xl shadow-sm shadow-indigo-500/20 transition-all duration-150 flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
					>
						{#if loading}
							<svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Creating account…</span>
						{:else}
							<span>Create Account</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
	</div>
</div>
