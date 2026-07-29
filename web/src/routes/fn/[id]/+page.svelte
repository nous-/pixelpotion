<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FuncEditor from '$lib/FuncEditor.svelte';
	import { program, removeFunc } from '$lib/recipe/program.svelte.js';

	const fi = $derived(program.funcs.findIndex((f) => f.id === page.params.id));

	function deleteAndLeave() {
		removeFunc(fi);
		goto('/');
	}
</script>

{#if fi >= 0}
	<div class="mx-auto flex max-w-2xl flex-col gap-3">
		<a
			href="/"
			class="self-start rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600 transition hover:bg-indigo-200 active:scale-95"
		>
			← back to program
		</a>
		<FuncEditor {fi} open onremove={deleteAndLeave} />
	</div>
{:else}
	<div class="mx-auto max-w-2xl text-sm font-bold text-slate-500">
		Function not found.
		<a href="/" class="text-indigo-600 underline">Back to program</a>
	</div>
{/if}
