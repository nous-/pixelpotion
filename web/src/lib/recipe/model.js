// The program is a flat list of steps plus a final color assignment.
//
//   program = { steps: [step, ...], color: value | null }
//   step    = { id, name, op, args: { SLOT: value | null } }
//   value   = { t: 'in',   id: 'x' | 'y' | 'time' | 'dist' | 'angle' }
//           | { t: 'step', id: stepId }        (a step defined above)
//           | { t: 'num',  v: number }
//           | { t: 'col',  v: '#rrggbb' }
//
// There is no nesting: a step does one thing, and later steps refer to
// earlier ones by name. Anything plugs in anywhere (auto-coerced).

export const INPUTS = [
	{ id: 'x', label: 'x', hint: 'how far right the dot is (0 to 1)' },
	{ id: 'y', label: 'y', hint: 'how far up the dot is (0 to 1)' },
	{ id: 'time', label: 'time', hint: 'seconds ticking by - makes things move' },
	{ id: 'dist', label: 'distance from center', hint: 'how far the dot is from the middle' },
	{ id: 'angle', label: 'angle around center', hint: 'which way the dot is from the middle (0 to 1, like a clock)' },
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
		id: 'wave',
		menu: 'wave of',
		hint: 'a sin squeezed to 0..1 - one bump per whole number',
		parts: [{ op: 'wave of' }, { slot: 'N' }]
	},
	{
		id: 'repeat',
		menu: 'repeat',
		hint: 'keep only the decimals - loops 0 to 1 forever',
		parts: [{ op: 'repeat' }, { slot: 'N' }]
	},
	{
		id: 'mix',
		menu: 'mix ... and ... by',
		hint: 'blend two things: 0 gives the first, 1 the second',
		parts: [{ op: 'mix' }, { slot: 'A' }, { text: 'and' }, { slot: 'B' }, { text: 'by' }, { slot: 'T' }]
	},
	{
		id: 'rainbow',
		menu: 'rainbow',
		hint: 'turn any number into a rainbow color',
		parts: [{ op: 'rainbow' }, { slot: 'N' }]
	},
	{
		id: 'noise',
		menu: 'clouds',
		hint: 'soft random puffs that drift by',
		parts: [{ op: 'clouds' }, { slot: 'N' }]
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
	wave: { N: { t: 'in', id: 'time' } },
	repeat: { N: { t: 'in', id: 'time' } },
	rainbow: { N: { t: 'in', id: 'x' } },
	noise: { N: { t: 'num', v: 3 } },
	noisexy: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	snoise: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	noise3: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' }, C: { t: 'in', id: 'time' } },
	abs: { A: { t: 'in', id: 'x' } },
	min: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	max: { A: { t: 'in', id: 'x' }, B: { t: 'in', id: 'y' } },
	mod: { A: { t: 'in', id: 'time' }, B: { t: 'num', v: 1 } },
	floor: { A: { t: 'in', id: 'time' } },
	sqrt: { A: { t: 'in', id: 'dist' } },
	pow: { A: { t: 'in', id: 'dist' }, B: { t: 'num', v: 2 } },
	sin: { A: { t: 'in', id: 'time' } },
	cos: { A: { t: 'in', id: 'time' } },
	atan: { A: { t: 'in', id: 'y' }, B: { t: 'in', id: 'x' } },
	clamp: { A: { t: 'in', id: 'x' }, LO: { t: 'num', v: 0.25 }, HI: { t: 'num', v: 0.75 } },
	smoothstep: { A: { t: 'num', v: 0.3 }, B: { t: 'num', v: 0.7 }, T: { t: 'in', id: 'dist' } }
};

/** After changing a step's op, fill any newly-needed slots with defaults. */
export function ensureArgs(step) {
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
	return { id: uid(), name: `step ${n}`, op: 'wave', args: { N: { t: 'in', id: 'time' } } };
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
