<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ProgramEditor from '$lib/ProgramEditor.svelte';
	import { families, findPotion, potionPath, potionSlug } from '$lib/recipe/examples.js';
	import { loadProgram } from '$lib/recipe/program.svelte.js';

	const found = $derived(findPotion(page.params.family, page.params.tier));
	const courseFamilies = families.filter((family) => family.section === 'learn');
	const course = courseFamilies.flatMap((family, chapterIndex) =>
		family.tiers.map((tier, stepIndex) => ({ family, tier, chapterIndex, stepIndex }))
	);
	const courseIndex = $derived(
		course.findIndex(
			(entry) =>
				potionSlug(entry.family.name) === page.params.family &&
				potionSlug(entry.tier.label) === page.params.tier
		)
	);
	const previous = $derived(courseIndex > 0 ? course[courseIndex - 1] : null);
	const next = $derived(courseIndex >= 0 && courseIndex < course.length - 1 ? course[courseIndex + 1] : null);
	const firstShowcase = families.find((family) => family.section === 'showcase');

	function applyPotion() {
		const potion = findPotion(page.params.family, page.params.tier);
		if (potion) loadProgram(potion.tier.program);
	}

	// First paint + every client navigation between potions.
	applyPotion();
	afterNavigate(applyPotion);
</script>

{#if found}
	<section class="mx-auto mb-4 flex max-w-2xl items-center gap-5 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-indigo-100">
		<div class="min-w-0 flex-1 text-left">
			<p class="text-[10px] font-black tracking-[0.18em] text-indigo-400 uppercase">
				{#if found.family.section === 'learn'}
					Chapter {courseIndex >= 0 ? course[courseIndex].chapterIndex + 1 : 1} · Step
					{courseIndex >= 0 ? course[courseIndex].stepIndex + 1 : 1} of {found.family.tiers.length}
				{:else}
					Showcase · {found.family.dim}
				{/if}
			</p>
			<h1 class="mt-0.5 text-xl font-black tracking-tight text-slate-700">
				{found.family.name}
				<span class="text-indigo-500">→ {found.tier.label}</span>
			</h1>
			{#if found.family.section === 'learn' && found.tier.newIdea}
				<p class="mt-1 text-[10px] font-black tracking-[0.14em] text-fuchsia-500 uppercase">
					New idea · {found.tier.newIdea}
				</p>
			{/if}
			<p class="mt-1 text-sm font-semibold text-slate-500">{found.tier.teaches}</p>
		</div>

		{#if found.family.section === 'learn'}
			<nav class="flex shrink-0 items-center gap-2" aria-label="Course navigation">
				{#if previous}
					<a
						href={potionPath(previous.family.name, previous.tier.label)}
						class="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-slate-200 active:scale-95"
					>
						← back
					</a>
				{/if}
				{#if next}
					<a
						href={potionPath(next.family.name, next.tier.label)}
						class="rounded-full bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-indigo-600 active:scale-95"
					>
						next →
					</a>
				{:else if courseIndex === course.length - 1 && firstShowcase}
					<a
						href={potionPath(firstShowcase.name, firstShowcase.tiers[0].label)}
						class="rounded-full bg-fuchsia-500 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-fuchsia-600 active:scale-95"
					>
						showcase →
					</a>
				{/if}
			</nav>
		{/if}
	</section>
	<ProgramEditor />
{:else}
	<div class="mx-auto max-w-2xl text-sm font-bold text-slate-500">
		Potion not found.
		<a href="/" class="text-indigo-600 underline">Back to program</a>
	</div>
{/if}
