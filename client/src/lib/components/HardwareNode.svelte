<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeTheme, Pin } from '$lib/types/index.js';

	interface Props {
		data: {
			label: string;
			theme: NodeTheme;
			pins: {
				left: Pin[];
				right: Pin[];
			};
		};
	}

	let { data }: Props = $props();

	let colors = $derived(THEME_COLORS[data.theme] ?? THEME_COLORS.blue);
</script>

<!-- Outer Container -->
<div
	class="{colors.bg} rounded-xl border {colors.border} {colors.shadow} p-4 font-mono min-w-[15rem] max-w-[22rem] w-auto relative"
	style="background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 10px 10px;"
>
	<!-- Header -->
	<div class="flex items-center gap-2 mb-6">
		<div class="w-2 h-2 rounded-full {data.theme === 'orange' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'}"></div>
		<h3 class="{colors.header} text-sm font-bold tracking-widest">{data.label}</h3>
	</div>

	<div class="flex justify-between gap-6 relative min-h-[120px]">
		<!-- Center Chip -->
		<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded {colors.chip} border"></div>

		<!-- Left Pins -->
		<div class="flex flex-col gap-4 relative z-10 w-full justify-start">
			{#each data?.pins?.left ?? [] as pin (pin.id)}
				<div class="flex items-center justify-start relative w-full h-4">
					<Handle
						type="target"
						position={Position.Left}
						id={pin.id}
						style="left: -20px; background: transparent; border: none; width: 12px; height: 12px; margin-top: -6px;"
					>
						<div class="w-3 h-3 rounded-full {getPinColorClass(pin.color)}"></div>
					</Handle>
					<Handle
						type="source"
						position={Position.Left}
						id={pin.id}
						style="left: -20px; background: transparent; border: none; width: 12px; height: 12px; margin-top: -6px; opacity: 0;"
					/>
					<span class="text-[9px] text-slate-400 ml-1 font-bold whitespace-nowrap">{pin.label}</span>
				</div>
			{/each}
		</div>

		<!-- Right Pins -->
		<div class="flex flex-col gap-4 relative z-10 w-full text-right justify-start">
			{#each data?.pins?.right ?? [] as pin (pin.id)}
				<div class="flex items-center justify-end relative w-full h-4">
					<span class="text-[9px] text-slate-400 mr-1 font-bold whitespace-nowrap">{pin.label}</span>
					<Handle
						type="source"
						position={Position.Right}
						id={pin.id}
						style="right: -20px; background: transparent; border: none; width: 12px; height: 12px; margin-top: -6px;"
					>
						<div class="w-3 h-3 rounded-full {getPinColorClass(pin.color)}"></div>
					</Handle>
					<Handle
						type="target"
						position={Position.Right}
						id={pin.id}
						style="right: -20px; background: transparent; border: none; width: 12px; height: 12px; margin-top: -6px; opacity: 0;"
					/>
				</div>
			{/each}
		</div>
	</div>
</div>

<script module lang="ts">
	// Hoisted to module scope — created once, shared across all HardwareNode instances.
	const THEME_COLORS = {
		orange: {
			border: 'border-orange-500/30',
			header: 'text-orange-500',
			shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]',
			bg: 'bg-[#0f1115]',
			chip: 'bg-[#1a1311] border-orange-500/20',
		},
		blue: {
			border: 'border-blue-500/30',
			header: 'text-blue-500',
			shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]',
			bg: 'bg-[#0f1115]',
			chip: 'bg-[#11131a] border-blue-500/20',
		},
	} as const;

	const PIN_COLOR_MAP: Record<string, string> = {
		red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
		gray: 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.6)]',
		blue: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
		green: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
		yellow: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
		pink: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.6)]',
		purple: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
	};

	export function getPinColorClass(color: string): string {
		return PIN_COLOR_MAP[color] ?? PIN_COLOR_MAP.gray;
	}
</script>