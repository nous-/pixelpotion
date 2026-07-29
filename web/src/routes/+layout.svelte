<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Preview from '$lib/Preview.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { families, freshProgram, potionPath, potionSlug } from '$lib/recipe/examples.js';
	import {
		program,
		persistProgram,
		loadProgram,
		resetProgram,
		addFunc,
		referencedFuncIds,
		getCompiled
	} from '$lib/recipe/program.svelte.js';
	import { setPaused } from '$lib/recipe/playclock.js';

	let { children } = $props();

	const compiled = $derived(getCompiled());

	let saveTimer;
	$effect(() => {
		// Touch the JSON so deep edits re-trigger the save.
		JSON.stringify(program);
		clearTimeout(saveTimer);
		saveTimer = setTimeout(persistProgram, 300);
		return () => clearTimeout(saveTimer);
	});

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

	const activeFuncId = $derived(page.params.id ?? null);
	const activeFamily = $derived(page.params.family ?? null);
	const activeTierSlug = $derived(page.params.tier ?? null);
	const usedFuncIds = $derived(referencedFuncIds());

	function newFunction() {
		const id = addFunc();
		goto(`/fn/${id}`);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Pixel Potion — draw with math</title>
</svelte:head>

<div class="flex h-screen flex-col items-center justify-center gap-4 bg-indigo-50 px-8 text-center md:hidden">
	<h1
		class="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-sky-500 bg-clip-text text-3xl font-black tracking-tight text-transparent"
	>
		Pixel Potion
	</h1>
	<p class="max-w-xs text-base font-medium leading-relaxed text-slate-500">
		This is built for tablets and desktops — open it on a bigger screen to brew.
	</p>
</div>

<div class="hidden h-screen flex-col bg-indigo-50 md:flex">
	<header class="flex items-baseline gap-3 border-b border-indigo-100 bg-white px-5 py-3 shadow-sm">
		<a href="/" class="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-sky-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
			Pixel Potion
		</a>
		<p class="text-sm font-medium text-slate-500">
			draw with math — brew steps, the last line colors every pixel
		</p>
		<div class="ml-auto flex items-center gap-2 self-center">
			<button
				onclick={resetProgram}
				class="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-black text-slate-500 transition hover:bg-slate-200 active:scale-95"
			>
				reset all
			</button>
			<button
				onclick={togglePause}
				aria-label={paused ? 'play' : 'pause'}
				class="rounded-full bg-indigo-100 p-2 text-indigo-600 transition hover:bg-indigo-200 active:scale-95"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
					<path d="M184,64V192a8,8,0,0,1-16,0V64a8,8,0,0,1,16,0Zm40-8a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,224,56Zm-87.33,58.66L48.48,58.51A15.91,15.91,0,0,0,24,71.85v112.3A15.83,15.83,0,0,0,32.23,198a15.95,15.95,0,0,0,16.25-.53l88.19-56.15a15.8,15.8,0,0,0,0-26.68Z"></path>
				</svg>
			</button>
			<button
				onclick={togglePreviewFullscreen}
				aria-label={previewFullscreen ? 'exit fullscreen' : 'enter fullscreen'}
				class="rounded-full bg-indigo-100 p-2 text-indigo-600 transition hover:bg-indigo-200 active:scale-95"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
					<path d="M93.66,202.34A8,8,0,0,1,88,216H48a8,8,0,0,1-8-8V168a8,8,0,0,1,13.66-5.66ZM88,40H48a8,8,0,0,0-8,8V88a8,8,0,0,0,13.66,5.66l40-40A8,8,0,0,0,88,40ZM211.06,160.61a8,8,0,0,0-8.72,1.73l-40,40A8,8,0,0,0,168,216h40a8,8,0,0,0,8-8V168A8,8,0,0,0,211.06,160.61ZM208,40H168a8,8,0,0,0-5.66,13.66l40,40A8,8,0,0,0,216,88V48A8,8,0,0,0,208,40Z"></path>
				</svg>
			</button>
		</div>
	</header>

	<main class="flex min-h-0 flex-1">
		<div class="flex-1 overflow-y-auto p-5">
			{@render children()}
		</div>

		<aside
			class="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-indigo-100 bg-white p-4 lg:w-96"
		>
			<div
				bind:this={previewEl}
				onclick={() => {
					if (previewFullscreen) document.exitFullscreen().catch(() => {});
				}}
				class="relative shrink-0 overflow-hidden bg-black shadow-lg ring-1 ring-indigo-100 {previewFullscreen
					? 'flex h-screen w-screen cursor-pointer items-center justify-center rounded-none'
					: 'aspect-square w-full rounded-2xl'}"
			>
				<div class={previewFullscreen ? 'size-[min(100vw,100vh)]' : 'h-full w-full'}>
					<Preview source={compiled.main} />
				</div>
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
						onclick={() => {
							loadProgram(freshProgram);
							goto('/');
						}}
					>
						Start fresh
					</button>
				</div>
				<div class="flex flex-col gap-2">
					{#each families as family, fi (family.name)}
						{#if family.section === 'gallery' && families[fi - 1]?.section !== 'gallery'}
							<h3 class="mt-3 mb-0.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
								Gallery
							</h3>
						{/if}
						<div class="flex items-center gap-2 rounded-2xl bg-indigo-50/60 px-3 py-2">
							<span class="w-24 shrink-0 text-sm font-black text-slate-600">
								{family.name}
							</span>
							<div class="flex flex-wrap gap-1.5">
								{#each family.tiers as tier (tier.label)}
									{@const href = potionPath(family.name, tier.label)}
									{@const active =
										activeFamily === potionSlug(family.name) &&
										activeTierSlug === potionSlug(tier.label)}
									<a
										{href}
										class="rounded-full px-3 py-1 text-xs font-bold ring-1 transition active:scale-95 {active
											? 'bg-indigo-500 text-white ring-indigo-600'
											: 'bg-white text-indigo-600 ring-indigo-100 hover:bg-indigo-100'}"
									>
										{tier.label}
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<p class="text-xs leading-relaxed text-slate-400">
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

			<div class="mt-auto border-t border-indigo-100 pt-4">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="text-xs font-bold tracking-widest text-violet-400 uppercase">
						Function library
					</h2>
					<button
						onclick={newFunction}
						class="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600 transition hover:bg-violet-200 active:scale-95"
					>
						+ new
					</button>
				</div>
				<div class="flex flex-col gap-1.5">
					{#each program.funcs as func (func.id)}
						<a
							href={`/fn/${func.id}`}
							class="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition active:scale-[0.99] {activeFuncId === func.id
								? 'bg-violet-500 text-white ring-1 ring-violet-600'
								: usedFuncIds.has(func.id)
									? 'bg-violet-100 ring-1 ring-violet-200 hover:bg-violet-200'
									: 'bg-violet-50/70 hover:bg-violet-100'}"
						>
							<span
								class="truncate text-sm font-black {activeFuncId === func.id
									? 'text-white'
									: 'text-violet-700'}">{func.name || 'unnamed'}</span
							>
							<span
								class="ml-auto shrink-0 text-[10px] font-bold {activeFuncId === func.id
									? 'text-violet-200'
									: 'text-violet-400'}"
							>
								{func.params.map((p) => p.name || '?').join(', ') || '—'}
							</span>
						</a>
					{/each}
					{#if !program.funcs.length}
						<p class="px-1 text-xs font-medium text-violet-300">No functions yet — make one!</p>
					{/if}
				</div>
			</div>
		</aside>
	</main>
</div>
