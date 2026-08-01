<script>
	import ProgramEditor from '$lib/ProgramEditor.svelte';
	import { potionPath } from '$lib/recipe/examples.js';
</script>

<section class="mx-auto mb-4 flex max-w-2xl items-center gap-5 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-indigo-100">
	<div class="min-w-0 flex-1 text-left">
		<p class="text-[10px] font-black tracking-[0.18em] text-indigo-400 uppercase">Your playground</p>
		<h1 class="mt-0.5 text-xl font-black tracking-tight text-slate-700">Brew anything—or follow the course.</h1>
		<p class="mt-1 text-sm font-semibold text-slate-500">
			The course grows from one color to animation, loops, 3D camera rays, and a fully lit terrain world.
		</p>
	</div>
	<a
		href={potionPath('Color', 'solid')}
		class="shrink-0 rounded-full bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-indigo-600 active:scale-95"
	>
		start course →
	</a>
</section>

<ProgramEditor />
