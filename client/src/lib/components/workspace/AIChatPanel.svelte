<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { api } from '$lib/api';
	import type { Message, Session } from '$lib/types/index.js';

	interface Props {
		workspaceId?: string;
		onCircuitGenerated?: (nodes: any[], edges: any[]) => void;
	}

	let {
		workspaceId = '',
		onCircuitGenerated = undefined,
	}: Props = $props();

	let messages = $state<Message[]>([
		{ role: 'assistant', text: 'Hello! I am your **AI Hardware Architect**. Tell me what project or circuit goal you want to build!', timestamp: new Date() }
	]);

	let sessions = $state<Session[]>([]);
	let activeSessionId = $state<string>('');
	let inputValue = $state('');
	let loading = $state(false);
	let startingNewChat = $state(false);
	let lastSentQuery = $state('');
	let showErrorModal = $state(false);
	let isEditingTitle = $state(false);
	let newTitleValue = $state('');

	// Store as plain let — AbortController is a DOM object, not reactive state
	let abortController: AbortController | null = null;
	let pollingInterval: ReturnType<typeof setInterval> | null = null;

	// ── Safe HTML rendering (XSS protection) ─────────────────────────────────
	function safeMarkdown(text: string): string {
		const raw = marked.parse(text || '') as string;
		return DOMPurify.sanitize(raw);
	}

	// ── Session Management ────────────────────────────────────────────────────

	function startRename() {
		const currentSession = sessions.find(s => s._id === activeSessionId);
		if (currentSession) {
			newTitleValue = currentSession.title;
			isEditingTitle = true;
		}
	}

	async function handleSaveTitle() {
		const trimmedTitle = newTitleValue.trim();
		if (!trimmedTitle || !workspaceId || !activeSessionId) {
			isEditingTitle = false;
			return;
		}
		try {
			await api.put(`/projects/${workspaceId}/chat/sessions/${activeSessionId}/rename`, { title: trimmedTitle });
			isEditingTitle = false;
			await loadSessions();
		} catch (err) {
			console.error('Failed to rename session:', err);
		}
	}

	async function loadSessions(selectNewest = false) {
		if (!workspaceId) return;
		try {
			const list = await api.get<Session[]>(`/projects/${workspaceId}/chat/sessions`);
			sessions = list;
			if (list.length > 0) {
				if (selectNewest) {
					activeSessionId = list[list.length - 1]._id;
				} else if (!activeSessionId) {
					activeSessionId = list[0]._id;
				}
			}
		} catch (e) {
			console.error('Failed to load chat sessions:', e);
		}
	}

	async function loadActiveSessionMessages() {
		if (!workspaceId || !activeSessionId) return;
		try {
			const history = await api.get<Message[]>(`/projects/${workspaceId}/chat?sessionId=${activeSessionId}`);
			messages = history;
			const lastMsg = history[history.length - 1];
			if (lastMsg && lastMsg.role === 'user') {
				loading = true;
				startPollingForAssistantResponse();
			} else {
				loading = false;
			}
		} catch (err) {
			console.error('Error loading session messages:', err);
		}
	}

	function startPollingForAssistantResponse() {
		// Clear any existing interval before starting a new one
		if (pollingInterval) clearInterval(pollingInterval);
		let attempts = 0;
		const maxAttempts = 40; // ~60 seconds

		pollingInterval = setInterval(async () => {
			attempts++;
			if (attempts > maxAttempts) {
				clearInterval(pollingInterval!);
				pollingInterval = null;
				loading = false;
				return;
			}
			try {
				const history = await api.get<Message[]>(`/projects/${workspaceId}/chat?sessionId=${activeSessionId}`);
				if (Array.isArray(history) && history.length > 0) {
					const lastMsg = history[history.length - 1];
					if (lastMsg.role === 'assistant') {
						messages = history;
						loading = false;
						clearInterval(pollingInterval!);
						pollingInterval = null;
					}
				}
			} catch (e) {
				console.error('Error polling for response:', e);
			}
		}, 1500);
	}

	function stopGeneration() {
		abortController?.abort();
		abortController = null;
		if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
		loading = false;
	}

	onMount(async () => {
		if (workspaceId) await loadSessions();
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});


	$effect(() => {
		if (activeSessionId) loadActiveSessionMessages();
	});

	async function handleNewChat() {
		if (!workspaceId || startingNewChat || loading) return;
		startingNewChat = true;
		try {
			const res = await api.post<any>(`/projects/${workspaceId}/chat/new`);
			if (res?.sessionId) {
				activeSessionId = res.sessionId;
				await loadSessions();
			}
		} catch (err) {
			console.error('Failed to start new chat:', err);
		} finally {
			startingNewChat = false;
		}
	}

	async function handleSendMessage(e?: Event) {
		if (e) e.preventDefault();
		const userText = inputValue.trim();
		if (!userText || loading) return;

		lastSentQuery = userText;
		messages = [...messages, { role: 'user', text: userText, timestamp: new Date() }];
		inputValue = '';
		loading = true;
		abortController = new AbortController();

		try {
			if (workspaceId) {
				const res = await api.post<any>(
					`/projects/${workspaceId}/chat`,
					{ query: userText, sessionId: activeSessionId },
					{ signal: abortController.signal }
				);

				await loadActiveSessionMessages();

				if (res.type === 'circuit_generated' && res.nodes && res.edges && onCircuitGenerated) {
					onCircuitGenerated(res.nodes, res.edges);
				}
			} else {
				const res = await api.post<any>('/chat', { message: userText, history: messages }, { signal: abortController.signal });
				messages = [...messages, {
					role: 'assistant',
					text: res.reply || res.message || 'I analyzed your query.',
					timestamp: new Date()
				}];
			}
		} catch (err: any) {
			if (err.name === 'AbortError') {
				messages = [...messages, { role: 'assistant', text: '*Generation stopped by user.*', timestamp: new Date() }];
			} else {
				console.error('Send message error:', err);
				showErrorModal = true;
			}
		} finally {
			loading = false;
			abortController = null;
		}
	}
</script>

<div class="flex-1 flex flex-col min-h-0 h-full w-full relative">
	<!-- Chat Panel Header -->
	{#if workspaceId}
	<div class="px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-2 shrink-0">
		<div class="flex items-center gap-1.5 min-w-0 flex-1">
			{#if isEditingTitle}
				<input
					type="text"
					bind:value={newTitleValue}
					onkeydown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') isEditingTitle = false; }}
					class="bg-white dark:bg-zinc-850 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none focus:border-blue-500 transition w-full max-w-[150px]"
					autofocus
				/>
				<button onclick={handleSaveTitle} class="p-0.5 text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition shrink-0" title="Save Title">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
				</button>
				<button onclick={() => (isEditingTitle = false)} class="p-0.5 text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition shrink-0" title="Cancel">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			{:else}
				<select
					bind:value={activeSessionId}
					class="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded px-2 py-1 text-[11px] font-medium outline-none focus:border-blue-500 transition max-w-[140px] truncate"
				>
					{#each sessions as session (session._id)}
						<option value={session._id}>{session.title}</option>
					{/each}
				</select>
				<button onclick={startRename} disabled={loading} class="p-1 text-slate-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition shrink-0" title="Rename Chat Session">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
				</button>
			{/if}
		</div>

		<button
			onclick={handleNewChat}
			disabled={startingNewChat || loading}
			class="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 rounded text-[11px] font-semibold transition shadow-sm disabled:opacity-50 shrink-0"
			title="Start a fresh chat while preserving conversation summary for AI"
		>
			<svg class="w-3 h-3 {startingNewChat ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if startingNewChat}
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
				{/if}
			</svg>
			{startingNewChat ? 'Summarizing…' : 'New Chat'}
		</button>
	</div>
	{/if}

	<!-- Messages List -->
	<div class="flex-1 overflow-y-auto p-4 space-y-4">
		{#each messages as msg (JSON.stringify(msg.timestamp) + msg.role)}
			<div class="flex gap-3 {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
				{#if msg.role === 'assistant'}
					<div class="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center mt-1">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm-2-4a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
					</div>
				{/if}
				<div class="max-w-[85%] px-4 py-3 rounded-2xl {msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-bl-sm shadow-sm'} text-sm leading-relaxed transition-colors overflow-hidden">
					{#if msg.role === 'assistant'}
						<!-- DOMPurify sanitizes XSS before rendering -->
						<div class="markdown-body text-xs sm:text-sm leading-relaxed">
							{@html safeMarkdown(msg.text)}
						</div>
					{:else}
						<p class="whitespace-pre-wrap">{msg.text}</p>
					{/if}
				</div>
				{#if msg.role === 'user'}
					<div class="w-6 h-6 rounded-full bg-slate-300 dark:bg-zinc-700 shrink-0 mt-1 flex items-center justify-center">
						<svg class="w-4 h-4 text-slate-600 dark:text-zinc-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
					</div>
				{/if}
			</div>
		{/each}

		{#if loading || startingNewChat}
			<div class="flex gap-3 justify-start">
				<div class="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center mt-1">
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
				</div>
				<div class="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-xs rounded-bl-sm shadow-sm animate-pulse">
					{startingNewChat ? 'Summarizing project history &amp; preparing new session…' : 'AI Architect is thinking &amp; checking Cognee graph...'}
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 transition-colors shrink-0">
		<form onsubmit={handleSendMessage} class="relative">
			<input
				type="text"
				bind:value={inputValue}
				placeholder={loading ? 'AI is thinking…' : 'Ask Copilot to build a circuit…'}
				disabled={loading}
				class="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
			/>
			{#if loading}
				<button
					type="button"
					onclick={stopGeneration}
					class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
					title="Stop generating"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>
				</button>
			{:else}
				<button
					type="submit"
					disabled={!inputValue.trim()}
					aria-label="Send message"
					class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
				>
					<svg class="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
				</button>
			{/if}
		</form>
	</div>
</div>

<!-- Error Regeneration Modal -->
{#if showErrorModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-xs px-4">
		<div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 w-full max-w-sm p-6 space-y-4">
			<h3 class="text-base font-semibold text-slate-900 dark:text-white">Generation Error</h3>
			<p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
				An error occurred while generating the AI response. Would you like to try regenerating?
			</p>
			<div class="flex items-center justify-end gap-2.5 pt-2">
				<button
					type="button"
					onclick={() => { showErrorModal = false; inputValue = lastSentQuery; }}
					class="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => { showErrorModal = false; inputValue = lastSentQuery; handleSendMessage(); }}
					class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
				>
					Regenerate
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.markdown-body p) { margin-bottom: 0.6rem; }
	:global(.markdown-body p:last-child) { margin-bottom: 0; }
	:global(.markdown-body h1), :global(.markdown-body h2), :global(.markdown-body h3), :global(.markdown-body h4) { font-weight: 700; margin-top: 0.85rem; margin-bottom: 0.4rem; color: inherit; }
	:global(.markdown-body ul) { list-style-type: disc; padding-left: 1.25rem; margin-top: 0.4rem; margin-bottom: 0.6rem; }
	:global(.markdown-body ol) { list-style-type: decimal; padding-left: 1.25rem; margin-top: 0.4rem; margin-bottom: 0.6rem; }
	:global(.markdown-body li) { margin-bottom: 0.3rem; }
	:global(.markdown-body strong) { font-weight: 600; color: inherit; }
	:global(.markdown-body code) { background-color: rgba(128,128,128,0.18); padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.88em; }
	:global(.markdown-body pre) { background-color: rgba(15,23,42,0.85); color: #f8fafc; padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; font-family: monospace; font-size: 0.85em; margin-top: 0.5rem; margin-bottom: 0.5rem; }
	:global(.markdown-body pre code) { background-color: transparent; padding: 0; }
</style>