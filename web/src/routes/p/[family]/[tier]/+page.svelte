<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ProgramEditor from '$lib/ProgramEditor.svelte';
	import { findPotion } from '$lib/recipe/examples.js';
	import { loadProgram } from '$lib/recipe/program.svelte.js';

	const found = $derived(findPotion(page.params.family, page.params.tier));

	function applyPotion() {
		const potion = findPotion(page.params.family, page.params.tier);
		if (potion) loadProgram(potion.tier.program);
	}

	// First paint + every client navigation between potions.
	applyPotion();
	afterNavigate(applyPotion);
</script>

{#if found}
	<ProgramEditor />
{:else}
	<div class="mx-auto max-w-2xl text-sm font-bold text-slate-500">
		Potion not found.
		<a href="/" class="text-indigo-600 underline">Back to program</a>
	</div>
{/if}
