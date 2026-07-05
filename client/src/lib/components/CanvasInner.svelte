<script lang="ts">
	import { SvelteFlow, Background, Controls, useSvelteFlow, type Node, type Edge, type NodeTypes } from '@xyflow/svelte';
	
	interface Props {
		nodes: any;
		edges: any;
		nodeTypes: NodeTypes;
		isCanvasLocked: boolean;
		isFullscreen: boolean;
		onToggleFullscreen: () => void;
		onToggleLock: () => void;
		onDropData: (data: any, position: { x: number, y: number }) => void;
	}

	let {
		nodes = $bindable(),
		edges = $bindable(),
		nodeTypes,
		isCanvasLocked,
		isFullscreen,
		onToggleFullscreen,
		onToggleLock,
		onDropData
	}: Props = $props();

	const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useSvelteFlow();

	function handleDropWrapper(event: DragEvent) {
		event.preventDefault();
		const dataStr = event.dataTransfer?.getData('application/svelteflow');
		if (!dataStr) return;
		
		try {
			const data = JSON.parse(dataStr);
			const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
			onDropData(data, position);
		} catch { }
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
	}

	// CONTEXT MENU STATE & DELETION HANDLERS
	let contextMenu = $state<{ x: number; y: number; type: 'node' | 'edge'; targetId: string } | null>(null);

	function handleNodeContextMenu(event: any, node?: any) {
		const ev = event?.event || event;
		const targetNode = event?.node || node;
		if (!ev || !targetNode) return;
		ev.preventDefault();
		if (isCanvasLocked) return;
		contextMenu = {
			x: ev.clientX,
			y: ev.clientY,
			type: 'node',
			targetId: targetNode.id
		};
	}

	function handleEdgeContextMenu(event: any, edge?: any) {
		const ev = event?.event || event;
		const targetEdge = event?.edge || edge;
		if (!ev || !targetEdge) return;
		ev.preventDefault();
		if (isCanvasLocked) return;
		contextMenu = {
			x: ev.clientX,
			y: ev.clientY,
			type: 'edge',
			targetId: targetEdge.id
		};
	}

	function handleDelete() {
		if (!contextMenu) return;
		const idToDelete = contextMenu.targetId;
		if (contextMenu.type === 'node') {
			nodes = nodes.filter((n: any) => n.id !== idToDelete);
			edges = edges.filter((e: any) => e.source !== idToDelete && e.target !== idToDelete);
		} else {
			edges = edges.filter((e: any) => e.id !== idToDelete);
		}
		contextMenu = null;
	}
</script>

<!-- WINDOW EVENTS TO DISMISS MENU -->
<svelte:window 
	onclick={() => (contextMenu = null)} 
	onwheel={() => (contextMenu = null)} 
	onkeydown={(e) => { if (e.key === 'Escape') contextMenu = null; }} 
/>

<!-- CANVAS INNER & SVELTEFLOW CONTAINER -->
<div class="w-full h-full relative" ondrop={handleDropWrapper} ondragover={handleDragOver} ondragenter={handleDragEnter}>
	<SvelteFlow 
		bind:nodes
		bind:edges
		{nodeTypes} 
		fitView 
		nodesDraggable={!isCanvasLocked}
		nodesConnectable={!isCanvasLocked}
		elementsSelectable={!isCanvasLocked}
		panOnDrag={!isCanvasLocked}
		zoomOnScroll={!isCanvasLocked}
		onnodecontextmenu={handleNodeContextMenu}
		onedgecontextmenu={handleEdgeContextMenu}
		onpaneclick={() => (contextMenu = null)}
		onpanecontextmenu={(e) => { const ev = e.event || e; ev.preventDefault(); contextMenu = null; }}
	>
		<Background />
		<!-- Regular floating controls -->
		<Controls showZoom={true} showFitView={true} showLock={false} />
	</SvelteFlow>

	<!-- CONTEXT MENU MODAL OVERLAY -->
	{#if contextMenu}
		<div 
			class="fixed z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 min-w-[160px] transition-colors"
			style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		>
			<button 
				onclick={handleDelete}
				class="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				Delete {contextMenu.type === 'node' ? 'Component' : 'Connection'}
			</button>
		</div>
	{/if}

	<!-- ACTION BAR FLOATING OVERLAY -->
	<div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-zinc-800 px-3 py-1.5 flex items-center gap-3 text-sm text-slate-700 dark:text-zinc-300 z-10 pointer-events-auto transition-colors">
		<button title="Zoom Out" class="hover:text-blue-600 dark:hover:text-blue-400 w-8 h-8 flex items-center justify-center font-bold text-xl bg-slate-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-colors" onclick={() => zoomOut({duration: 200})}>-</button>
		<span class="font-bold text-[10px] tracking-widest text-slate-400 dark:text-zinc-500">CANVAS</span>
		<button title="Zoom In" class="hover:text-blue-600 dark:hover:text-blue-400 w-8 h-8 flex items-center justify-center font-bold text-xl bg-slate-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-colors" onclick={() => zoomIn({duration: 200})}>+</button>
		
		<div class="w-px h-5 bg-slate-300 dark:bg-zinc-700"></div>
		
		<button title="Route & Center View" onclick={() => fitView({duration: 800, padding: 0.2})} class="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
			Auto / Center
		</button>
		
		<div class="w-px h-5 bg-slate-300 dark:bg-zinc-700"></div>
		
		<button title="Lock / Unlock Items" class="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50 {isCanvasLocked ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}" onclick={onToggleLock}>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if isCanvasLocked}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
				{/if}
			</svg>
			{isCanvasLocked ? 'Locked' : 'Lock'}
		</button>
		
		<div class="w-px h-5 bg-slate-300 dark:bg-zinc-700"></div>
		
		<button title="Toggle Fullscreen" class="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50" onclick={onToggleFullscreen}>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if isFullscreen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9L4 4m0 0v4m0-4h4m6 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m6-5l5 5m0 0v-4m0 4h-4" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
				{/if}
			</svg>
			{isFullscreen ? 'Exit Full' : 'Full Screen'}
		</button>
	</div>
</div>