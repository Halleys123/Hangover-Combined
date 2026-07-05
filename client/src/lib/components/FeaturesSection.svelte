<script lang="ts">
    const features = [
        {
            title: "Multi-Stage PDF Synthesis",
            subtitle: "Sectional OCR Extraction",
            description:
                "Chunks massive 60-page semiconductor datasheets into targeted sections (DC limits vs. pinout tables) to eliminate LLM attention degradation and 'lost in the middle' errors.",
            icon: "📄",
            badge: "Cognee Powered",
            gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
            borderColor: "hover:border-blue-500/60",
            accentColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        },
        {
            title: "Relational Graph Memory",
            subtitle: "Zero Hallucination Architecture",
            description:
                "Integrates directly with Cognee Cloud APIs to store and traverse electrical constraints and entity relationships. Never rely on hallucination-prone vector search alone.",
            icon: "🧠",
            badge: "Cognee Cloud",
            gradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
            borderColor: "hover:border-purple-500/60",
            accentColor:
                "text-purple-400 bg-purple-500/10 border-purple-500/20",
        },
        {
            title: "Deterministic Schema Healing",
            subtitle: "Automated Spec Recovery",
            description:
                "Automatically heals probabilistic LLM flaws by injecting exhaustive pin profiles (e.g., Arduino Uno Rev3's 14 digital & 6 analog pins) and enforcing strict 2-wire power rules.",
            icon: "🛡️",
            badge: "100% Reliable",
            gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
            borderColor: "hover:border-emerald-500/60",
            accentColor:
                "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        },
        {
            title: "Agentic Auto-Wiring",
            subtitle: "Smart Circuit Routing",
            description:
                "Evaluates electrical compatibility across all active canvas nodes and emits animated React Flow wire connections while alerting you to potential electrical hazards.",
            icon: "⚡",
            badge: "DRC Guardrails",
            gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
            borderColor: "hover:border-amber-500/60",
            accentColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        },
        {
            title: "Symmetrical Pin Balancing",
            subtitle: "Clean Schematic Layouts",
            description:
                "Dynamically redistributes left and right IC headers so high-pin-count microcontrollers and sensors render cleanly without lopsided vertical ribbons on your canvas.",
            icon: "⚖️",
            badge: "Visual Harmony",
            gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
            borderColor: "hover:border-cyan-500/60",
            accentColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        },
        {
            title: "Natural Language Refinement",
            subtitle: "Conversational Iteration",
            description:
                "Refine component parameters on the fly via chat ('Change nominal voltage to 12V and max current to 4.5A'), immediately updating graph memory and live canvas nodes.",
            icon: "💬",
            badge: "AI Copilot",
            gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
            borderColor: "hover:border-pink-500/60",
            accentColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
        },
    ];
</script>

<section id="features" class="py-24 relative overflow-hidden scroll-mt-20">
    <!-- Background Ambient Glow -->
    <div
        class="absolute top-1/3 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10"
    ></div>
    <div
        class="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"
    ></div>

    <div class="max-w-7xl mx-auto px-6">
        <!-- SECTION HEADER -->
        <div class="text-center max-w-3xl mx-auto mb-16">
            <div
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-widest mb-4 shadow-sm"
            >
                <span
                    class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                ></span>
                Key Capabilities
            </div>
            <h2
                class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
            >
                Why Hangover AI Stands Out
            </h2>
            <p class="text-base sm:text-lg text-slate-400 mt-4 leading-relaxed">
                We replace tedious manual PDF searching and hallucination-prone
                vector search with a deterministic, knowledge-graph-powered
                engineering copilot.
            </p>
        </div>

        <!-- 3x2 FEATURES GRID -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each features as feature}
                <div
                    class="bg-gradient-to-b from-slate-900/90 via-[#111726]/90 to-slate-900/90 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 {feature.borderColor} group relative overflow-hidden flex flex-col justify-between"
                >
                    <!-- Top Subtle Gradient Glow -->
                    <div
                        class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b {feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"
                    ></div>

                    <div class="relative z-10">
                        <!-- Icon & Badge Header -->
                        <div class="flex items-center justify-between mb-6">
                            <div
                                class="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-300"
                            >
                                {feature.icon}
                            </div>
                            <span
                                class="text-[11px] font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider {feature.accentColor}"
                            >
                                {feature.badge}
                            </span>
                        </div>

                        <!-- Titles -->
                        <h3
                            class="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors"
                        >
                            {feature.title}
                        </h3>
                        <h4
                            class="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-4"
                        >
                            // {feature.subtitle}
                        </h4>

                        <!-- Description -->
                        <p
                            class="text-sm text-slate-300 leading-relaxed font-normal"
                        >
                            {feature.description}
                        </p>
                    </div>

                    <!-- Bottom Decorative Trace -->
                    <div
                        class="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500"
                    >
                        <span>⚡ Hangover Engine</span>
                        <span
                            class="group-hover:text-slate-300 transition-colors"
                            >DRC Verified ➔</span
                        >
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>
