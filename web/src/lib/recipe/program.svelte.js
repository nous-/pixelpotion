import { compileProgram } from './compile.js';
import { families } from './examples.js';
import { newStep, newLoop, newFunc, migrateProgram, uid } from './model.js';

const STORAGE_KEY = 'pixel-potion-recipe';
const LEGACY_KEY = 'shaderbox-recipe';
const PARAM_NAMES = ['n', 'm', 'k', 'w'];

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
	// First visit: Rainbow slide — moving color with only 3 steps.
	return migrateProgram(
		structuredClone(families.find((f) => f.name === 'Rainbow').tiers.find((t) => t.label === 'slide').program)
	);
}

/** Shared recipe state — both `/` and `/fn/[id]` edit the same program. */
export const program = $state(initialProgram());

export function getCompiled() {
	return compileProgram(program);
}

export function persistProgram() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(program));
	} catch {
		// Saving is best-effort.
	}
}

/** Loop bodies count too: they are real steps other steps can refer to. */
export const flatten = (steps) => steps.flatMap((s) => (s.op === 'loop' ? (s.steps ?? []) : [s]));

export function totalSteps() {
	return flatten(program.steps).length;
}

/** What a top-level step at index i may refer to: everything above it. */
export const availableBefore = (i) => flatten(program.steps.slice(0, i));

/**
 * What a step inside the loop at index i may refer to: everything above
 * the loop, plus every step in the loop (itself and later siblings give
 * last lap's value).
 */
export const availableInLoop = (i) => [...availableBefore(i), ...(program.steps[i].steps ?? [])];

/** Scope rules inside a function mirror the main list. */
export const funcAvailableBefore = (func, si) => flatten(func.steps.slice(0, si));
export const funcAvailableInLoop = (func, si) => [
	...funcAvailableBefore(func, si),
	...(func.steps[si].steps ?? [])
];

export function loadProgram(source) {
	const fresh = migrateProgram(structuredClone(source));
	program.steps = fresh.steps;
	program.color = fresh.color;
	// The library stays yours, but any missing default function the
	// example calls comes back.
	migrateProgram(program);
}

/** Wipe the saved recipe and reload — same as a first visit. */
export function resetProgram() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(LEGACY_KEY);
	} catch {
		// Clearing is best-effort.
	}
	location.assign('/');
}

export function addStep() {
	const step = newStep(totalSteps() + 1);
	program.steps.push(step);
	if (!program.color) program.color = { t: 'step', id: step.id };
}

export function addLoop() {
	program.steps.push(newLoop(totalSteps() + 1));
}

export function addLoopStep(i) {
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

export function removeStep(i) {
	const gone = program.steps[i];
	const ids = new Set(gone.op === 'loop' ? (gone.steps ?? []).map((s) => s.id) : [gone.id]);
	program.steps.splice(i, 1);
	scrubRefs(ids);
}

export function removeLoopStep(i, j) {
	const ids = new Set([program.steps[i].steps[j].id]);
	program.steps[i].steps.splice(j, 1);
	scrubRefs(ids);
}

export function moveStep(i, dir) {
	const j = i + dir;
	if (j < 0 || j >= program.steps.length) return;
	const tmp = program.steps[i];
	program.steps[i] = program.steps[j];
	program.steps[j] = tmp;
}

export function moveLoopStep(i, j, dir) {
	const list = program.steps[i].steps;
	const k = j + dir;
	if (k < 0 || k >= list.length) return;
	const tmp = list[j];
	list[j] = list[k];
	list[k] = tmp;
}

/** Function ids the active program's steps call (op 'fn:<id>'). */
export function referencedFuncIds() {
	const ids = new Set();
	for (const step of flatten(program.steps)) {
		if (step.op?.startsWith('fn:')) ids.add(step.op.slice(3));
	}
	return ids;
}

export function addFunc() {
	const func = newFunc(program.funcs.length + 1);
	program.funcs.push(func);
	return func.id;
}

export function removeFunc(fi) {
	program.funcs.splice(fi, 1);
}

export function addParam(fi) {
	const params = program.funcs[fi].params;
	params.push({ id: uid(), name: PARAM_NAMES[params.length] ?? `p${params.length + 1}` });
}

export function removeParam(fi, pi) {
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

export function addFuncStep(fi) {
	const func = program.funcs[fi];
	const step = newStep(flatten(func.steps).length + 1);
	func.steps.push(step);
	if (!func.result) func.result = { t: 'step', id: step.id };
}

export function addFuncLoop(fi) {
	program.funcs[fi].steps.push(newLoop(flatten(program.funcs[fi].steps).length + 1));
}

export function addFuncLoopStep(fi, si) {
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

export function removeFuncStep(fi, si) {
	const func = program.funcs[fi];
	const gone = func.steps[si];
	const ids = new Set(gone.op === 'loop' ? (gone.steps ?? []).map((s) => s.id) : [gone.id]);
	func.steps.splice(si, 1);
	scrubFuncRefs(func, ids);
}

export function removeFuncLoopStep(fi, si, j) {
	const func = program.funcs[fi];
	const ids = new Set([func.steps[si].steps[j].id]);
	func.steps[si].steps.splice(j, 1);
	scrubFuncRefs(func, ids);
}

export function moveFuncStep(fi, si, dir) {
	const list = program.funcs[fi].steps;
	const k = si + dir;
	if (k < 0 || k >= list.length) return;
	const tmp = list[si];
	list[si] = list[k];
	list[k] = tmp;
}

export function moveFuncLoopStep(fi, si, j, dir) {
	const list = program.funcs[fi].steps[si].steps;
	const k = j + dir;
	if (k < 0 || k >= list.length) return;
	const tmp = list[j];
	list[j] = list[k];
	list[k] = tmp;
}
