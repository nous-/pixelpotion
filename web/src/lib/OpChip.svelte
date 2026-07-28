<script>
	// The operation word/symbol in a step. Click to swap what the step does.
	import { OPS } from './recipe/model.js';

	let { current, label, funcs = [], onpick } = $props();

	let open = $state(false);
	let pos = $state({ x: 0, y: 0 });
	let btnEl = $state(null);
	let popEl = $state(null);

	function toggle() {
		if (!open) {
			const r = btnEl.getBoundingClientRect();
			pos = { x: r.left, y: r.bottom + 8 };
		}
		open = !open;
	}

	// Once the popover has real dimensions, nudge it fully on screen.
	$effect(() => {
		if (!open || !popEl) return;
		const r = popEl.getBoundingClientRect();
		const x = Math.max(8, Math.min(pos.x, window.innerWidth - r.width - 8));
		const y = Math.max(8, Math.min(pos.y, window.innerHeight - r.height - 8));
		if (x !== pos.x || y !== pos.y) pos = { x, y };
	});

	function onWindowDown(e) {
		if (open && !popEl?.contains(e.target) && !btnEl?.contains(e.target)) open = false;
	}
</script>

<svelte:window
	onpointerdown={onWindowDown}
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
/>

<button
	bind:this={btnEl}
	onclick={toggle}
	class="rounded-lg bg-indigo-50 px-2 py-1 text-sm font-black text-indigo-500 transition hover:bg-indigo-100 active:scale-95"
>
	{label}<span class="ml-0.5 text-[9px] align-middle text-indigo-300">▼</span>
</button>

{#if open}
	<div
		bind:this={popEl}
		class="fixed z-50 flex max-h-[calc(100vh-1rem)] w-64 flex-col gap-0.5 overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-indigo-100"
		style="left:{pos.x}px; top:{pos.y}px"
	>
		{#each OPS as op (op.id)}
			<button
				onclick={() => {
					onpick(op.id);
					open = false;
				}}
				class="rounded-lg px-2.5 py-1 text-left transition {op.id === current
					? 'bg-indigo-500 text-white'
					: 'text-slate-600 hover:bg-indigo-50'}"
			>
				<span class="block text-sm font-bold">{op.menu}</span>
				{#if op.hint}
					<span
						class="block text-[10px] font-medium {op.id === current
							? 'text-indigo-200'
							: 'text-slate-400'}">{op.hint}</span
					>
				{/if}
			</button>
		{/each}

		{#if funcs.length}
			<p class="mt-1.5 mb-0.5 px-2.5 text-[10px] font-black tracking-widest text-violet-400 uppercase">
				From your library
			</p>
			{#each funcs as func (func.id)}
				<button
					onclick={() => {
						onpick(`fn:${func.id}`);
						open = false;
					}}
					class="rounded-lg px-2.5 py-1 text-left transition {`fn:${func.id}` === current
						? 'bg-violet-500 text-white'
						: 'text-violet-700 hover:bg-violet-50'}"
				>
					<span class="block text-sm font-bold">{func.name || 'function'}</span>
					<span
						class="block text-[10px] font-medium {`fn:${func.id}` === current
							? 'text-violet-200'
							: 'text-violet-400'}"
						>takes {func.params.map((p) => p.name || '?').join(', ') || 'nothing'}</span
					>
				</button>
			{/each}
		{/if}
	</div>
{/if}
