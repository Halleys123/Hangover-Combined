<script lang="ts">
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import {
        SvelteFlowProvider,
        type Node,
        type Edge,
        type NodeTypes,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import HardwareNode from '$lib/components/HardwareNode.svelte';
    import CanvasInner from '$lib/components/CanvasInner.svelte';
    import VoltagePopover from '$lib/components/workspace/VoltagePopover.svelte';
    import AIChatPanel from '$lib/components/workspace/AIChatPanel.svelte';
    import RightLibraryPanel from '$lib/components/workspace/RightLibraryPanel.svelte';
    import NavBar from '$lib/components/NavBar.svelte';
    import { authUser } from '$lib/stores/auth';
    import { api } from '$lib/api';
    import { beforeNavigate, goto } from '$app/navigation';
    import { buildNodeFromComponent, nextPlacementPosition, resetPlacementCursor } from '$lib/utils/canvasHelpers.js';
    import { useAutoSave } from '$lib/composables/useAutoSave.svelte.js';
    import type { Comp, Sheet, ComponentDragPayload } from '$lib/types/index.js';

    // ── Node Types ─────────────────────────────────────────────────────────────
    const nodeTypes: NodeTypes = { hardware: HardwareNode };

    // ── Route ──────────────────────────────────────────────────────────────────
    let workspaceId = $state($page.params.id);
    let projectName = $state('');
    let projectDatasheets = $state<Sheet[]>([]);
    let projectComponents = $state<string[]>([]);
    let projectLoading = $state(true);

    // ── Canvas State (Svelte 5 $state — replaces writable stores) ──────────────
    let nodes = $state<Node[]>([]);
    let edges = $state<Edge[]>([]);
    let isLoaded = $state(false);

    // ── Auto-save composable ───────────────────────────────────────────────────
    const autoSave = useAutoSave(async () => {
        await api.put(`/projects/${workspaceId}/canvas`, { nodes, edges });
    }, 2000);

    // ── Panel Layout ───────────────────────────────────────────────────────────
    let leftWidth = $state(400);
    let rightWidth = $state(320);
    let leftCollapsed = $state(false);
    let rightCollapsed = $state(false);
    let draggingSide = $state<'left' | 'right' | null>(null);

    const MIN_PANEL_WIDTH = 260;
    const MAX_LEFT_WIDTH = 600;
    const MAX_RIGHT_WIDTH = 500;
    const COLLAPSE_THRESHOLD = 150;

    function startDrag(side: 'left' | 'right') { draggingSide = side; }

    function handlePointerMove(e: PointerEvent) {
        if (!draggingSide) return;
        if (draggingSide === 'left') {
            const w = e.clientX;
            if (w < COLLAPSE_THRESHOLD) { leftCollapsed = true; }
            else { leftCollapsed = false; leftWidth = Math.min(Math.max(w, MIN_PANEL_WIDTH), MAX_LEFT_WIDTH); }
        } else {
            const w = window.innerWidth - e.clientX;
            if (w < COLLAPSE_THRESHOLD) { rightCollapsed = true; }
            else { rightCollapsed = false; rightWidth = Math.min(Math.max(w, MIN_PANEL_WIDTH), MAX_RIGHT_WIDTH); }
        }
    }

    function handlePointerUp() { draggingSide = null; }

    // ── Canvas Controls ────────────────────────────────────────────────────────
    let isCanvasLocked = $state(false);
    let isFullscreen = $state(false);

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
        leftCollapsed = isFullscreen;
        rightCollapsed = isFullscreen;
    }

    // ── Navigation Guard ───────────────────────────────────────────────────────
    beforeNavigate((nav) => {
        if (autoSave.hasUnsavedChanges || autoSave.status === 'saving') {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                nav.cancel();
            }
        }
    });

    function handleBeforeUnload(e: BeforeUnloadEvent) {
        if (autoSave.hasUnsavedChanges || autoSave.status === 'saving') {
            e.preventDefault();
            e.returnValue = '';
        }
    }

    function goBack() {
        if (autoSave.hasUnsavedChanges || autoSave.status === 'saving') {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) return;
        }
        goto('/projects');
    }

    // ── Data Loading ───────────────────────────────────────────────────────────
    onMount(async () => {
        if (!$authUser) { goto('/login'); return; }
        try {
            const project = await api.get<any>(`/projects/${workspaceId}`);
            projectName = project.name;
            projectDatasheets = project.datasheets || [];
            projectComponents = project.components || [];
            nodes = project.canvas?.nodes ?? [];
            edges = project.canvas?.edges ?? [];

            projectLoading = false;
            // Small delay before enabling auto-save to ignore the initial load
            setTimeout(() => { isLoaded = true; }, 400);
        } catch (err: any) {
            if (err.message?.includes('Session expired')) return; // 401 already handled by api.ts
            goto('/projects');
        }
    });

    // ── Reactive Auto-save (triggered by canvas changes after initial load) ────
    $effect(() => {
        // Depend on nodes and edges — triggers when either changes
        if (nodes && edges && isLoaded) {
            autoSave.schedule();
        }
    });

    onDestroy(() => { autoSave.destroy(); });

    // ── Canvas Drop & Click ───────────────────────────────────────────────────
    function handleDropData(data: ComponentDragPayload, position: { x: number; y: number }) {
        const newNode = buildNodeFromComponent(data, position);
        nodes = [...nodes, newNode];
    }

    function handleComponentClicked(comp: Comp) {
        const position = nextPlacementPosition();
        handleDropData(
            { type: 'hardware', name: comp.name, description: comp.description, diagram: comp.diagram },
            position
        );
    }

    // ── Circuit Generated by AI ───────────────────────────────────────────────
    function handleCircuitGenerated(newNodes: Node[], newEdges: Edge[]) {
        nodes = newNodes;
        edges = newEdges;
        autoSave.schedule();
    }

    // ── Connection Validation & Voltage Popover ────────────────────────────────
    let isPopoverOpen = $state(false);
    let popoverSrcV = $state(5);
    let popoverTgtV = $state(3.3);
    let popoverTgtPin = $state('RX');
    let popoverCompName = $state('');
    let edgeToValidate = $state<Edge | null>(null);

    let lastEdgesCount = 0;
    $effect(() => {
        if (edges && edges.length > lastEdgesCount) {
            const addedEdge = edges[edges.length - 1];
            lastEdgesCount = edges.length;
            if (isLoaded) {
                validateConnection(addedEdge);
            }
        } else if (edges) {
            lastEdgesCount = edges.length;
        }
    });

    async function validateConnection(edge: Edge) {
        const srcNode = nodes.find(n => n.id === edge.source);
        const tgtNode = nodes.find(n => n.id === edge.target);
        if (!srcNode || !tgtNode) return;

        try {
            const res = await api.post<any>(`/projects/${workspaceId}/validate-connection`, {
                pinA: { componentName: srcNode.data.label, pinNumber: edge.sourceHandle },
                pinB: { componentName: tgtNode.data.label, pinNumber: edge.targetHandle }
            });

            if (res.status === 'UNSAFE') {
                edgeToValidate = edge;
                popoverCompName = String(tgtNode.data.label);
                popoverTgtPin = String(edge.targetHandle);
                
                // Parse voltages from warning explanation
                popoverSrcV = 5.0; 
                popoverTgtV = 3.3;
                const vOutMatch = res.reason.match(/outputs (\d+(\.\d+)?)\s*V/i);
                if (vOutMatch) popoverSrcV = parseFloat(vOutMatch[1]);
                const vInMatch = res.reason.match(/tolerance\s*\((\d+(\.\d+)?)\s*V\)/i) || res.reason.match(/exceeds\s*(\d+(\.\d+)?)\s*V/i) || res.reason.match(/operating input tolerance\s*\((\d+(\.\d+)?)\s*V\)/i);
                if (vInMatch) popoverTgtV = parseFloat(vInMatch[1]);

                isPopoverOpen = true;
            }
        } catch (err) {
            console.error('[Validation] Connection check failed:', err);
        }
    }

    function handlePopoverClose(action: 'cancel' | 'autofix') {
        if (action === 'cancel' && edgeToValidate) {
            edges = edges.filter(e => e.id !== edgeToValidate!.id);
            autoSave.schedule();
        } else if (action === 'autofix' && edgeToValidate) {
            // Remove the unsafe connection edge
            edges = edges.filter(e => e.id !== edgeToValidate!.id);

            // Spawn level shifter node
            const shifterId = `node-shifter-${Date.now()}`;
            const srcNodeObj = nodes.find(n => n.id === edgeToValidate!.source);
            const posX = srcNodeObj ? srcNodeObj.position.x + 180 : 100;
            const posY = srcNodeObj ? srcNodeObj.position.y + 80 : 150;

            const shifterNode: Node = {
                id: shifterId,
                type: 'hardware',
                position: { x: posX, y: posY },
                data: {
                    label: 'Logic Level Shifter',
                    subtitle: 'Optoelectronics / Level Shifter • AI Specs',
                    theme: 'green',
                    pins: {
                        left: [
                            { id: 'lv1', label: 'LV1 (Low Logic)', color: 'blue' },
                            { id: 'gnd_l', label: 'GND_L', color: 'gray' }
                        ],
                        right: [
                            { id: 'hv1', label: 'HV1 (High Logic)', color: 'blue' },
                            { id: 'gnd_h', label: 'GND_H', color: 'gray' }
                        ]
                    }
                }
            };

            nodes = [...nodes, shifterNode];

            // Re-route connection edges through shifter
            const wireHighSide = {
                id: `wire-high-${Date.now()}`,
                source: edgeToValidate!.source,
                sourceHandle: edgeToValidate!.sourceHandle,
                target: shifterId,
                targetHandle: 'hv1',
                animated: true
            };

            const wireLowSide = {
                id: `wire-low-${Date.now()}`,
                source: shifterId,
                sourceHandle: 'lv1',
                target: edgeToValidate!.target,
                targetHandle: edgeToValidate!.targetHandle,
                animated: true
            };

            edges = [...edges, wireHighSide, wireLowSide];
            autoSave.schedule();
        }
        edgeToValidate = null;
        isPopoverOpen = false;
    }

    // ── Datasheet attached from Library Panel ─────────────────────────────────
    // Key to force AIChatPanel to reload sessions instead of using window events
    let chatReloadKey = $state(0);

    function handleDatasheetAttached() {
        chatReloadKey++;
    }

    // ── Project Update from Library Panel ─────────────────────────────────────
    function handleProjectUpdate(updatedProject: any) {
        if (updatedProject?.canvas) {
            isLoaded = false;
            nodes = updatedProject.canvas.nodes ?? [];
            edges = updatedProject.canvas.edges ?? [];
            setTimeout(() => { isLoaded = true; }, 200);
        }
    }

    // ── Manual Save ───────────────────────────────────────────────────────────
    async function manualSave() { await autoSave.immediate(); }

    // ── Save Status Label ────────────────────────────────────────────────────
    let saveLabel = $derived(
        autoSave.status === 'saving' ? 'Saving…' :
        autoSave.status === 'saved'  ? 'Saved ✓' : 'Save Project'
    );
</script>

<svelte:head>
    <title>{projectName || 'Workspace'} — Hangover AI</title>
</svelte:head>

<svelte:window
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    onbeforeunload={handleBeforeUnload}
/>

<!-- MAIN WORKSPACE CANVAS PAGE -->
<div class="h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-hidden text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200">
    {#if !isFullscreen}
        <NavBar
            activeLink="projects"
            onLogoClick={goBack}
            actionLabel={saveLabel}
            onAction={manualSave}
            wide
            compact
            projectName={projectName}
            projectId={workspaceId}
        />
    {/if}

    {#if projectLoading}
        <!-- Full-page skeleton while project loads -->
        <div class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3 text-slate-400 dark:text-zinc-500">
                <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span class="text-sm font-medium">Loading workspace…</span>
            </div>
        </div>
    {:else}
        <div class="flex-1 flex w-full min-h-0">
            <!-- LEFT PANEL: AI Copilot -->
            {#if leftCollapsed}
                <button
                    onclick={() => (leftCollapsed = false)}
                    class="w-6 shrink-0 flex flex-col items-center justify-center gap-4 py-4 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 group transition-colors"
                    title="Show AI Copilot panel"
                >
                    <svg class="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-[9px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase select-none group-hover:text-blue-600 dark:group-hover:text-blue-400 [writing-mode:vertical-lr] rotate-180">
                        AI Copilot
                    </span>
                </button>
            {:else}
                <div
                    class="flex flex-col border-r border-slate-200 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 shrink-0 min-h-0 transition-colors"
                    style="width: {leftWidth}px;"
                >
                    <div class="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 text-slate-900 dark:text-white transition-colors shrink-0">
                        <div class="flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm-2-4a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                            <h2 class="font-semibold text-sm">AI Copilot</h2>
                        </div>
                        <button
                            onclick={() => (leftCollapsed = true)}
                            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Collapse panel"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                        <!-- chatReloadKey forces AIChatPanel to reload sessions when a datasheet is attached -->
                        {#key chatReloadKey}
                            <AIChatPanel {workspaceId} onCircuitGenerated={handleCircuitGenerated} />
                        {/key}
                    </div>
                </div>
                <div
                    class="w-1 shrink-0 cursor-col-resize bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 active:bg-blue-500 transition-colors"
                    onpointerdown={() => startDrag('left')}
                ></div>
            {/if}

            <!-- CENTER: Canvas -->
            <div class="flex-1 bg-[#FAFAFA] dark:bg-zinc-950 relative overflow-hidden flex flex-col z-0 transition-colors">
                <SvelteFlowProvider>
                    <CanvasInner
                        bind:nodes
                        bind:edges
                        {nodeTypes}
                        {isCanvasLocked}
                        {isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                        onToggleLock={() => (isCanvasLocked = !isCanvasLocked)}
                        onDropData={handleDropData}
                    />
                </SvelteFlowProvider>
                <VoltagePopover
                    bind:isOpen={isPopoverOpen}
                    sourceVoltage={popoverSrcV}
                    targetVoltage={popoverTgtV}
                    targetPin={popoverTgtPin}
                    componentName={popoverCompName}
                    onClose={handlePopoverClose}
                />
            </div>

            <!-- RIGHT PANEL: Library -->
            {#if rightCollapsed}
                <button
                    onclick={() => (rightCollapsed = false)}
                    class="w-6 shrink-0 flex flex-col items-center justify-center gap-4 py-4 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 group transition-colors"
                    title="Show Components panel"
                >
                    <svg class="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span class="text-[9px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase select-none group-hover:text-blue-600 dark:group-hover:text-blue-400 [writing-mode:vertical-lr] rotate-180">
                        Library
                    </span>
                </button>
            {:else}
                <div
                    class="w-1 shrink-0 cursor-col-resize bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 active:bg-blue-500 transition-colors"
                    onpointerdown={() => startDrag('right')}
                ></div>
                <div
                    class="bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col z-20 shrink-0 min-h-0 text-slate-900 dark:text-white transition-colors"
                    style="width: {rightWidth}px;"
                >
                    <div class="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 transition-colors shrink-0">
                        <h2 class="font-semibold text-sm">Library</h2>
                        <button
                            onclick={() => (rightCollapsed = true)}
                            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Collapse panel"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex-grow flex flex-col min-h-0 w-full overflow-hidden">
                        <RightLibraryPanel
                            {workspaceId}
                            bind:projectDatasheets
                            bind:projectComponents
                            onComponentClick={handleComponentClicked}
                            onProjectUpdate={handleProjectUpdate}
                            onDatasheetAttached={handleDatasheetAttached}
                        />
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    :global(body) { overflow: hidden; }
    :global(.svelte-flow__controls) {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        overflow: hidden !important;
    }
    :global(.dark .svelte-flow__controls) {
        background-color: #18181b !important;
        border: 1px solid #27272a !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5) !important;
    }
    :global(.svelte-flow__controls-button) {
        background-color: transparent !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #475569 !important;
        fill: #475569 !important;
        transition: background-color 0.15s ease !important;
    }
    :global(.svelte-flow__controls-button svg) { fill: currentColor !important; }
    :global(.svelte-flow__controls-button:hover) { background-color: #f1f5f9 !important; }
    :global(.dark .svelte-flow__controls-button) {
        border-bottom: 1px solid #27272a !important;
        color: #a1a1aa !important;
        fill: #a1a1aa !important;
    }
    :global(.dark .svelte-flow__controls-button:hover) { background-color: #27272a !important; }
    :global(.svelte-flow__controls-button:last-child) { border-bottom: none !important; }
</style>
