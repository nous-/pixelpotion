// The program is a flat list of steps plus a final color assignment.
//
//   program = { steps: [step, ...], color: value | null }
//   step    = { id, name, op, args: { SLOT: value | null } }
//   value   = { t: 'in',    id: 'x' | 'y' | 'time' | 'lap' }
//           | { t: 'step',  id: stepId }       (a step defined above)
//           | { t: 'param', id: paramId }      (inside a library function)
//           | { t: 'num',   v: number }
//           | { t: 'col',   v: '#rrggbb' }
//
// There is no nesting: a step does one thing, and later steps refer to
// earlier ones by name. Anything plugs in anywhere (auto-coerced).

export const INPUTS = [
	{ id: 'x', label: 'x', hint: 'how far right the pixel is (0 to 1)' },
	{ id: 'y', label: 'y', hint: 'how far up the pixel is (0 to 1)' },
	{ id: 'time', label: 'time', hint: 'seconds ticking by - makes things move' },
	{ id: 'lap', label: 'lap', hint: 'which lap of the repeat block this is (0, 1, 2...); 0 outside loops' },
	// The clock hands power the Clock example but would clutter the menu,
	// so they still resolve (label, hint, GLSL) without being offered.
	{ id: 'hourhand', label: 'hours hand', hint: 'how far around the clock the real hours hand is right now (0 to 1)', hidden: true },
	{ id: 'minhand', label: 'minutes hand', hint: 'how far around the clock the real minutes hand is right now (0 to 1)', hidden: true },
	{ id: 'sechand', label: 'seconds hand', hint: 'how far around the clock the real seconds hand is right now (0 to 1)', hidden: true }
];

// parts: how a step's right-hand side reads, left to right.
//   { op: 'label' }  the clickable operation word/symbol
//   { slot: 'A' }    a value chip
//   { text: 'and' }  connector word
export const OPS = [
	{
		id: 'add',
		menu: '+  plus',
		hint: 'put two things together',
		parts: [{ slot: 'A' }, { op: '+' }, { slot: 'B' }]
	},
	{
		id: 'sub',
		menu: '−  minus',
		hint: 'take one away from the other',
		parts: [{ slot: 'A' }, { op: '−' }, { slot: 'B' }]
	},
	{
		id: 'mul',
		menu: '×  times',
		hint: 'stretch or shrink - also brightens or darkens',
		parts: [{ slot: 'A' }, { op: '×' }, { slot: 'B' }]
	},
	{
		id: 'div',
		menu: '÷  divide',
		hint: 'split into pieces - tiny numbers give huge glows',
		parts: [{ slot: 'A' }, { op: '÷' }, { slot: 'B' }]
	},
	{
		id: 'abs',
		menu: 'abs',
		hint: 'drop the minus sign - how far from zero',
		parts: [{ op: 'abs' }, { slot: 'A' }]
	},
	{
		id: 'min',
		menu: 'min',
		hint: 'whichever is smaller',
		parts: [{ op: 'min' }, { slot: 'A' }, { text: 'and' }, { slot: 'B' }]
	},
	{
		id: 'max',
		menu: 'max',
		hint: 'whichever is bigger',
		parts: [{ op: 'max' }, { slot: 'A' }, { text: 'and' }, { slot: 'B' }]
	},
	{
		id: 'mod',
		menu: 'mod',
		hint: 'the leftover after dividing - counts up then snaps back',
		parts: [{ slot: 'A' }, { op: 'mod' }, { slot: 'B' }]
	},
	{
		id: 'floor',
		menu: 'floor',
		hint: 'round down to a whole number - makes stairs',
		parts: [{ op: 'floor' }, { slot: 'A' }]
	},
	{
		id: 'sqrt',
		menu: 'sqrt',
		hint: 'what number times itself makes this?',
		parts: [{ op: 'sqrt' }, { slot: 'A' }]
	},
	{
		id: 'pow',
		menu: '^  power',
		hint: 'multiply a thing by itself - sharpens soft edges',
		parts: [{ slot: 'A' }, { op: '^' }, { slot: 'B' }]
	},
	{
		id: 'exp',
		menu: 'exp',
		hint: 'grows crazy fast - feed it minus numbers to fade out',
		parts: [{ op: 'exp' }, { slot: 'A' }]
	},
	{
		id: 'log',
		menu: 'log',
		hint: "exp's opposite - squashes huge numbers back down",
		parts: [{ op: 'log' }, { slot: 'A' }]
	},
	{
		id: 'sin',
		menu: 'sin',
		hint: 'smooth back-and-forth between -1 and 1',
		parts: [{ op: 'sin' }, { slot: 'A' }]
	},
	{
		id: 'cos',
		menu: 'cos',
		hint: "sin's twin - starts at the top instead",
		parts: [{ op: 'cos' }, { slot: 'A' }]
	},
	{
		id: 'atan',
		menu: 'atan',
		hint: 'the angle pointing at those two numbers',
		parts: [{ op: 'atan' }, { slot: 'A' }, { text: ',' }, { slot: 'B' }]
	},
	{
		id: 'clamp',
		menu: 'clamp',
		hint: "keep it between two ends - it can't escape",
		parts: [{ op: 'clamp' }, { slot: 'A' }, { text: 'from' }, { slot: 'LO' }, { text: 'to' }, { slot: 'HI' }]
	},
	{
		id: 'smoothstep',
		menu: 'smoothstep',
		hint: 'a soft switch: 0 before, 1 after, silky in between',
		parts: [{ op: 'smoothstep' }, { slot: 'A' }, { text: 'to' }, { slot: 'B' }, { text: 'of' }, { slot: 'T' }]
	},
	{
		id: 'mix',
		menu: 'mix ... and ... by',
		hint: 'blend two things: 0 gives the first, 1 the second',
		parts: [{ op: 'mix' }, { slot: 'A' }, { text: 'and' }, { slot: 'B' }, { text: 'by' }, { slot: 'T' }]
	},
	{
		id: 'noisexy',
		menu: 'noise',
		hint: 'smooth randomness at a spot - what clouds are made of',
		parts: [{ op: 'noise' }, { slot: 'A' }, { text: ',' }, { slot: 'B' }]
	},
	{
		id: 'snoise',
		menu: 'simplex',
		hint: 'streaky cloud noise - swings above and below zero',
		parts: [{ op: 'simplex' }, { slot: 'A' }, { text: ',' }, { slot: 'B' }]
	},
	{
		id: 'noise3',
		menu: 'noise3',
		hint: 'noise in 3D - feed time to the third slot to churn it',
		parts: [
			{ op: 'noise3' },
			{ slot: 'A' },
			{ text: ',' },
			{ slot: 'B' },
			{ text: ',' },
			{ slot: 'C' }
		]
	},
	{
		id: 'rgb',
		menu: 'red / green / blue',
		hint: 'build a color from three numbers (0 to 1)',
		parts: [
			{ op: 'color' },
			{ text: 'red' },
			{ slot: 'R' },
			{ text: 'green' },
			{ slot: 'G' },
			{ text: 'blue' },
			{ slot: 'B' }
		]
	},
	{
		id: 'just',
		menu: 'just',
		hint: 'pass it along unchanged',
		parts: [{ op: 'just' }, { slot: 'A' }]
	}
];

export const opById = (id) => OPS.find((o) => o.id === id) ?? OPS[0];

const SLOT_DEFAULTS = {
	A: { t: 'num', v: 1 },
	B: { t: 'num', v: 1 },
	N: { t: 'num', v: 1 },
	T: { t: 'num', v: 0.5 },
	R: { t: 'num', v: 1 },
	G: { t: 'num', v: 0.5 },
	C: { t: 'num', v: 0 },
	LO: { t: 'num', v: 0 },
	HI: { t: 'num', v: 1 }
};

// Defaults that make the op instantly show something interesting.
const OP_DEFAULTS = {
	noisexy: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	snoise: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	noise3: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' }, C: { t: 'in', id: 'time' } },
	abs: { A: { t: 'in', id: 'x' } },
	min: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	max: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	mod: { A: { t: 'in', id: 'time' }, B: { t: 'num', v: 1 } },
	floor: { A: { t: 'in', id: 'time' } },
	sqrt: { A: { t: 'in', id: 'x' } },
	pow: { A: { t: 'in', id: 'x' }, B: { t: 'num', v: 2 } },
	sin: { A: { t: 'in', id: 'time' } },
	cos: { A: { t: 'in', id: 'time' } },
	atan: { A: { t: 'in', id: 'y' }, B: { t: 'in', id: 'x' } },
	clamp: { A: { t: 'in', id: 'x' }, LO: { t: 'num', v: 0.25 }, HI: { t: 'num', v: 0.75 } },
	smoothstep: { A: { t: 'num', v: 0.3 }, B: { t: 'num', v: 0.7 }, T: { t: 'in', id: 'x' } }
};

/** After changing a step's op, fill any newly-needed slots with defaults. */
export function ensureArgs(step, funcs = []) {
	if (step.op?.startsWith('fn:')) {
		const func = funcs.find((f) => f.id === step.op.slice(3));
		(func?.params ?? []).forEach((p, i) => {
			if (step.args[p.id] == null) {
				step.args[p.id] = i === 0 ? { t: 'in', id: 'x' } : { t: 'num', v: 1 };
			}
		});
		return;
	}
	for (const part of opById(step.op).parts) {
		if (part.slot && step.args[part.slot] == null) {
			const preferred = OP_DEFAULTS[step.op]?.[part.slot] ?? SLOT_DEFAULTS[part.slot];
			step.args[part.slot] = structuredClone(preferred ?? { t: 'num', v: 1 });
		}
	}
}

export function uid() {
	return crypto.randomUUID ? crypto.randomUUID() : `s${Math.random().toString(36).slice(2)}`;
}

/** A new step that is instantly alive: a wave of time. */
export function newStep(n) {
	return { id: uid(), name: `step ${n}`, op: 'fn:wave', args: { N: { t: 'in', id: 'time' } } };
}

/**
 * A repeat block. Its steps run top to bottom, N laps in a row (capped at
 * 64 so it can never run away). Referencing a step above gives this lap's
 * value; referencing itself or one below gives last lap's value, starting
 * from 0 on the first lap.
 */
export const LOOP_MAX = 64;

export function newLoop(n) {
	return {
		id: uid(),
		name: 'repeat',
		op: 'loop',
		args: { N: { t: 'num', v: 8 } },
		steps: [newStep(n)]
	};
}

// ---- The function library ----------------------------------------------
// A function is a mini recipe: named params, a step list, and a "gives
// back" value. Calling one is a step with op 'fn:<funcId>' whose args are
// keyed by param id. A function may call functions defined ABOVE it in
// the library (never itself), so calls can never loop forever.
//
//   func = { id, name, params: [{ id, name }], steps: [step...], result: value | null }
//
// Inside a function, steps can use params ({ t: 'param', id }) plus all
// the usual inputs (x, y, time...).

export function newParam(name = 'n') {
	return { id: uid(), name };
}

export function newFunc(n) {
	const first = newStep(1);
	first.op = 'sin';
	first.args = { A: { t: 'in', id: 'time' } };
	return {
		id: uid(),
		name: `magic ${n}`,
		params: [{ id: uid(), name: 'n' }],
		steps: [first],
		result: { t: 'step', id: first.id }
	};
}

// These used to be baked-in operations. Now they're ordinary library
// functions kids can open up and mess with.
const P = { t: 'param', id: 'N' };
const st = (id, op, args, name = id) => ({ id, name, op, args });

export const DEFAULT_FUNCS = [
	{
		id: 'wave',
		name: 'wave',
		params: [{ id: 'N', name: 'n' }],
		steps: [
			st('wv1', 'mul', { A: P, B: { t: 'num', v: 6.28318 } }, 'whole turn'),
			st('wv2', 'sin', { A: { t: 'step', id: 'wv1' } }, 'swing'),
			st('wv3', 'mul', { A: { t: 'step', id: 'wv2' }, B: { t: 'num', v: 0.5 } }, 'half'),
			st('wv4', 'add', { A: { t: 'step', id: 'wv3' }, B: { t: 'num', v: 0.5 } }, 'lift')
		],
		result: { t: 'step', id: 'wv4' }
	},
	{
		id: 'repeat',
		name: 'repeat',
		params: [{ id: 'N', name: 'n' }],
		steps: [
			st('fr1', 'floor', { A: P }, 'whole part'),
			st('fr2', 'sub', { A: P, B: { t: 'step', id: 'fr1' } }, 'decimals')
		],
		result: { t: 'step', id: 'fr2' }
	},
	{
		id: 'rainbow',
		name: 'rainbow',
		params: [{ id: 'N', name: 'n' }],
		steps: [
			st('rb1', 'floor', { A: P }),
			st('rb2', 'sub', { A: P, B: { t: 'step', id: 'rb1' } }, 'hue'),
			st('rb3', 'mul', { A: { t: 'step', id: 'rb2' }, B: { t: 'num', v: 6 } }),
			st('rb4', 'sub', { A: { t: 'step', id: 'rb3' }, B: { t: 'num', v: 3 } }),
			st('rb5', 'abs', { A: { t: 'step', id: 'rb4' } }),
			st('rb6', 'sub', { A: { t: 'step', id: 'rb5' }, B: { t: 'num', v: 1 } }),
			st('rb7', 'clamp', { A: { t: 'step', id: 'rb6' }, LO: { t: 'num', v: 0 }, HI: { t: 'num', v: 1 } }, 'red'),
			st('rb8', 'add', { A: { t: 'step', id: 'rb2' }, B: { t: 'num', v: 0.6667 } }),
			st('rb9', 'floor', { A: { t: 'step', id: 'rb8' } }),
			st('rb10', 'sub', { A: { t: 'step', id: 'rb8' }, B: { t: 'step', id: 'rb9' } }),
			st('rb11', 'mul', { A: { t: 'step', id: 'rb10' }, B: { t: 'num', v: 6 } }),
			st('rb12', 'sub', { A: { t: 'step', id: 'rb11' }, B: { t: 'num', v: 3 } }),
			st('rb13', 'abs', { A: { t: 'step', id: 'rb12' } }),
			st('rb14', 'sub', { A: { t: 'step', id: 'rb13' }, B: { t: 'num', v: 1 } }),
			st('rb15', 'clamp', { A: { t: 'step', id: 'rb14' }, LO: { t: 'num', v: 0 }, HI: { t: 'num', v: 1 } }, 'green'),
			st('rb16', 'add', { A: { t: 'step', id: 'rb2' }, B: { t: 'num', v: 0.3333 } }),
			st('rb17', 'floor', { A: { t: 'step', id: 'rb16' } }),
			st('rb18', 'sub', { A: { t: 'step', id: 'rb16' }, B: { t: 'step', id: 'rb17' } }),
			st('rb19', 'mul', { A: { t: 'step', id: 'rb18' }, B: { t: 'num', v: 6 } }),
			st('rb20', 'sub', { A: { t: 'step', id: 'rb19' }, B: { t: 'num', v: 3 } }),
			st('rb21', 'abs', { A: { t: 'step', id: 'rb20' } }),
			st('rb22', 'sub', { A: { t: 'step', id: 'rb21' }, B: { t: 'num', v: 1 } }),
			st('rb23', 'clamp', { A: { t: 'step', id: 'rb22' }, LO: { t: 'num', v: 0 }, HI: { t: 'num', v: 1 } }, 'blue'),
			st('rb24', 'rgb', {
				R: { t: 'step', id: 'rb7' },
				G: { t: 'step', id: 'rb15' },
				B: { t: 'step', id: 'rb23' }
			}, 'paint')
		],
		result: { t: 'step', id: 'rb24' }
	},
	{
		id: 'clouds',
		name: 'clouds',
		params: [{ id: 'N', name: 'zoom' }],
		steps: [
			st('cl1', 'mul', { A: { t: 'in', id: 'x' }, B: P }),
			st('cl2', 'mul', { A: { t: 'in', id: 'time' }, B: { t: 'num', v: 0.15 } }),
			st('cl3', 'sub', { A: { t: 'step', id: 'cl1' }, B: { t: 'step', id: 'cl2' } }, 'qx'),
			st('cl4', 'mul', { A: { t: 'in', id: 'y' }, B: P }),
			st('cl5', 'mul', { A: { t: 'in', id: 'time' }, B: { t: 'num', v: 0.35 } }),
			st('cl6', 'sub', { A: { t: 'step', id: 'cl4' }, B: { t: 'step', id: 'cl5' } }, 'qy'),
			st('cl7', 'noisexy', { A: { t: 'step', id: 'cl3' }, B: { t: 'step', id: 'cl6' } }, 'big puffs'),
			st('cl8', 'mul', { A: { t: 'step', id: 'cl7' }, B: { t: 'num', v: 0.5 } }),
			st('cl9', 'mul', { A: { t: 'step', id: 'cl3' }, B: { t: 'num', v: 2 } }),
			st('cl10', 'add', { A: { t: 'step', id: 'cl9' }, B: { t: 'num', v: 11.3 } }),
			st('cl11', 'mul', { A: { t: 'step', id: 'cl6' }, B: { t: 'num', v: 2 } }),
			st('cl12', 'add', { A: { t: 'step', id: 'cl11' }, B: { t: 'num', v: 11.3 } }),
			st('cl13', 'noisexy', { A: { t: 'step', id: 'cl10' }, B: { t: 'step', id: 'cl12' } }, 'mid puffs'),
			st('cl14', 'mul', { A: { t: 'step', id: 'cl13' }, B: { t: 'num', v: 0.25 } }),
			st('cl15', 'mul', { A: { t: 'step', id: 'cl3' }, B: { t: 'num', v: 4 } }),
			st('cl16', 'add', { A: { t: 'step', id: 'cl15' }, B: { t: 'num', v: 27.7 } }),
			st('cl17', 'mul', { A: { t: 'step', id: 'cl6' }, B: { t: 'num', v: 4 } }),
			st('cl18', 'add', { A: { t: 'step', id: 'cl17' }, B: { t: 'num', v: 27.7 } }),
			st('cl19', 'noisexy', { A: { t: 'step', id: 'cl16' }, B: { t: 'step', id: 'cl18' } }, 'small puffs'),
			st('cl20', 'mul', { A: { t: 'step', id: 'cl19' }, B: { t: 'num', v: 0.125 } }),
			st('cl21', 'add', { A: { t: 'step', id: 'cl8' }, B: { t: 'step', id: 'cl14' } }),
			st('cl22', 'add', { A: { t: 'step', id: 'cl21' }, B: { t: 'step', id: 'cl20' } }),
			st('cl23', 'div', { A: { t: 'step', id: 'cl22' }, B: { t: 'num', v: 0.875 } }, 'evened out')
		],
		result: { t: 'step', id: 'cl23' }
	},
	{
		id: 'dist',
		name: 'distance',
		params: [],
		steps: [
			st('ds1', 'sub', { A: { t: 'in', id: 'x' }, B: { t: 'num', v: 0.5 } }, 'dx'),
			st('ds2', 'sub', { A: { t: 'in', id: 'y' }, B: { t: 'num', v: 0.5 } }, 'dy'),
			st('ds3', 'mul', { A: { t: 'step', id: 'ds1' }, B: { t: 'step', id: 'ds1' } }, 'dx squared'),
			st('ds4', 'mul', { A: { t: 'step', id: 'ds2' }, B: { t: 'step', id: 'ds2' } }, 'dy squared'),
			st('ds5', 'add', { A: { t: 'step', id: 'ds3' }, B: { t: 'step', id: 'ds4' } }),
			st('ds6', 'sqrt', { A: { t: 'step', id: 'ds5' } }, 'how far'),
			st('ds7', 'mul', { A: { t: 'step', id: 'ds6' }, B: { t: 'num', v: 2 } }, 'stretched')
		],
		result: { t: 'step', id: 'ds7' }
	},
	{
		id: 'angle',
		name: 'angle',
		params: [],
		steps: [
			st('an1', 'sub', { A: { t: 'in', id: 'y' }, B: { t: 'num', v: 0.5 } }, 'dy'),
			st('an2', 'sub', { A: { t: 'in', id: 'x' }, B: { t: 'num', v: 0.5 } }, 'dx'),
			st('an3', 'atan', { A: { t: 'step', id: 'an1' }, B: { t: 'step', id: 'an2' } }, 'turn'),
			st('an4', 'div', { A: { t: 'step', id: 'an3' }, B: { t: 'num', v: 6.28318 } }, 'as 0 to 1'),
			st('an5', 'add', { A: { t: 'step', id: 'an4' }, B: { t: 'num', v: 0.5 } }, 'no minus')
		],
		result: { t: 'step', id: 'an5' }
	}
];

// Ops that used to be built in and are now library functions. Their args
// carry over untouched: the old N slot is the new N param.
const OP_TO_FN = { wave: 'fn:wave', repeat: 'fn:repeat', rainbow: 'fn:rainbow', noise: 'fn:clouds' };

// Inputs that used to be built in. They were values, not ops, so a
// program that used them gets a step prepended that calls the library
// function, and every old orange chip points at that step instead.
const IN_TO_FN = {
	dist: { stepId: '__dist', fn: 'fn:dist', name: 'distance' },
	angle: { stepId: '__angle', fn: 'fn:angle', name: 'angle' }
};

// Bump when stock library bodies change or need to heal corrupt saves.
// On mismatch, default funcs are replaced; user-made funcs are kept.
const LIBRARY_VERSION = 2;

/**
 * Upgrades a program in place: old baked-in ops become library calls, and
 * the default functions are (re)added if missing so those calls resolve.
 */
export function migrateProgram(program) {
	const fix = (steps) => {
		for (const s of steps ?? []) {
			if (OP_TO_FN[s.op]) s.op = OP_TO_FN[s.op];
			if (s.op === 'loop') fix(s.steps);
		}
	};
	fix(program.steps);
	if (!Array.isArray(program.funcs)) program.funcs = [];
	for (const f of program.funcs) fix(f.steps);

	const needed = new Set();
	const fixValue = (v) => {
		const to = v?.t === 'in' ? IN_TO_FN[v.id] : null;
		if (!to) return v;
		needed.add(v.id);
		return { t: 'step', id: to.stepId };
	};
	const fixValues = (steps) => {
		for (const s of steps ?? []) {
			for (const slot of Object.keys(s.args ?? {})) s.args[slot] = fixValue(s.args[slot]);
			if (s.op === 'loop') fixValues(s.steps);
		}
	};
	fixValues(program.steps);
	program.color = fixValue(program.color);
	for (const id of ['angle', 'dist']) {
		if (!needed.has(id)) continue;
		const to = IN_TO_FN[id];
		if (!program.steps.some((s) => s.id === to.stepId)) {
			program.steps.unshift({ id: to.stepId, name: to.name, op: to.fn, args: {} });
		}
	}

	const stockIds = new Set(DEFAULT_FUNCS.map((d) => d.id));
	if (program.libraryVersion !== LIBRARY_VERSION) {
		// Replace corrupt/outdated stock funcs; keep anything the kid made.
		program.funcs = [
			...DEFAULT_FUNCS.map((d) => structuredClone(d)),
			...program.funcs.filter((f) => !stockIds.has(f.id))
		];
		program.libraryVersion = LIBRARY_VERSION;
	} else {
		for (const d of DEFAULT_FUNCS) {
			if (!program.funcs.some((f) => f.id === d.id)) program.funcs.push(structuredClone(d));
		}
	}
	return program;
}
