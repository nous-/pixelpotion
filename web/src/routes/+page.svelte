<script>
	import Preview from '$lib/Preview.svelte';
	import StepRow from '$lib/StepRow.svelte';
	import ValueChip from '$lib/ValueChip.svelte';
	import { compileProgram } from '$lib/recipe/compile.js';
	import { families, freshProgram } from '$lib/recipe/examples.js';
	import { newStep, newLoop, newFunc, migrateProgram, uid, LOOP_MAX } from '$lib/recipe/model.js';
	import { setPaused } from '$lib/recipe/playclock.js';

	const STORAGE_KEY = 'pixel-potion-recipe';
	const LEGACY_KEY = 'shaderbox-recipe';

	function initialProgram() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
			if (raw) {
				const saved = JSON.parse(raw);
				if (Array.isArray(saved?.steps)) return migrateProgram(saved);
			}
		} catch {
			// Bad save - fall through to the default.
		}
		// First visit: the moving rainbow, instant wow with only 3 steps.
		return migrateProgram(
			structuredClone(families.find((f) => f.name === 'Rainbows').tiers[1].program)
		);
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
		const fresh = migrateProgram(structuredClone(source));
		program.steps = fresh.steps;
		program.color = fresh.color;
		// The library stays yours, but any missing default function the
		// example calls comes back.
		migrateProgram(program);
		selectedId = null;
	}

	// ---- Function library --------------------------------------------

	const PARAM_NAMES = ['n', 'm', 'k', 'w'];

	function addFunc() {
		program.funcs.push(newFunc(program.funcs.length + 1));
	}

	function removeFunc(fi) {
		program.funcs.splice(fi, 1);
	}

	function addParam(fi) {
		const params = program.funcs[fi].params;
		params.push({ id: uid(), name: PARAM_NAMES[params.length] ?? `p${params.length + 1}` });
	}

	function removeParam(fi, pi) {
		const func = program.funcs[fi];
		const gone = func.params[pi].id;
		func.params.splice(pi, 1);
		for (const step of func.steps) {
			for (const slot of Object.keys(step.args)) {
				if (step.args[slot]?.t === 'param' && step.args[slot].id === gone) step.args[slot] = null;
			}
		}
		if (func.result?.t === 'param' && func.result.id === gone) func.result = null;
	}

	function addFuncStep(fi) {
		const func = program.funcs[fi];
		const step = newStep(flatten(func.steps).length + 1);
		func.steps.push(step);
		if (!func.result) func.result = { t: 'step', id: step.id };
	}

	function addFuncLoop(fi) {
		const func = program.funcs[fi];
		func.steps.push(newLoop(flatten(func.steps).length + 1));
	}

	function addFuncLoopStep(fi, si) {
		const func = program.funcs[fi];
		func.steps[si].steps.push(newStep(flatten(func.steps).length + 1));
	}

	function scrubFuncRefs(func, removedIds) {
		for (const step of flatten(func.steps)) {
			for (const slot of Object.keys(step.args)) {
				if (step.args[slot]?.t === 'step' && removedIds.has(step.args[slot].id)) {
					step.args[slot] = null;
				}
			}
		}
		if (func.result?.t === 'step' && removedIds.has(func.result.id)) func.result = null;
	}

	function removeFuncStep(fi, si) {
		const func = program.funcs[fi];
		const gone = func.steps[si];
		const ids = new Set(gone.op === 'loop' ? (gone.steps ?? []).map((s) => s.id) : [gone.id]);
		func.steps.splice(si, 1);
		scrubFuncRefs(func, ids);
	}

	function removeFuncLoopStep(fi, si, j) {
		const func = program.funcs[fi];
		const ids = new Set([func.steps[si].steps[j].id]);
		func.steps[si].steps.splice(j, 1);
		scrubFuncRefs(func, ids);
	}

	function moveFuncStep(fi, si, dir) {
		const list = program.funcs[fi].steps;
		const k = si + dir;
		if (k < 0 || k >= list.length) return;
		const tmp = list[si];
		list[si] = list[k];
		list[k] = tmp;
	}

	function moveFuncLoopStep(fi, si, j, dir) {
		const list = program.funcs[fi].steps[si].steps;
		const k = j + dir;
		if (k < 0 || k >= list.length) return;
		const tmp = list[j];
		list[j] = list[k];
		list[k] = tmp;
	}

	/** Scope rules inside a function mirror the main list. */
	const funcAvailableBefore = (func, si) => flatten(func.steps.slice(0, si));
	const funcAvailableInLoop = (func, si) => [
		...funcAvailableBefore(func, si),
		...(func.steps[si].steps ?? [])
	];

	let paused = $state(false);
	function togglePause() {
		paused = !paused;
		setPaused(paused);
	}

	let previewEl;
	let previewFullscreen = $state(false);

	async function togglePreviewFullscreen() {
		if (!previewEl) return;
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await previewEl.requestFullscreen();
		} catch {
			// Fullscreen can be denied by the browser.
		}
	}

	$effect(() => {
		const sync = () => {
			previewFullscreen = document.fullscreenElement === previewEl;
		};
		document.addEventListener('fullscreenchange', sync);
		return () => document.removeEventListener('fullscreenchange', sync);
	});

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
			draw with math — brew steps, the last line colors every pixel
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

				<!-- The function library: mini recipes with their own params.
				     A function may call the ones above it, never itself. -->
				<div class="mt-8 mb-2 flex items-center justify-between">
					<h2 class="text-xs font-bold tracking-widest text-violet-400 uppercase">
						Function library
					</h2>
					<button
						onclick={addFunc}
						class="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600 transition hover:bg-violet-200 active:scale-95"
					>
						+ new function
					</button>
				</div>

				{#each program.funcs as func, fi (func.id)}
					<div class="flex flex-col gap-2 rounded-2xl bg-violet-100/60 p-2.5 ring-2 ring-violet-200">
						<div class="flex flex-wrap items-center gap-2 px-1">
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
							<button
								onclick={() => removeFunc(fi)}
								class="ml-auto rounded-lg bg-rose-50 px-2.5 py-1.5 text-sm font-bold text-rose-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95"
								aria-label="delete function"
							>
								✕
							</button>
						</div>

						<div class="ml-3 flex flex-col gap-2 border-l-2 border-violet-300 pl-3">
							{#each func.steps as fstep, si (fstep.id)}
								{#if fstep.op === 'loop'}
									<div
										class="flex flex-col gap-2 rounded-2xl bg-indigo-100/70 p-2.5 ring-2 ring-indigo-200"
									>
										<div class="flex items-center gap-2 px-1">
											<span class="text-sm font-black text-indigo-600">repeat</span>
											<ValueChip
												value={fstep.args.N}
												available={[]}
												onpick={(v) => (fstep.args.N = v)}
											/>
											<span class="text-sm font-black text-indigo-600">times</span>
											<span class="text-[10px] font-bold text-indigo-400">(up to {LOOP_MAX})</span>
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
					</div>
				{/each}
			</div>
		</div>

		<aside
			class="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-indigo-100 bg-white p-4 lg:w-96"
		>
			<div
				bind:this={previewEl}
				class="relative shrink-0 overflow-hidden bg-black shadow-lg ring-1 ring-indigo-100 {previewFullscreen
					? 'flex h-screen w-screen items-center justify-center rounded-none'
					: 'aspect-square w-full rounded-2xl'}"
			>
				<div class={previewFullscreen ? 'size-[min(100vw,100vh)]' : 'h-full w-full'}>
					<Preview source={compiled.main} />
				</div>
				<button
					onclick={togglePreviewFullscreen}
					aria-label={previewFullscreen ? 'exit fullscreen' : 'enter fullscreen'}
					class="absolute top-2 right-2 z-10 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition hover:bg-black/65 active:scale-95"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
						<path d="M93.66,202.34A8,8,0,0,1,88,216H48a8,8,0,0,1-8-8V168a8,8,0,0,1,13.66-5.66ZM88,40H48a8,8,0,0,0-8,8V88a8,8,0,0,0,13.66,5.66l40-40A8,8,0,0,0,88,40ZM211.06,160.61a8,8,0,0,0-8.72,1.73l-40,40A8,8,0,0,0,168,216h40a8,8,0,0,0,8-8V168A8,8,0,0,0,211.06,160.61ZM208,40H168a8,8,0,0,0-5.66,13.66l40,40A8,8,0,0,0,216,88V48A8,8,0,0,0,208,40Z"></path>
					</svg>
				</button>
			</div>

			<div>
				<div class="mb-2 flex items-center justify-between">
					<h2 class="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
							<path d="M221.69,199.77,160,96.92V40h8a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16h8V96.92L34.31,199.77A16,16,0,0,0,48,224H208a16,16,0,0,0,13.72-24.23Zm-90.08-42.91c-15.91-8.05-31.05-12.32-45.22-12.81l24.47-40.8A7.93,7.93,0,0,0,112,99.14V40h32V99.14a7.93,7.93,0,0,0,1.14,4.11L183.36,167C171.4,169.34,154.29,168.34,131.61,156.86Z"></path>
						</svg>
						Potion book
					</h2>
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
				<span class="font-bold text-indigo-500">chip</span> to swap in what the pixel knows
				(<span class="font-bold text-orange-500">x</span>,
				<span class="font-bold text-orange-500">y</span>,
				<span class="font-bold text-orange-500">time</span>...), one of
				<span class="font-bold text-sky-600">your steps</span>, a number, or a color. The green
				line at the bottom decides what every pixel looks like.
			</p>

			<a
				href="mailto:andrew@variancestudios.com"
				class="self-end text-xs font-medium text-slate-400 transition hover:text-indigo-500"
			>
				andrew@variancestudios.com
			</a>
		</aside>
	</main>
</div>
