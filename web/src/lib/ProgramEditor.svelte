<script>
	import StepRow from '$lib/StepRow.svelte';
	import ValueChip from '$lib/ValueChip.svelte';
	import LoopCount from '$lib/LoopCount.svelte';
	import FuncEditor from '$lib/FuncEditor.svelte';
	import {
		program,
		flatten,
		availableBefore,
		availableInLoop,
		addStep,
		addLoop,
		addLoopStep,
		removeStep,
		removeLoopStep,
		moveStep,
		moveLoopStep,
		removeFunc,
		referencedFuncIds,
		getCompiled
	} from '$lib/recipe/program.svelte.js';

	const compiled = $derived(getCompiled());

	// Empty = collapsed. Kids expand the ones they want to peek into.
	let openFuncs = $state(new Set());

	function toggleFunc(id) {
		const next = new Set(openFuncs);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		openFuncs = next;
	}

	const visibleFuncIndices = $derived(
		program.funcs.map((f, i) => i).filter((i) => referencedFuncIds().has(program.funcs[i].id))
	);

	// Click a row to light up everything it's built from: the row itself
	// glows brightest, direct ingredients a bit less, theirs even less,
	// all the way back to the roots.
	let selectedId = $state(null);
	const selectStep = (id) => (selectedId = selectedId === id ? null : id);

	const depths = $derived.by(() => {
		const map = new Map();
		if (!selectedId) return map;
		const byId = new Map(flatten(program.steps).map((s) => [s.id, s]));
		if (!byId.has(selectedId)) return map;
		let frontier = [selectedId];
		let depth = 0;
		while (frontier.length) {
			const next = [];
			for (const id of frontier) {
				if (map.has(id)) continue;
				map.set(id, depth);
				const step = byId.get(id);
				for (const v of Object.values(step?.args ?? {})) {
					if (v?.t === 'step' && !map.has(v.id) && byId.has(v.id)) next.push(v.id);
				}
			}
			frontier = next;
			depth += 1;
		}
		return map;
	});
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-2">
	{#each program.steps as step, i (step.id)}
		{#if step.op === 'loop'}
			<div class="flex flex-col gap-2 rounded-2xl bg-indigo-100/70 p-2.5 ring-2 ring-indigo-200">
				<div class="flex items-center gap-2 px-1">
					<span class="text-sm font-black text-indigo-600">repeat</span>
					<LoopCount
						value={step.args.N?.t === 'num' ? step.args.N.v : 8}
						onchange={(n) => (step.args.N = { t: 'num', v: n })}
					/>
					<span class="text-sm font-black text-indigo-600">times</span>
					<div class="ml-auto flex items-center gap-1">
						<button
							onclick={() => moveStep(i, -1)}
							disabled={i === 0}
							class="rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-slate-400 transition hover:text-indigo-500 active:scale-95 disabled:opacity-30"
							aria-label="move loop up">↑</button
						>
						<button
							onclick={() => moveStep(i, 1)}
							disabled={i === program.steps.length - 1}
							class="rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-slate-400 transition hover:text-indigo-500 active:scale-95 disabled:opacity-30"
							aria-label="move loop down">↓</button
						>
						<button
							onclick={() => removeStep(i)}
							class="rounded-lg bg-rose-50 px-2.5 py-1.5 text-sm font-bold text-rose-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95"
							aria-label="delete loop">✕</button
						>
					</div>
				</div>
				<div class="ml-3 flex flex-col gap-2 border-l-2 border-indigo-300 pl-3">
					{#each step.steps as innerStep, j (innerStep.id)}
						<StepRow
							bind:step={program.steps[i].steps[j]}
							available={availableInLoop(i)}
							funcs={program.funcs}
							source={compiled.sources[innerStep.id]}
							canUp={j > 0}
							canDown={j < step.steps.length - 1}
							highlight={depths.get(innerStep.id)}
							onselect={() => selectStep(innerStep.id)}
							onremove={() => removeLoopStep(i, j)}
							onmove={(dir) => moveLoopStep(i, j, dir)}
						/>
					{/each}
					<button
						onclick={() => addLoopStep(i)}
						class="rounded-2xl border-2 border-dashed border-indigo-300 px-3 py-2 text-sm font-bold text-indigo-400 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.99]"
					>
						+ add a step
					</button>
				</div>
			</div>
		{:else}
			<StepRow
				bind:step={program.steps[i]}
				available={availableBefore(i)}
				funcs={program.funcs}
				source={compiled.sources[step.id]}
				canUp={i > 0}
				canDown={i < program.steps.length - 1}
				highlight={depths.get(step.id)}
				onselect={() => selectStep(step.id)}
				onremove={() => removeStep(i)}
				onmove={(dir) => moveStep(i, dir)}
			/>
		{/if}
	{/each}

	<div class="flex gap-2">
		<button
			onclick={addStep}
			class="flex-1 rounded-2xl border-2 border-dashed border-indigo-200 px-3 py-2.5 text-sm font-bold text-indigo-400 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.99]"
		>
			+ add a step
		</button>
		<button
			onclick={addLoop}
			class="flex-1 rounded-2xl border-2 border-dashed border-indigo-200 px-3 py-2.5 text-sm font-bold text-indigo-400 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.99]"
		>
			+ add a loop
		</button>
	</div>

	<div
		class="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 shadow-sm ring-2 ring-emerald-200"
	>
		<span class="text-sm font-black text-emerald-700">every pixel gets colored</span>
		<ValueChip
			value={program.color}
			available={flatten(program.steps)}
			onpick={(v) => (program.color = v)}
		/>
	</div>

	{#if visibleFuncIndices.length}
		<div class="mt-8 mb-2">
			<h2 class="text-xs font-bold tracking-widest text-violet-400 uppercase">Functions</h2>
		</div>

		{#each visibleFuncIndices as fi (program.funcs[fi].id)}
			{@const func = program.funcs[fi]}
			<FuncEditor
				{fi}
				open={openFuncs.has(func.id)}
				collapsible
				ontoggle={() => toggleFunc(func.id)}
				onremove={() => removeFunc(fi)}
			/>
		{/each}
	{/if}
</div>
