<script lang="ts">
	interface Props {
		isOpen?: boolean;
		onClose?: (action: 'cancel' | 'autofix') => void;
		sourceVoltage?: number;
		targetVoltage?: number;
		targetPin?: string;
		componentName?: string;
	}

	let {
		isOpen = $bindable(false),
		onClose,
		sourceVoltage = 5,
		targetVoltage = 3.3,
		targetPin = 'RX',
		componentName = 'target component',
	}: Props = $props();

	function close(action: 'cancel' | 'autofix' = 'cancel') {
		isOpen = false;
		onClose?.(action);
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="absolute inset-0 bg-gray-500/20 dark:bg-black/40 z-40 backdrop-blur-[1px]"
		onclick={() => close('cancel')}
		role="presentation"
	></div>

	<!-- Popover -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.18)] border border-gray-200 dark:border-zinc-700 p-6 w-[28rem] z-50">
		<div class="flex items-start justify-between mb-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
					<svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 dark:text-white">Voltage Mismatch Detected</h3>
			</div>
			<button onclick={() => close('cancel')} class="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors" aria-label="Close warning">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<p class="text-gray-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
			Applying
			<code class="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-800 dark:text-zinc-200 font-mono text-xs">{sourceVoltage}V</code>
			to the <strong>{componentName}</strong> <code class="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-800 dark:text-zinc-200 font-mono text-xs">{targetPin}</code> pin may cause damage.
			The logic level operates safely at
			<code class="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-800 dark:text-zinc-200 font-mono text-xs">{targetVoltage}V</code>.
		</p>

		<div class="bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-lg p-3 mb-6 flex gap-3 text-sm">
			<svg class="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
			</svg>
			<p class="text-slate-700 dark:text-zinc-300 font-medium">An AI auto-fix is available to safely bridge this connection.</p>
		</div>

		<div class="flex gap-3 justify-end mt-4">
			<button onclick={() => close('cancel')} class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium text-sm transition flex-1">
				Cancel Connection
			</button>
			<button onclick={() => close('autofix')} class="px-4 py-2 bg-slate-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-600 font-medium text-sm transition flex-[1.5]">
				Insert Logic Level Converter
			</button>
		</div>
	</div>
{/if}