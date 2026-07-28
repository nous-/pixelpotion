<script>
	import { thumbRenderer } from './recipe/thumbs.js';
	import { shaderTime } from './recipe/playclock.js';

	let { source } = $props();

	let canvas;

	$effect(() => {
		const src = source;
		if (!src || !canvas) return;
		const renderer = thumbRenderer();

		// Long recipes scroll; don't spend GPU time on thumbnails offscreen.
		let visible = true;
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
		});
		observer.observe(canvas);

		let raf;
		const tick = () => {
			if (visible) renderer.render(src, canvas, shaderTime());
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} width="96" height="96" class="h-11 w-11 shrink-0 rounded-xl ring-1 ring-black/10"
></canvas>
