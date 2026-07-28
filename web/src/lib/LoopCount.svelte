<script>
	// The loop's lap count. Whole numbers only, clamped to the cap, and
	// committed after a beat of quiet: every change recompiles every
	// shader on the page, so a slider drag must not fire dozens of
	// compiles in a row (that could stall the whole browser).
	import { LOOP_MAX } from './recipe/model.js';

	let { value, onchange } = $props();

	const clampN = (v) => Math.min(LOOP_MAX, Math.max(1, Math.round(Number(v) || 1)));

	let draft = $state(clampN(value));
	$effect(() => {
		draft = clampN(value);
	});

	let timer;
	function set(v) {
		draft = clampN(v);
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (draft !== clampN(value)) onchange(draft);
		}, 250);
	}
</script>

<input
	type="number"
	min="1"
	max={LOOP_MAX}
	step="1"
	value={draft}
	oninput={(e) => set(e.target.value)}
	class="w-14 rounded-lg bg-white px-2 py-1 text-sm font-bold text-indigo-600 tabular-nums ring-1 ring-indigo-200 outline-none focus:ring-indigo-400"
/>
<input
	type="range"
	min="1"
	max={LOOP_MAX}
	step="1"
	value={draft}
	oninput={(e) => set(e.target.value)}
	class="w-24 accent-indigo-500"
	aria-label="loop count"
/>
