<script>
	// The operation word/symbol in a step. Click to swap what the step does.
	import { OPS } from './recipe/model.js';

	let { current, label, onpick } = $props();

	let open = $state(false);
	let pos = $state({ x: 0, y: 0 });
	let btnEl = $state(null);
	let popEl = $state(null);

	function toggle() {
		if (!open) {
			const r = btnEl.getBoundingClientRect();
			pos = {
				x: Math.max(8, Math.min(r.left, window.innerWidth - 280)),
				y: Math.min(r.bottom + 8, window.innerHeight - 440)
			};
		}
		open = !open;
	}

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
		class="fixed z-50 flex max-h-[26rem] w-64 flex-col gap-0.5 overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-indigo-100"
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
	</div>
{/if}
