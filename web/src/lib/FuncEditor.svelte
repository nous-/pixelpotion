<script>
	import StepRow from '$lib/StepRow.svelte';
	import ValueChip from '$lib/ValueChip.svelte';
	import LoopCount from '$lib/LoopCount.svelte';
	import {
		program,
		flatten,
		funcAvailableBefore,
		funcAvailableInLoop,
		addParam,
		removeParam,
		addFuncStep,
		addFuncLoop,
		addFuncLoopStep,
		removeFuncStep,
		removeFuncLoopStep,
		moveFuncStep,
		moveFuncLoopStep,
		getCompiled
	} from '$lib/recipe/program.svelte.js';

	/** @type {{ fi: number, open?: boolean, ontoggle?: () => void, onremove?: () => void, collapsible?: boolean }} */
	let { fi, open = true, ontoggle, onremove, collapsible = false } = $props();

	const func = $derived(program.funcs[fi]);
	const compiled = $derived(getCompiled());
</script>

{#if func}
	<div class="flex flex-col gap-2 rounded-2xl bg-violet-100/60 p-2.5 ring-2 ring-violet-200">
		<div class="flex flex-wrap items-center gap-2 px-1">
			{#if collapsible}
				<button
					onclick={ontoggle}
					aria-label={open ? 'collapse function' : 'expand function'}
					aria-expanded={open}
					class="rounded-lg px-1.5 py-1 text-sm font-black text-violet-500 transition hover:bg-violet-200/80 active:scale-95"
				>
					{open ? '▾' : '▸'}
				</button>
			{/if}
			{#if open}
				<input
					bind:value={program.funcs[fi].name}
					placeholder="name it"
					class="w-28 rounded-lg bg-transparent px-1.5 py-0.5 text-sm font-black text-violet-700 outline-none placeholder:font-bold placeholder:text-violet-300 hover:bg-violet-50 focus:bg-white"
				/>
				<span class="text-sm font-bold text-violet-400">is given</span>
				{#each func.params as param, pi (param.id)}
					<span class="flex items-center rounded-full bg-violet-200/80 pl-1">
						<input
							bind:value={program.funcs[fi].params[pi].name}
							placeholder="?"
							class="w-12 bg-transparent px-1.5 py-0.5 text-center text-sm font-bold text-violet-700 outline-none"
						/>
						<button
							aria-label="remove this"
							onclick={() => removeParam(fi, pi)}
							class="px-1.5 py-0.5 text-xs font-bold text-violet-400 transition hover:text-rose-500"
						>
							✕
						</button>
					</span>
				{/each}
				<button
					onclick={() => addParam(fi)}
					class="rounded-full border-2 border-dashed border-violet-300 px-2 py-0.5 text-xs font-bold text-violet-400 transition hover:border-violet-400 hover:text-violet-600 active:scale-95"
				>
					+
				</button>
			{:else}
				<button
					onclick={ontoggle}
					class="text-sm font-black text-violet-700 transition hover:text-violet-500"
				>
					{func.name || 'unnamed'}
				</button>
				<span class="text-xs font-bold text-violet-400">
					{flatten(func.steps).length} step{flatten(func.steps).length === 1 ? '' : 's'}
				</span>
			{/if}
			{#if onremove}
				<button
					onclick={onremove}
					class="ml-auto rounded-lg bg-rose-50 px-2.5 py-1.5 text-sm font-bold text-rose-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95"
					aria-label="delete function"
				>
					✕
				</button>
			{/if}
		</div>

		{#if open}
			<div class="ml-3 flex flex-col gap-2 border-l-2 border-violet-300 pl-3">
				{#each func.steps as fstep, si (fstep.id)}
					{#if fstep.op === 'loop'}
						<div class="flex flex-col gap-2 rounded-2xl bg-indigo-100/70 p-2.5 ring-2 ring-indigo-200">
							<div class="flex items-center gap-2 px-1">
								<span class="text-sm font-black text-indigo-600">repeat</span>
								<LoopCount
									value={fstep.args.N?.t === 'num' ? fstep.args.N.v : 8}
									onchange={(n) => (fstep.args.N = { t: 'num', v: n })}
								/>
								<span class="text-sm font-black text-indigo-600">times</span>
								<div class="ml-auto flex items-center gap-1">
									<button
										onclick={() => moveFuncStep(fi, si, -1)}
										disabled={si === 0}
										class="rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-slate-400 transition hover:text-indigo-500 active:scale-95 disabled:opacity-30"
										aria-label="move loop up">↑</button
									>
									<button
										onclick={() => moveFuncStep(fi, si, 1)}
										disabled={si === func.steps.length - 1}
										class="rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold text-slate-400 transition hover:text-indigo-500 active:scale-95 disabled:opacity-30"
										aria-label="move loop down">↓</button
									>
									<button
										onclick={() => removeFuncStep(fi, si)}
										class="rounded-lg bg-rose-50 px-2.5 py-1.5 text-sm font-bold text-rose-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95"
										aria-label="delete loop">✕</button
									>
								</div>
							</div>
							<div class="ml-3 flex flex-col gap-2 border-l-2 border-indigo-300 pl-3">
								{#each fstep.steps as innerStep, j (innerStep.id)}
									<StepRow
										bind:step={program.funcs[fi].steps[si].steps[j]}
										available={funcAvailableInLoop(func, si)}
										params={func.params}
										funcs={program.funcs.slice(0, fi)}
										source={compiled.sources[`fn/${func.id}/${innerStep.id}`]}
										canUp={j > 0}
										canDown={j < fstep.steps.length - 1}
										onremove={() => removeFuncLoopStep(fi, si, j)}
										onmove={(dir) => moveFuncLoopStep(fi, si, j, dir)}
									/>
								{/each}
								<button
									onclick={() => addFuncLoopStep(fi, si)}
									class="rounded-2xl border-2 border-dashed border-indigo-300 px-3 py-2 text-sm font-bold text-indigo-400 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.99]"
								>
									+ add a step
								</button>
							</div>
						</div>
					{:else}
						<StepRow
							bind:step={program.funcs[fi].steps[si]}
							available={funcAvailableBefore(func, si)}
							params={func.params}
							funcs={program.funcs.slice(0, fi)}
							source={compiled.sources[`fn/${func.id}/${fstep.id}`]}
							canUp={si > 0}
							canDown={si < func.steps.length - 1}
							onremove={() => removeFuncStep(fi, si)}
							onmove={(dir) => moveFuncStep(fi, si, dir)}
						/>
					{/if}
				{/each}
				<div class="flex gap-2">
					<button
						onclick={() => addFuncStep(fi)}
						class="flex-1 rounded-2xl border-2 border-dashed border-violet-300 px-3 py-2 text-sm font-bold text-violet-400 transition hover:border-violet-400 hover:text-violet-600 active:scale-[0.99]"
					>
						+ add a step
					</button>
					<button
						onclick={() => addFuncLoop(fi)}
						class="flex-1 rounded-2xl border-2 border-dashed border-violet-300 px-3 py-2 text-sm font-bold text-violet-400 transition hover:border-violet-400 hover:text-violet-600 active:scale-[0.99]"
					>
						+ add a loop
					</button>
				</div>
				<div class="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 ring-1 ring-violet-200">
					<span class="text-sm font-black text-violet-700">it gives back</span>
					<ValueChip
						value={func.result}
						available={flatten(func.steps)}
						params={func.params}
						onpick={(v) => (program.funcs[fi].result = v)}
					/>
				</div>
			</div>
		{/if}
	</div>
{/if}
