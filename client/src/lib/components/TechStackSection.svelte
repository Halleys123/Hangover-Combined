<script lang="ts">
    import { onMount } from "svelte";

    let activeTech = $state(0);
    let isHovered = $state(false);

    const techStack = [
        {
            name: "Node.js 22+",
            category: "Backend Runtime",
            description:
                "High-performance asynchronous backend engine powering our REST API, handling heavy PDF buffer ingestion and multi-stage text processing.",
            color: "#339933",
            textColor: "text-[#47A248]",
            borderColor: "border-[#339933]",
            bgColor: "bg-[#339933]/10",
            path: "M 400 275 C 370 210, 430 150, 400 80",
            dur: "2.2",
            icon: `<svg class="w-full h-full text-[#47A248]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.984 0l-10.23 5.9v11.8l10.23 5.9 10.23-5.9V5.9l-10.23-5.9zm0 1.848l8.63 4.982v9.964l-8.63 4.982-8.63-4.982V6.83l8.63-4.982zm-.96 6.06v6.624l-1.92-1.108V8.908h-1.6v5.44l3.52 2.032v-7.472h-.001z"/></svg>`,
        },
        {
            name: "TypeScript 5.4",
            category: "Type Safety",
            description:
                "Enforces strict end-to-end type safety across client and server. Guarantees deterministic schema healing and prevents runtime data corruption.",
            color: "#3178C6",
            textColor: "text-[#3178C6]",
            borderColor: "border-[#3178C6]",
            bgColor: "bg-[#3178C6]/10",
            path: "M 400 275 C 490 275, 530 140, 610 140",
            dur: "2.6",
            icon: `<svg class="w-full h-full text-[#3178C6]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zm10.73 10.054v-.566h4.526v-.966h-4.526v-.566h4.862V9.896H12.39v4.22h4.862v-.566h-3.522zm-5.462-1.132v2.192H9.72V11.92h2.202V10.87H6.066v1.05h2.202z"/></svg>`,
        },
        {
            name: "Svelte 5 & Kit",
            category: "Reactive Frontend",
            description:
                "Powering our ultra-reactive UI with Svelte 5 runes ($state, $derived), sleek dark mode glassmorphism, and instant routing without page reloads.",
            color: "#FF3E00",
            textColor: "text-[#FF3E00]",
            borderColor: "border-[#FF3E00]",
            bgColor: "bg-[#FF3E00]/10",
            path: "M 400 275 C 500 240, 580 310, 680 275",
            dur: "2.0",
            icon: `<svg class="w-full h-full text-[#FF3E00]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.25 7.025a4.875 4.875 0 0 0-6.9-1.325L6.6 9.575a4.875 4.875 0 0 0-1.325 6.9 4.875 4.875 0 0 0 6.9 1.325l6.75-3.875a4.875 4.875 0 0 0 1.325-6.9zM11.3 16.425a2.625 2.625 0 0 1-3.7-.725 2.625 2.625 0 0 1 .725-3.7l6.75-3.875a2.625 2.625 0 0 1 3.7.725 2.625 2.625 0 0 1-.725 3.7l-6.75 3.875z"/></svg>`,
        },
        {
            name: "Cognee Cloud",
            category: "Cognitive AI Engine",
            description:
                "Our core AI memory graph! Constructs relational knowledge graphs from raw PDF datasheets, enabling zero-hallucination DRC checks and memory recall.",
            color: "#A855F7",
            textColor: "text-[#A855F7]",
            borderColor: "border-[#A855F7]",
            bgColor: "bg-[#A855F7]/10",
            path: "M 400 275 C 490 275, 530 410, 610 410",
            dur: "2.4",
            icon: `<svg class="w-full h-full text-[#A855F7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
        },
        {
            name: "MongoDB 8.0+",
            category: "Persistence Store",
            description:
                "Our robust document database. Persists user accounts, project metadata, and interactive visual canvas coordinates (nodes and edges).",
            color: "#47A248",
            textColor: "text-[#47A248]",
            borderColor: "border-[#47A248]",
            bgColor: "bg-[#47A248]/10",
            path: "M 400 275 C 430 340, 370 400, 400 470",
            dur: "2.8",
            icon: `<svg class="w-full h-full text-[#47A248]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16.5v-3.3c-2.03-.4-3.5-2.2-3.5-4.37 0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5c0 2.17-1.47 3.97-3.5 4.37v3.3c3.15-.56 5.5-3.33 5.5-6.67 0-3.73-3.02-6.75-6.75-6.75S5.25 8.27 5.25 12c0 3.34 2.35 6.11 5.75 6.67z"/></svg>`,
        },
        {
            name: "React Flow",
            category: "Schematic Canvas",
            description:
                "Renders the interactive node-based schematic canvas. Manages drag-and-drop IC positioning, custom hardware nodes, and animated wiring.",
            color: "#FF0072",
            textColor: "text-[#FF0072]",
            borderColor: "border-[#FF0072]",
            bgColor: "bg-[#FF0072]/10",
            path: "M 400 275 C 310 275, 270 410, 190 410",
            dur: "2.1",
            icon: `<svg class="w-full h-full text-[#FF0072]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
        },
        {
            name: "Express 4.19",
            category: "REST API Server",
            description:
                "Lightweight and robust backend routing framework. Orchestrates PDF upload endpoints, multer file buffering, and Cognee cloud graph synchronization.",
            color: "#94A3B8",
            textColor: "text-[#94A3B8]",
            borderColor: "border-[#94A3B8]",
            bgColor: "bg-[#94A3B8]/10",
            path: "M 400 275 C 300 310, 220 240, 120 275",
            dur: "2.5",
            icon: `<svg class="w-full h-full text-[#94A3B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>`,
        },
        {
            name: "Tailwind CSS",
            category: "Design System",
            description:
                "Provides state-of-the-art styling, glassmorphism effects, custom gradients, and fluid micro-animations for an executive-grade user experience.",
            color: "#38BDF8",
            textColor: "text-[#38BDF8]",
            borderColor: "border-[#38BDF8]",
            bgColor: "bg-[#38BDF8]/10",
            path: "M 400 275 C 310 275, 270 140, 190 140",
            dur: "2.3",
            icon: `<svg class="w-full h-full text-[#38BDF8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624 1.177-1.194 2.538-2.576 5.512-2.576z"/></svg>`,
        },
    ];

    // Map positions for HTML nodes matching SVG endpoints in 800x550
    const nodePositions = [
        { left: "50%", top: "14.5%" }, // 0: Node.js
        { left: "76.25%", top: "25.5%" }, // 1: TypeScript
        { left: "85%", top: "50%" }, // 2: Svelte 5
        { left: "76.25%", top: "74.5%" }, // 3: Cognee Cloud
        { left: "50%", top: "85.5%" }, // 4: MongoDB
        { left: "23.75%", top: "74.5%" }, // 5: React Flow
        { left: "15%", top: "50%" }, // 6: Express
        { left: "23.75%", top: "25.5%" }, // 7: Tailwind CSS
    ];

    onMount(() => {
        const interval = setInterval(() => {
            if (!isHovered) {
                activeTech = (activeTech + 1) % techStack.length;
            }
        }, 3500);
        return () => clearInterval(interval);
    });
</script>

<section id="tech-stack" class="py-24 relative overflow-hidden scroll-mt-20">
    <!-- Background Ambient Glow -->
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10"
    ></div>
    <div
        class="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10"
    ></div>

    <div class="max-w-7xl mx-auto px-6">
        <!-- SECTION HEADER -->
        <div class="text-center max-w-3xl mx-auto mb-16">
            <div
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-widest mb-4 shadow-sm"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
                ></span>
                Tech Stack
            </div>
            <h2
                class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
            >
                Tools We Used
            </h2>
            <p class="text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
                Built with state-of-the-art frameworks and cloud cognitive AI
                infrastructure to deliver autonomous, zero-hallucination
                hardware synthesis.
            </p>
        </div>

        <!-- RADIAL ORBITING TECH STACK DIAGRAM -->
        <div
            class="max-w-5xl mx-auto h-[580px] sm:h-[620px] relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden group/diagram"
            onmouseenter={() => (isHovered = true)}
            onmouseleave={() => (isHovered = false)}
            role="region"
            aria-label="Interactive Tech Stack Diagram"
        >
            <!-- Background Grid Pattern -->
            <div
                class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"
            ></div>

            <!-- SVG CONNECTING WIRES & PULSE ANIMATIONS -->
            <svg
                class="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 800 550"
                preserveAspectRatio="none"
            >
                <defs>
                    {#each techStack as tech, i}
                        <linearGradient
                            id="wire-grad-{i}"
                            x1="50%"
                            y1="50%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stop-color="#6366F1"
                                stop-opacity="0.8"
                            />
                            <stop
                                offset="100%"
                                stop-color={tech.color}
                                stop-opacity="1"
                            />
                        </linearGradient>
                    {/each}
                </defs>

                {#each techStack as tech, i}
                    <!-- Base Dark Wire -->
                    <path
                        d={tech.path}
                        stroke="#1e293b"
                        stroke-width="2"
                        fill="none"
                        class="transition-colors duration-300 {activeTech === i
                            ? 'stroke-slate-600'
                            : ''}"
                    />

                    <!-- Glowing Animated Data Pulse Wire -->
                    <path
                        d={tech.path}
                        stroke="url(#wire-grad-{i})"
                        stroke-width="2.5"
                        fill="none"
                        stroke-dasharray="12 150"
                        stroke-linecap="round"
                        class="transition-opacity duration-500 {activeTech === i
                            ? 'opacity-100'
                            : 'opacity-40'}"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            values="162;0"
                            dur="{tech.dur}s"
                            repeatCount="indefinite"
                        />
                    </path>

                    <!-- Highlighted Active Glow Wire -->
                    <path
                        d={tech.path}
                        stroke={tech.color}
                        stroke-width="3"
                        fill="none"
                        class="transition-opacity duration-300 {activeTech === i
                            ? 'opacity-90 drop-shadow-[0_0_8px_currentColor]'
                            : 'opacity-0'}"
                    />
                {/each}
            </svg>

            <!-- CENTER HUB NODE (HANGOVER AI COPILOT) -->
            <div
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
            >
                <div
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-2xl shadow-indigo-500/40 animate-pulse"
                >
                    <div
                        class="w-full h-full bg-[#0F1423] rounded-[14px] flex flex-col items-center justify-center p-2 text-center group-hover/diagram:bg-[#0B0F19] transition-colors"
                    >
                        <div
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-inner"
                        >
                            H
                        </div>
                        <span
                            class="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-300 mt-1 tracking-tight"
                            >Hangover</span
                        >
                    </div>
                </div>
                <span
                    class="mt-2 text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/60 shadow-sm"
                >
                    Copilot Hub
                </span>
            </div>

            <!-- 8 SURROUNDING TECH STACK NODES -->
            {#each techStack as tech, i}
                <button
                    onclick={() => (activeTech = i)}
                    onmouseenter={() => (activeTech = i)}
                    class="absolute z-30 flex flex-col items-center group transition-all duration-300 -translate-x-1/2 -translate-y-1/2 {activeTech ===
                    i
                        ? 'scale-110 sm:scale-125 z-40'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'}"
                    style="left: {nodePositions[i].left}; top: {nodePositions[i]
                        .top};"
                    aria-label={`Select ${tech.name}`}
                >
                    <div
                        class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/95 border transition-all duration-300 flex items-center justify-center shadow-lg backdrop-blur-md p-2.5 sm:p-3 {activeTech ===
                        i
                            ? `${tech.borderColor} shadow-lg shadow-indigo-500/30 bg-slate-800/90 ring-2 ring-indigo-500/30`
                            : 'border-slate-700/80 group-hover:border-slate-500'}"
                    >
                        {@html tech.icon}
                    </div>
                    <span
                        class="mt-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900/90 border transition-all duration-300 whitespace-nowrap shadow-md {activeTech ===
                        i
                            ? `text-white ${tech.borderColor} bg-slate-800 font-bold`
                            : 'text-slate-400 border-slate-800 group-hover:text-slate-200'}"
                    >
                        {tech.name}
                    </span>
                </button>
            {/each}
        </div>

        <!-- INTERACTIVE TECH SPOTLIGHT BAR -->
        <div
            class="mt-8 max-w-4xl mx-auto bg-gradient-to-r from-slate-900/90 via-[#131A2B]/90 to-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
        >
            <!-- Subtle Accent Glow -->
            <div
                class="absolute top-0 left-0 w-2 h-full {techStack[activeTech]
                    .bgColor}"
                style="background-color: {techStack[activeTech].color};"
            ></div>

            <!-- Icon Box -->
            <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-slate-900 border border-slate-700/80 shadow-lg p-3 transition-transform duration-300 scale-105"
            >
                {@html techStack[activeTech].icon}
            </div>

            <!-- Content -->
            <div class="flex-1 text-center sm:text-left">
                <div
                    class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2"
                >
                    <span
                        class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700"
                    >
                        {techStack[activeTech].category}
                    </span>
                    <h4
                        class="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
                    >
                        {techStack[activeTech].name}
                    </h4>
                </div>
                <p
                    class="text-sm sm:text-base text-slate-300 leading-relaxed font-normal"
                >
                    {techStack[activeTech].description}
                </p>
            </div>

            <!-- Status Indicator -->
            <div
                class="shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400"
            >
                <span
                    class="w-2 h-2 rounded-full {isHovered
                        ? 'bg-amber-400'
                        : 'bg-emerald-400 animate-pulse'}"
                ></span>
                <span>{isHovered ? "Paused (Hovering)" : "Auto-Cycling"}</span>
            </div>
        </div>
    </div>
</section>
