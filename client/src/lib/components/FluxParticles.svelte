<script lang="ts">
	import { onMount } from 'svelte';

	class Particle {
		canvas: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
		x!: number;
		y!: number;
		baseX!: number;
		baseY!: number;
		vx!: number;
		vy!: number;
		radius!: number;
		baseRadius!: number;
		color!: string;
		activeColor!: string;

		constructor(canvas: HTMLCanvasElement) {
			this.canvas = canvas;
			this.ctx = canvas.getContext('2d')!;
			this.reset();
		}

		reset() {
			this.x = Math.random() * this.canvas.width;
			this.y = Math.random() * this.canvas.height;
			this.baseX = this.x;
			this.baseY = this.y;
			// Speed drift
			this.vx = (Math.random() - 0.5) * 0.4;
			this.vy = (Math.random() - 0.5) * 0.4;
			this.radius = Math.random() * 2 + 1; // 1px to 3px
			this.baseRadius = this.radius;
			this.color = 'rgba(255, 255, 255, 0.12)';
			this.activeColor = this.getRandomThemeColor();
		}

		getRandomThemeColor() {
			const colors = [
				'rgba(0, 229, 255, 0.65)',  // Cyan (#00e5ff)
				'rgba(181, 55, 242, 0.65)', // Violet (#b537f2)
				'rgba(255, 79, 154, 0.65)'  // Pink (#ff4f9a)
			];
			return colors[Math.floor(Math.random() * colors.length)];
		}

		update(mouse: { x: number; y: number; radius: number }) {
			// 1. Apply baseline organic drift
			this.baseX += this.vx;
			this.baseY += this.vy;

			// Wrap around screen boundaries
			if (this.baseX < 0) this.baseX = this.canvas.width;
			if (this.baseX > this.canvas.width) this.baseX = 0;
			if (this.baseY < 0) this.baseY = this.canvas.height;
			if (this.baseY > this.canvas.height) this.baseY = 0;

			// 2. Physics attraction calculation
			const dx = this.baseX - mouse.x;
			const dy = this.baseY - mouse.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const forceRadius = mouse.radius;

			if (distance < forceRadius) {
				// Attraction force (pulls particles towards center of mouse)
				const force = (forceRadius - distance) / forceRadius;
				const angle = Math.atan2(dy, dx);
				
				// Pull particles towards the mouse coordinate
				this.x = this.baseX - Math.cos(angle) * force * 40;
				this.y = this.baseY - Math.sin(angle) * force * 40;
				
				// Growth and color change near the mouse
				this.radius = this.baseRadius + force * 2.5;
				this.color = this.activeColor;
			} else {
				// Return slowly to baseline positions
				this.x += (this.baseX - this.x) * 0.08;
				this.y += (this.baseY - this.y) * 0.08;
				this.radius += (this.baseRadius - this.radius) * 0.08;
				this.color = 'rgba(255, 255, 255, 0.12)';
			}
		}

		draw(mouse: { x: number; y: number; radius: number }) {
			this.ctx.save();
			
			// Calculate vector to mouse
			const dx = mouse.x - this.x;
			const dy = mouse.y - this.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			
			let angle = 0;
			const forceRadius = mouse.radius;
			const isNear = distance < forceRadius;
			
			if (isNear && distance > 0.1) {
				// Point towards mouse
				angle = Math.atan2(dy, dx);
			} else {
				// Point in direction of travel
				angle = Math.atan2(this.vy, this.vx);
			}

			const force = isNear ? (forceRadius - distance) / forceRadius : 0;
			
			// Elongation: stretch particles when close to the mouse
			const stretch = 1 + force * 2.2;
			const length = this.radius * 2.5 * stretch;
			
			this.ctx.translate(this.x, this.y);
			this.ctx.rotate(angle);
			
			this.ctx.strokeStyle = this.color;
			this.ctx.lineWidth = this.radius * (1 + force * 0.5);
			this.ctx.lineCap = 'round';
			
			this.ctx.beginPath();
			this.ctx.moveTo(-length / 2, 0);
			this.ctx.lineTo(length / 2, 0);
			this.ctx.stroke();
			
			this.ctx.restore();
		}
	}

	class ParticleSystem {
		canvas: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
		particles: Particle[] = [];
		mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 140 };
		animationFrameId!: number;

		constructor(canvas: HTMLCanvasElement) {
			this.canvas = canvas;
			this.ctx = canvas.getContext('2d')!;
			this.init();
			this.animate();
		}

		init() {
			this.resize();
			const density = window.innerWidth < 768 ? 45 : 120; // Fewer particles on mobile
			for (let i = 0; i < density; i++) {
				this.particles.push(new Particle(this.canvas));
			}
		}

		resize() {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		}

		onMouseMove(e: MouseEvent) {
			this.mouse.targetX = e.clientX;
			this.mouse.targetY = e.clientY;
		}

		onTouchMove(e: TouchEvent) {
			if (e.touches.length > 0) {
				this.mouse.targetX = e.touches[0].clientX;
				this.mouse.targetY = e.touches[0].clientY;
			}
		}

		onMouseLeave() {
			this.mouse.targetX = -1000;
			this.mouse.targetY = -1000;
		}

		animate() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

			// Apply linear interpolation (lerp) for smooth trailing delay (inertia)
			this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
			this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

			this.particles.forEach(p => {
				p.update(this.mouse);
				p.draw(this.mouse);
			});

			this.animationFrameId = requestAnimationFrame(() => this.animate());
		}

		destroy() {
			cancelAnimationFrame(this.animationFrameId);
		}
	}

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const system = new ParticleSystem(canvas);

		const handleResize = () => system.resize();
		const handleMouseMove = (e: MouseEvent) => system.onMouseMove(e);
		const handleMouseLeave = () => system.onMouseLeave();
		const handleTouchMove = (e: TouchEvent) => system.onTouchMove(e);

		window.addEventListener('resize', handleResize);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseout', handleMouseLeave);
		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleMouseLeave);

		return () => {
			system.destroy();
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseout', handleMouseLeave);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleMouseLeave);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
></canvas>
