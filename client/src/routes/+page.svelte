<script lang="ts">
	import { authUser } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let activeStep = $state(0);
	let isLoaded = $state(false);

	onMount(() => {
		const userPressedHome = sessionStorage.getItem('user_pressed_home') === 'true';
		const alreadyChecked = sessionStorage.getItem('home_redirect_checked') === 'true';

		if (!userPressedHome && !alreadyChecked && $authUser) {
			sessionStorage.setItem('home_redirect_checked', 'true');
			goto('/projects', { replaceState: true });
			return;
		}

		sessionStorage.setItem('home_redirect_checked', 'true');
		isLoaded = true;
		const interval = setInterval(() => {
			activeStep = (activeStep + 1) % 5;
		}, 4000);
		return () => clearInterval(interval);
	});

	const workflowSteps = [
		{
			phase: "Phase 01",
			title: "Datasheet Ingestion & OCR",
			subtitle: "PDF to Structured Knowledge Graph",
			desc: "Upload complex microcontroller or sensor PDFs. Our advanced pipeline parses multi-page pinout tables, electrical characteristics, and package dimensions in seconds.",
			icon: "📄",
			badge: "Cognee Engine",
			gradient: "from-blue-600 to-cyan-500",
			bgLight: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
			textAccent: "text-blue-600 dark:text-blue-400"
		},
		{
			phase: "Phase 02",
			title: "Graph Memory & Healing",
			subtitle: "Deterministic Pinout Enforcement",
			desc: "Say goodbye to LLM hallucinations. Our Cognee graph memory anchors exact pin numbers, power rails, and I/O functions with 100% deterministic precision.",
			icon: "🧠",
			badge: "Zero Hallucination",
			gradient: "from-purple-600 to-indigo-500",
			bgLight: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
			textAccent: "text-purple-600 dark:text-purple-400"
		},
		{
			phase: "Phase 03",
			title: "AI Engineering Copilot",
			subtitle: "Real-time DRC & Schematic Advice",
			desc: "Collaborate with an autonomous AI copilot trained on electrical engineering principles. Validate pull-up resistors, decoupling capacitors, and bus routing on the fly.",
			icon: "🤖",
			badge: "DRC Guardrails",
			gradient: "from-amber-500 to-orange-500",
			bgLight: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
			textAccent: "text-amber-600 dark:text-amber-400"
		},
		{
			phase: "Phase 04",
			title: "Interactive Canvas",
			subtitle: "Infinite Schematic Prototyping",
			desc: "Design circuits effortlessly on a responsive node-based canvas. Auto-route connections, inspect voltage rails, and simulate signal flows in real time.",
			icon: "⚡",
			badge: "Live Canvas",
			gradient: "from-emerald-600 to-teal-500",
			bgLight: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
			textAccent: "text-emerald-600 dark:text-emerald-400"
		},
		{
			phase: "Phase 05",
			title: "Instant BOM & Netlist",
			subtitle: "Production-Ready PCB Output",
			desc: "Export your finalized schematic into standardized netlists and Bills of Materials (BOM) ready for PCB layout, component sourcing, and rapid fabrication.",
			icon: "📦",
			badge: "Fabrication Ready",
			gradient: "from-rose-600 to-pink-500",
			bgLight: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
			textAccent: "text-rose-600 dark:text-rose-400"
		}
	];
</script>

<svelte:head>
	<title>Hangover AI • Hackathon 2026 Hardware Copilot</title>
	<meta name="description" content="Supercharge your hardware prototyping with autonomous AI. From raw datasheet PDFs to deterministic circuit schematics in seconds." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
	<!-- CUSTOM HACKATHON LANDING NAVBAR -->
	<header class="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl transition-all">
		<div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
			<!-- Logo -->
			<button onclick={() => { sessionStorage.setItem('user_pressed_home', 'true'); goto('/'); }} class="flex items-center gap-3 group text-left">
				<div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
					H
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="font-extrabold text-white tracking-tight text-lg group-hover:text-indigo-400 transition-colors">Hangover AI</span>
						<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">Hackathon '26</span>
					</div>
					<p class="text-[11px] text-slate-400 font-medium">Autonomous Hardware Copilot</p>
				</div>
			</button>

			<!-- Nav Links -->
			<nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
				<a href="#features" class="hover:text-white transition-colors">Features</a>
				<a href="#how-it-works" class="hover:text-white transition-colors">Workflow</a>
				<a href="#tech-stack" class="hover:text-white transition-colors">Tech Stack</a>
				<a href="/datasheets" class="hover:text-white transition-colors flex items-center gap-1.5">
					<span>Datasheets</span>
					<span class="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-400 rounded border border-slate-700">OCR</span>
				</a>
			</nav>

			<!-- Action CTA -->
			<div class="flex items-center gap-4">
				{#if $authUser}
					<button
						onclick={() => goto('/projects')}
						class="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 group"
					>
						<span>Go to Workspace</span>
						<span class="group-hover:translate-x-1 transition-transform">➔</span>
					</button>
				{:else}
					<button
						onclick={() => goto('/login')}
						class="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 hidden sm:inline-block"
					>
						Sign In
					</button>
					<button
						onclick={() => goto('/projects')}
						class="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 group"
					>
						<span>Launch Workspace</span>
						<span class="group-hover:translate-x-1 transition-transform">➔</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	<!-- HERO SECTION WITH VIBRANT GRADIENT & GLASSMORPHISM -->
	<main class="flex-1 relative">
		<!-- Background Glow Effects -->
		<div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
		<div class="absolute top-10 left-10 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none -z-10"></div>
		<div class="absolute top-40 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

		<div class="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
			<!-- HACKATHON 2026 BADGE -->
			<div class="flex justify-center mb-8">
				<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 backdrop-blur-md shadow-lg shadow-indigo-500/5">
					<span class="flex h-2 w-2 relative">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
					</span>
					<span class="text-xs md:text-sm font-semibold tracking-wide bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent uppercase">
						⚡ Hackathon 2026 Edition • Autonomous Hardware Copilot
					</span>
				</div>
			</div>

			<!-- HERO HEADLINE -->
			<div class="text-center max-w-4xl mx-auto mb-8">
				<h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
					Supercharge Hardware <br class="hidden sm:inline" />
					<span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
						Prototyping with AI
					</span>
				</h1>
				<p class="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
					Transform raw manufacturer PDF datasheets into deterministic circuit schematics, verified pinouts, and simulation-ready projects in seconds. Zero wiring errors.
				</p>
			</div>

			<!-- CTA BUTTONS -->
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
				<button
					onclick={() => goto('/projects')}
					class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 text-base group"
				>
					<span>Launch Projects Workspace</span>
					<svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</button>
				<button
					onclick={() => goto('/datasheets')}
					class="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-white font-semibold rounded-2xl border border-slate-700/80 hover:border-slate-600 backdrop-blur-md shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
				>
					<span>Explore Component Library</span>
					<span class="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 font-mono">PDF OCR</span>
				</button>
			</div>

			<!-- LIVE INTERACTIVE SCHEMATIC PREVIEW / TECH STACK SHOWCASE -->
			<div id="tech-stack" class="relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-700/50 via-indigo-500/20 to-slate-800/50 shadow-2xl shadow-black/80 scroll-mt-24">
				<div class="bg-[#0F1423] rounded-[22px] overflow-hidden border border-slate-800/80 backdrop-blur-xl">
					<!-- Mock Window Header -->
					<div class="px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
							<div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
							<div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
							<span class="ml-3 text-xs font-mono text-slate-400">hangover-ai-copilot // schematic-engine-v2</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
								DRC Validated
							</span>
							<span class="text-xs font-mono text-indigo-400 bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-800/50">
								Cognee Memory ON
							</span>
						</div>
					</div>

					<!-- Mock Canvas Area -->
					<div class="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
						<!-- Left: Microcontroller Node -->
						<div class="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 shadow-lg shadow-indigo-500/10 relative group hover:border-indigo-500 transition-colors">
							<div class="flex justify-between items-start mb-3">
								<div>
									<span class="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">MCU • U1</span>
									<h4 class="text-base font-bold text-white mt-1">ESP32-WROOM-32E</h4>
								</div>
								<div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">3V3</div>
							</div>
							<div class="space-y-1.5 font-mono text-xs text-slate-300">
								<div class="flex justify-between items-center py-1 px-2 rounded bg-slate-800/50 border border-slate-700/50">
									<span class="text-amber-400">PIN_1 (VDD)</span>
									<span class="text-slate-500">➔ 3.3V Rail</span>
								</div>
								<div class="flex justify-between items-center py-1 px-2 rounded bg-slate-800/50 border border-slate-700/50">
									<span class="text-cyan-400">PIN_2 (GND)</span>
									<span class="text-slate-500">➔ Ground</span>
								</div>
								<div class="flex justify-between items-center py-1 px-2 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
									<span>PIN_25 (GPIO2)</span>
									<span>➔ I2C_SDA</span>
								</div>
							</div>
						</div>

						<!-- Center: AI Processing Visualizer -->
						<div class="flex flex-col items-center justify-center py-4 text-center">
							<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 mb-3 animate-pulse">
								<div class="w-full h-full bg-[#0F1423] rounded-[14px] flex items-center justify-center text-2xl">
									⚡
								</div>
							</div>
							<span class="text-xs font-mono font-semibold text-purple-400 tracking-wider uppercase">Deterministic Healing</span>
							<p class="text-[11px] text-slate-400 mt-1 max-w-[200px]">
								Auto-resolving voltage discrepancies & pin mapping via Cognee Graph
							</p>
						</div>

						<!-- Right: Peripheral Sensor Node -->
						<div class="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-5 shadow-lg shadow-teal-500/10 relative group hover:border-teal-500 transition-colors">
							<div class="flex justify-between items-start mb-3">
								<div>
									<span class="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">SENSOR • U2</span>
									<h4 class="text-base font-bold text-white mt-1">BME680 Env Sensor</h4>
								</div>
								<div class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-xs">I2C</div>
							</div>
							<div class="space-y-1.5 font-mono text-xs text-slate-300">
								<div class="flex justify-between items-center py-1 px-2 rounded bg-slate-800/50 border border-slate-700/50">
									<span class="text-teal-400">PIN_3 (SDI)</span>
									<span class="text-slate-500">➔ GPIO2 (SDA)</span>
								</div>
								<div class="flex justify-between items-center py-1 px-2 rounded bg-slate-800/50 border border-slate-700/50">
									<span class="text-teal-400">PIN_4 (SCK)</span>
									<span class="text-slate-500">➔ GPIO15 (SCL)</span>
								</div>
								<div class="flex justify-between items-center py-1 px-2 rounded bg-slate-800/50 border border-slate-700/50">
									<span class="text-rose-400">PIN_6 (VCC)</span>
									<span class="text-slate-500">➔ 3.3V Regulated</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Bottom Status Bar -->
					<div class="px-6 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-4">
						<div class="flex items-center gap-4">
							<span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> 0 DRC Errors</span>
							<span class="flex items-center gap-1.5"><span class="text-indigo-400">✓</span> 100% Pin Recall</span>
							<span class="flex items-center gap-1.5"><span class="text-purple-400">✓</span> 2 Components Connected</span>
						</div>
						<span class="text-slate-500">AI Provider: OpenRouter // Claude 3.5 Sonnet</span>
					</div>
				</div>
			</div>
		</div>

		<!-- STATISTICS BANNER -->
		<div id="features" class="border-y border-slate-800/80 bg-slate-900/50 backdrop-blur-md py-10 scroll-mt-24">
			<div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
				<div>
					<p class="text-3xl lg:text-4xl font-extrabold text-white font-mono">10,000+</p>
					<p class="text-sm text-slate-400 mt-1 font-medium">Pinouts Validated</p>
				</div>
				<div>
					<p class="text-3xl lg:text-4xl font-extrabold text-emerald-400 font-mono">0%</p>
					<p class="text-sm text-slate-400 mt-1 font-medium">Hallucinated Connections</p>
				</div>
				<div>
					<p class="text-3xl lg:text-4xl font-extrabold text-indigo-400 font-mono">&lt; 2.5s</p>
					<p class="text-sm text-slate-400 mt-1 font-medium">Schematic Synthesis Time</p>
				</div>
				<div>
					<p class="text-3xl lg:text-4xl font-extrabold text-purple-400 font-mono">100%</p>
					<p class="text-sm text-slate-400 mt-1 font-medium">Open-Source & Hackathon Ready</p>
				</div>
			</div>
		</div>

		<!-- 5-PHASE AUTONOMOUS HARDWARE WORKFLOW SECTION -->
		<div id="how-it-works" class="max-w-7xl mx-auto px-6 py-24 scroll-mt-24">
			<div class="text-center max-w-3xl mx-auto mb-16">
				<h2 class="text-xs font-mono font-semibold tracking-widest text-indigo-400 uppercase mb-3">The Autonomous Architecture</h2>
				<h3 class="text-3xl sm:text-5xl font-bold text-white tracking-tight">How Hangover AI Works</h3>
				<p class="text-base text-slate-400 mt-4 leading-relaxed">
					We bridge the gap between raw PDF datasheets and deterministic hardware design by combining knowledge graph memory with specialized AI guardrails.
				</p>
			</div>

			<!-- Step Selector Tabs -->
			<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
				{#each workflowSteps as step, i}
					<button
						onclick={() => (activeStep = i)}
						class="p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group {activeStep === i
							? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
							: 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400'}"
					>
						<div class="flex items-center justify-between mb-3">
							<span class="text-2xl">{step.icon}</span>
							<span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full {step.bgLight} {step.textAccent}">
								{step.badge}
							</span>
						</div>
						<p class="text-xs font-mono text-slate-400 mb-1">{step.phase}</p>
						<h4 class="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{step.title}</h4>
					</button>
				{/each}
			</div>

			<!-- Active Step Detailed Display Card -->
			<div class="bg-gradient-to-r {workflowSteps[activeStep].gradient} p-0.5 rounded-3xl shadow-2xl transition-all duration-300">
				<div class="bg-[#0F1423] rounded-[22px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
					<div class="max-w-2xl">
						<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full {workflowSteps[activeStep].bgLight} {workflowSteps[activeStep].textAccent} text-xs font-mono font-semibold mb-4">
							<span>{workflowSteps[activeStep].phase} // {workflowSteps[activeStep].badge}</span>
						</div>
						<h3 class="text-2xl sm:text-4xl font-extrabold text-white mb-3">{workflowSteps[activeStep].title}</h3>
						<h4 class="text-lg font-medium text-indigo-300 mb-4">{workflowSteps[activeStep].subtitle}</h4>
						<p class="text-slate-300 text-base leading-relaxed">{workflowSteps[activeStep].desc}</p>
					</div>
					<div class="shrink-0 flex flex-col items-center justify-center w-full md:w-auto">
						<button
							onclick={() => goto('/projects')}
							class="w-full md:w-auto px-8 py-4 bg-gradient-to-r {workflowSteps[activeStep].gradient} text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
						>
							<span>Try {workflowSteps[activeStep].title} Now</span>
							<span>➔</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- CALL TO ACTION BANNER -->
		<div class="max-w-5xl mx-auto px-6 pb-24">
			<div class="rounded-3xl bg-gradient-to-tr from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/30 p-8 md:p-14 text-center relative overflow-hidden shadow-2xl shadow-indigo-950/50">
				<div class="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
				<h3 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
					Ready to Prototype Without Limits?
				</h3>
				<p class="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
					Join hardware engineers and Hackathon teams building autonomous, DRC-enforced schematics with Hangover AI.
				</p>
				<div class="flex flex-wrap justify-center gap-4">
					<button
						onclick={() => goto('/projects')}
						class="px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl shadow-xl hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
					>
						Get Started • Launch Projects ➔
					</button>
				</div>
			</div>
		</div>
	</main>

	<!-- FOOTER -->
	<footer class="border-t border-slate-800/80 bg-[#070A12] py-12 text-sm text-slate-500">
		<div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
					H
				</div>
				<span class="font-bold text-slate-300 tracking-tight text-base">Hangover AI</span>
				<span class="text-xs text-slate-500 font-mono">// Hackathon 2026</span>
			</div>
			<div class="flex items-center gap-8 text-slate-400 font-medium">
				<a href="/projects" class="hover:text-white transition-colors">Projects</a>
				<a href="/datasheets" class="hover:text-white transition-colors">Datasheet Library</a>
				<a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">GitHub</a>
			</div>
			<p class="text-xs text-slate-600 font-mono">
				© 2026 Hangover AI. Built for hardware innovators.
			</p>
		</div>
	</footer>
</div>
