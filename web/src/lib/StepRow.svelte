<script>
	import MiniPreview from './MiniPreview.svelte';
	import ValueChip from './ValueChip.svelte';
	import OpChip from './OpChip.svelte';
	import { opById, ensureArgs } from './recipe/model.js';

	let {
		step = $bindable(),
		available = [],
		funcs = [],
		params = [],
		source,
		canUp = false,
		canDown = false,
		highlight,
		onremove,
		onmove,
		onselect
	} = $props();

	// Library calls build their parts from the function's params; deleted
	// functions show as '?' but keep the step around.
	const op = $derived.by(() => {
		if (step.op?.startsWith('fn:')) {
			const func = funcs.find((f) => f.id === step.op.slice(3));
			if (!func) return { id: step.op, parts: [{ op: '?' }] };
			const parts = [{ op: func.name || 'function' }];
			func.params.forEach((p, i) => {
				if (i) parts.push({ text: ',' });
				parts.push({ slot: p.id });
			});
			return { id: step.op, parts };
		}
		return opById(step.op);
	});

	// Selected row glows strongest; the steps it's built from fade out the
	// further back the chain goes.
	const HIGHLIGHTS = [
		'ring-2 ring-amber-400 bg-amber-100',
		'ring-2 ring-amber-300 bg-amber-50',
		'ring-1 ring-amber-300 bg-amber-50/60',
		'ring-1 ring-amber-200 bg-amber-50/30'
	];
	const tint = $derived(
		highlight === undefined
			? 'ring-1 ring-indigo-100 bg-white'
			: HIGHLIGHTS[Math.min(highlight, HIGHLIGHTS.length - 1)]
	);

	function setOp(id) {
		step.op = id;
		ensureArgs(step, funcs);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	onclick={(e) => {
		// Only bare-row clicks select; chips, buttons, inputs and popovers
		// keep their own behavior.
		if (!e.target.closest('button, input, .z-50')) onselect?.();
	}}
	class="flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm transition-colors {tint}"
>
	<MiniPreview {source} />

	<input
		bind:value={step.name}
		placeholder="name it"
		class="w-24 shrink-0 rounded-lg bg-transparent px-1.5 py-0.5 text-sm font-black text-sky-700 outline-none placeholder:font-bold placeholder:text-slate-300 hover:bg-sky-50 focus:bg-sky-50"
	/>
	<span class="font-black text-slate-300">=</span>

	<div class="flex flex-1 flex-wrap items-center gap-1.5">
		{#each op.parts as part, i (i)}
			{#if part.op}
				<OpChip current={step.op} label={part.op} {funcs} onpick={setOp} />
			{:else if part.text}
				<span class="text-sm font-bold text-slate-400">{part.text}</span>
			{:else}
				<ValueChip
					value={step.args[part.slot]}
					{available}
					{params}
					onpick={(v) => (step.args[part.slot] = v)}
				/>
			{/if}
		{/each}
	</div>

	<div class="flex shrink-0 gap-0.5">
		<button
			aria-label="move step up"
			disabled={!canUp}
			onclick={() => onmove(-1)}
			class="min-h-9 min-w-9 rounded-lg bg-slate-50 font-bold text-slate-400 active:bg-slate-200 disabled:opacity-30"
		>
			↑
		</button>
		<button
			aria-label="move step down"
			disabled={!canDown}
			onclick={() => onmove(1)}
			class="min-h-9 min-w-9 rounded-lg bg-slate-50 font-bold text-slate-400 active:bg-slate-200 disabled:opacity-30"
		>
			↓
		</button>
		<button
			aria-label="delete step"
			onclick={onremove}
			class="min-h-9 min-w-9 rounded-lg bg-rose-50 font-bold text-rose-400 active:bg-rose-200"
		>
			✕
		</button>
	</div>
</div>
