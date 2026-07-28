<script>
	import Preview from '$lib/Preview.svelte';
	import StepRow from '$lib/StepRow.svelte';
	import ValueChip from '$lib/ValueChip.svelte';
	import { compileProgram } from '$lib/recipe/compile.js';
	import { families, freshProgram } from '$lib/recipe/examples.js';
	import { newStep, newLoop, LOOP_MAX } from '$lib/recipe/model.js';
	import { setPaused } from '$lib/recipe/playclock.js';

	const STORAGE_KEY = 'pixel-potion-recipe';
	const LEGACY_KEY = 'shaderbox-recipe';

	function initialProgram() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
			if (raw) {
				const saved = JSON.parse(raw);
				if (Array.isArray(saved?.steps)) return saved;
			}
		} catch {
			// Bad save - fall through to the default.
		}
		// First visit: the moving rainbow, instant wow with only 3 steps.
		return structuredClone(families.find((f) => f.name === 'Rainbows').tiers[1].program);
	}

	let program = $state(initialProgram());
	const compiled = $derived(compileProgram(program));

	let saveTimer;
	$effect(() => {
		const json = JSON.stringify(program);
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				localStorage.setItem(STORAGE_KEY, json);
			} catch {
				// Saving is best-effort.
			}
		}, 300);
		return () => clearTimeout(saveTimer);
	});

	// Loop bodies count too: they are real steps other steps can refer to.
	const flatten = (steps) => steps.flatMap((s) => (s.op === 'loop' ? (s.steps ?? []) : [s]));
	const totalSteps = () => flatten(program.steps).length;

	/** What a top-level step at index i may refer to: everything above it. */
	const availableBefore = (i) => flatten(program.steps.slice(0, i));

	/**
	 * What a step inside the loop at index i may refer to: everything above
	 * the loop, plus every step in the loop (itself and later siblings give
	 * last lap's value).
	 */
	const availableInLoop = (i) => [...availableBefore(i), ...(program.steps[i].steps ?? [])];

	function addStep() {
		const step = newStep(totalSteps() + 1);
		program.steps.push(step);
		if (!program.color) program.color = { t: 'step', id: step.id };
	}

	function addLoop() {
		program.steps.push(newLoop(totalSteps() + 1));
	}

	function addLoopStep(i) {
		program.steps[i].steps.push(newStep(totalSteps() + 1));
	}

	function scrubRefs(removedIds) {
		for (const step of flatten(program.steps)) {
			for (const slot of Object.keys(step.args)) {
				if (step.args[slot]?.t === 'step' && removedIds.has(step.args[slot].id)) {
					step.args[slot] = null;
				}
			}
		}
		if (program.color?.t === 'step' && removedIds.has(program.color.id)) program.color = null;
	}

	function removeStep(i) {
		const gone = program.steps[i];
		const ids = new Set(gone.op === 'loop' ? (gone.steps ?? []).map((s) => s.id) : [gone.id]);
		program.steps.splice(i, 1);
		scrubRefs(ids);
	}

	function removeLoopStep(i, j) {
		const ids = new Set([program.steps[i].steps[j].id]);
		program.steps[i].steps.splice(j, 1);
		scrubRefs(ids);
	}

	function moveStep(i, dir) {
		const j = i + dir;
		if (j < 0 || j >= program.steps.length) return;
		const tmp = program.steps[i];
		program.steps[i] = program.steps[j];
		program.steps[j] = tmp;
	}

	function moveLoopStep(i, j, dir) {
		const list = program.steps[i].steps;
		const k = j + dir;
		if (k < 0 || k >= list.length) return;
		const tmp = list[j];
		list[j] = list[k];
		list[k] = tmp;
	}

	function loadProgram(source) {
		const fresh = structuredClone(source);
		program.steps = fresh.steps;
		program.color = fresh.color;
		selectedId = null;
	}

	let paused = $state(false);
	function togglePause() {
		paused = !paused;
		setPaused(paused);
	}

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

<svelte:head>
	<title>Pixel Potion — draw with math</title>
</svelte:head>

<div class="flex h-screen flex-col bg-indigo-50">
	<header class="flex items-baseline gap-3 border-b border-indigo-100 bg-white px-5 py-3 shadow-sm">
		<h1
			class="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-sky-500 bg-clip-text text-2xl font-black tracking-tight text-transparent"
		>
			Pixel Potion
		</h1>
		<p class="text-sm font-medium text-slate-500">
			draw with math — brew steps, the last line colors every dot
		</p>
		<button
			onclick={togglePause}
			aria-label={paused ? 'play' : 'pause'}
			class="ml-auto self-center rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-black text-indigo-600 transition hover:bg-indigo-200 active:scale-95"
		>
			{paused ? '▶ play' : '⏸ pause'}
		</button>
	</header>

	<main class="flex min-h-0 flex-1">
		<div class="flex-1 overflow-y-auto p-5">
			<div class="mx-auto flex max-w-2xl flex-col gap-2">
				{#each program.steps as step, i (step.id)}
					{#if step.op === 'loop'}
						<div class="flex flex-col gap-2 rounded-2xl bg-indigo-100/70 p-2.5 ring-2 ring-indigo-200">
							<div class="flex items-center gap-2 px-1">
								<span class="text-sm font-black text-indigo-600">repeat</span>
								<ValueChip
									value={step.args.N}
									available={[]}
									onpick={(v) => (step.args.N = v)}
								/>
								<span class="text-sm font-black text-indigo-600">times</span>
								<span class="text-[10px] font-bold text-indigo-400">(up to {LOOP_MAX})</span>
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
					<span class="text-sm font-black text-emerald-700">every dot gets colored</span>
					<ValueChip
						value={program.color}
						available={flatten(program.steps)}
						onpick={(v) => (program.color = v)}
					/>
				</div>
			</div>
		</div>

		<aside
			class="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-indigo-100 bg-white p-4 lg:w-96"
		>
			<div class="aspect-square w-full shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-indigo-100">
				<Preview source={compiled.main} />
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<h2 class="text-xs font-bold tracking-widest text-slate-400 uppercase">Potion book</h2>
					<button
						class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-200 active:scale-95"
						onclick={() => loadProgram(freshProgram)}
					>
						Start fresh
					</button>
				</div>
				<div class="flex flex-col gap-2">
					{#each families as family (family.name)}
						<div class="flex items-center gap-2 rounded-2xl bg-indigo-50/60 px-3 py-2">
							<span class="w-24 shrink-0 text-sm font-black text-slate-600">
								{family.name}
							</span>
							<div class="flex flex-wrap gap-1.5">
								{#each family.tiers as tier (tier.label)}
									<button
										class="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-600 ring-1 ring-indigo-100 transition hover:bg-indigo-100 active:scale-95"
										onclick={() => loadProgram(tier.program)}
									>
										{tier.label}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<p class="mt-auto text-xs leading-relaxed text-slate-400">
				Each step makes one thing and shows a tiny preview of it. Click any
				<span class="font-bold text-indigo-500">chip</span> to swap in what the dot knows
				(<span class="font-bold text-orange-500">x</span>,
				<span class="font-bold text-orange-500">y</span>,
				<span class="font-bold text-orange-500">time</span>...), one of
				<span class="font-bold text-sky-600">your steps</span>, a number, or a color. The green
				line at the bottom decides what every dot looks like.
			</p>
		</aside>
	</main>
</div>
