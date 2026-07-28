<script>
	// A slot in a step. Click it and a menu shows everything that can go
	// here: what the dot knows, your earlier steps, a number, or a color.
	import { INPUTS } from './recipe/model.js';

	let { value = null, available = [], onpick } = $props();

	const menuInputs = INPUTS.filter((i) => !i.hidden);

	let open = $state(false);
	let pos = $state({ x: 0, y: 0 });
	let numDraft = $state(1);
	let btnEl = $state(null);
	let popEl = $state(null);

	const PRESETS = [
		'#ff4757', '#ffa502', '#ffe14d', '#2ed573',
		'#1e90ff', '#5352ed', '#e84393', '#ffffff', '#111827'
	];

	const inputFor = (id) => INPUTS.find((i) => i.id === id);
	const stepFor = (id) => available.find((s) => s.id === id);
	// Up to 4 decimals so tiny values like 0.003 don't display as 0.
	const showNum = (v) => String(parseFloat(Number(v).toFixed(4)));

	function toggle() {
		if (!open) {
			const r = btnEl.getBoundingClientRect();
			pos = {
				x: Math.max(8, Math.min(r.left, window.innerWidth - 300)),
				y: Math.min(r.bottom + 8, window.innerHeight - 340)
			};
			numDraft = value?.t === 'num' ? value.v : 1;
		}
		open = !open;
	}

	function pick(v, keepOpen = false) {
		onpick(v);
		if (!keepOpen) open = false;
	}

	function setNum(v) {
		numDraft = v;
		pick({ t: 'num', v }, true);
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

{#if !value}
	<button
		bind:this={btnEl}
		onclick={toggle}
		class="rounded-full border-2 border-dashed border-slate-300 px-3 py-1 text-sm font-bold text-slate-400 transition hover:border-indigo-400 hover:text-indigo-500 active:scale-95"
	>
		choose...
	</button>
{:else if value.t === 'in'}
	<button
		bind:this={btnEl}
		onclick={toggle}
		title={inputFor(value.id)?.hint}
		class="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700 transition hover:bg-orange-200 active:scale-95"
	>
		{inputFor(value.id)?.label ?? '?'}
	</button>
{:else if value.t === 'step'}
	{@const step = stepFor(value.id)}
	<button
		bind:this={btnEl}
		onclick={toggle}
		class="rounded-full px-3 py-1 text-sm font-bold transition active:scale-95 {step
			? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
			: 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'}"
	>
		{step?.name || '?'}
	</button>
{:else if value.t === 'num'}
	<button
		bind:this={btnEl}
		onclick={toggle}
		class="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 tabular-nums ring-1 ring-slate-200 transition hover:ring-indigo-300 active:scale-95"
	>
		{showNum(value.v)}
	</button>
{:else}
	<button
		bind:this={btnEl}
		onclick={toggle}
		class="flex items-center gap-1.5 rounded-full bg-white py-1 pr-3 pl-2 text-sm font-bold ring-1 ring-slate-200 transition hover:ring-indigo-300 active:scale-95"
	>
		<span class="h-4 w-4 rounded-full ring-1 ring-black/10" style="background:{value.v}"></span>
		<span class="text-slate-500">color</span>
	</button>
{/if}

{#if open}
	<div
		bind:this={popEl}
		class="fixed z-50 flex w-72 flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-indigo-100"
		style="left:{pos.x}px; top:{pos.y}px"
	>
		<div>
			<p class="mb-1.5 text-[10px] font-black tracking-widest text-orange-400 uppercase">The dot knows</p>
			<div class="flex flex-wrap gap-1.5">
				{#each menuInputs as input (input.id)}
					<button
						title={input.hint}
						onclick={() => pick({ t: 'in', id: input.id })}
						class="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-200 active:scale-95"
					>
						{input.label}
					</button>
				{/each}
			</div>
		</div>

		{#if available.length}
			<div>
				<p class="mb-1.5 text-[10px] font-black tracking-widest text-sky-400 uppercase">Your steps</p>
				<div class="flex flex-wrap gap-1.5">
					{#each available as step (step.id)}
						<button
							onclick={() => pick({ t: 'step', id: step.id })}
							class="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-200 active:scale-95"
						>
							{step.name || 'step'}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<p class="mb-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">A number</p>
			<div class="flex items-center gap-2">
				<input
					type="range"
					min="0"
					max="10"
					step="0.1"
					value={numDraft}
					oninput={(e) => setNum(Number(e.target.value))}
					class="flex-1 accent-indigo-500"
				/>
				<input
					type="number"
					step="0.1"
					value={numDraft}
					oninput={(e) => setNum(Number(e.target.value))}
					class="w-16 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 tabular-nums ring-1 ring-slate-200"
				/>
			</div>
		</div>

		<div>
			<p class="mb-1.5 text-[10px] font-black tracking-widest text-fuchsia-400 uppercase">A color</p>
			<div class="flex items-center gap-1.5">
				{#each PRESETS as preset (preset)}
					<button
						aria-label="pick color {preset}"
						onclick={() => pick({ t: 'col', v: preset })}
						class="h-6 w-6 rounded-full ring-1 ring-black/10 transition hover:scale-110 active:scale-95"
						style="background:{preset}"
					></button>
				{/each}
				<input
					type="color"
					aria-label="pick any color"
					value={value?.t === 'col' ? value.v : '#ff4488'}
					oninput={(e) => pick({ t: 'col', v: e.target.value }, true)}
					class="h-7 w-7 shrink-0 cursor-pointer rounded-lg"
				/>
			</div>
		</div>
	</div>
{/if}
