// Compiles a step-list program into GLSL fragment shaders.
//
// Values are internally numbers (float) or colors (vec3) but coerce freely:
//   number -> color: grayscale vec3(n)
//   color -> number: brightness (luminance)
// so any value fits any slot and every program compiles.

const NUM = 'num';
const COL = 'col';

const toNum = (v) => (v.kind === NUM ? v.code : `dot(${v.code}, vec3(0.299, 0.587, 0.114))`);
const toCol = (v) => (v.kind === COL ? v.code : `vec3(${v.code})`);

function fmt(n) {
	const f = Number(n);
	if (!Number.isFinite(f)) return '0.0';
	return Number.isInteger(f) ? `${f}.0` : `${f}`;
}

function hexToVec3(hex) {
	const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
	if (!m) return 'vec3(1.0, 0.0, 1.0)';
	const int = parseInt(m[1], 16);
	const chan = (shift) => (((int >> shift) & 0xff) / 255).toFixed(4);
	return `vec3(${chan(16)}, ${chan(8)}, ${chan(0)})`;
}

const INPUT_CODE = {
	x: 'x',
	y: 'y',
	time: 't',
	dist: 'dist',
	angle: 'ang',
	lap: 'lap',
	hourhand: 'u_clock.x',
	minhand: 'u_clock.y',
	sechand: 'u_clock.z'
};

// Repeat blocks are capped here AND in GLSL (constant loop bounds), so a
// loop can never run forever.
const LOOP_MAX = 64;

/**
 * Resolves a value reference against the current scope (vars/kinds maps
 * keyed by step id); anything broken quietly becomes 0. Inside a repeat
 * block the loop's own steps are all in scope: reading a step assigned
 * later in the body (or itself) simply reads last lap's value.
 */
function refExpr(value, kinds, vars) {
	if (!value) return { kind: NUM, code: '0.0' };
	switch (value.t) {
		case 'in':
			return { kind: NUM, code: INPUT_CODE[value.id] ?? '0.0' };
		case 'num':
			return { kind: NUM, code: fmt(value.v) };
		case 'col':
			return { kind: COL, code: hexToVec3(value.v) };
		case 'step': {
			const v = vars.get(value.id);
			if (!v) return { kind: NUM, code: '0.0' };
			return { kind: kinds.get(value.id) ?? NUM, code: v };
		}
	}
	return { kind: NUM, code: '0.0' };
}

const BINARY = { add: '+', sub: '-', mul: '*', div: '/' };

function stepExpr(step, ref) {
	const arg = (slot) => ref(step.args?.[slot]);
	switch (step.op) {
		case 'add':
		case 'sub':
		case 'mul':
		case 'div': {
			const a = arg('A');
			const b = arg('B');
			if (a.kind === COL || b.kind === COL) {
				return { kind: COL, code: `(${toCol(a)} ${BINARY[step.op]} ${toCol(b)})` };
			}
			return { kind: NUM, code: `(${a.code} ${BINARY[step.op]} ${b.code})` };
		}
		case 'abs':
			return { kind: NUM, code: `abs(${toNum(arg('A'))})` };
		case 'min':
			return { kind: NUM, code: `min(${toNum(arg('A'))}, ${toNum(arg('B'))})` };
		case 'max':
			return { kind: NUM, code: `max(${toNum(arg('A'))}, ${toNum(arg('B'))})` };
		case 'mod':
			return { kind: NUM, code: `mod(${toNum(arg('A'))}, ${toNum(arg('B'))})` };
		case 'floor':
			return { kind: NUM, code: `floor(${toNum(arg('A'))})` };
		// sqrt of a negative would paint NaN-black, so clip at zero.
		case 'sqrt':
			return { kind: NUM, code: `sqrt(max(${toNum(arg('A'))}, 0.0))` };
		// GLSL pow is undefined for negative bases; abs keeps it safe.
		case 'pow':
			return { kind: NUM, code: `pow(abs(${toNum(arg('A'))}), ${toNum(arg('B'))})` };
		case 'exp':
			return { kind: NUM, code: `exp(${toNum(arg('A'))})` };
		case 'log':
			return { kind: NUM, code: `log(max(${toNum(arg('A'))}, 0.0000001))` };
		case 'sin':
			return { kind: NUM, code: `sin(${toNum(arg('A'))})` };
		case 'cos':
			return { kind: NUM, code: `cos(${toNum(arg('A'))})` };
		case 'atan':
			return { kind: NUM, code: `atan(${toNum(arg('A'))}, ${toNum(arg('B'))})` };
		case 'clamp':
			return { kind: NUM, code: `clamp(${toNum(arg('A'))}, ${toNum(arg('LO'))}, ${toNum(arg('HI'))})` };
		case 'smoothstep':
			return {
				kind: NUM,
				code: `smoothstep(${toNum(arg('A'))}, ${toNum(arg('B'))}, ${toNum(arg('T'))})`
			};
		case 'wave':
			return { kind: NUM, code: `sb_wave(${toNum(arg('N'))})` };
		case 'repeat':
			return { kind: NUM, code: `fract(${toNum(arg('N'))})` };
		case 'mix': {
			const a = arg('A');
			const b = arg('B');
			const t = `clamp(${toNum(arg('T'))}, 0.0, 1.0)`;
			if (a.kind === COL || b.kind === COL) {
				return { kind: COL, code: `mix(${toCol(a)}, ${toCol(b)}, ${t})` };
			}
			return { kind: NUM, code: `mix(${a.code}, ${b.code}, ${t})` };
		}
		case 'rainbow':
			return { kind: COL, code: `sb_rainbow(${toNum(arg('N'))})` };
		case 'noise':
			return { kind: NUM, code: `sb_clouds(p, ${toNum(arg('N'))}, t)` };
		case 'noisexy':
			return { kind: NUM, code: `sb_vnoise(vec2(${toNum(arg('A'))}, ${toNum(arg('B'))}))` };
		case 'snoise':
			return { kind: NUM, code: `sb_snoise(vec2(${toNum(arg('A'))}, ${toNum(arg('B'))}))` };
		case 'noise3':
			return {
				kind: NUM,
				code: `sb_vnoise3(vec3(${toNum(arg('A'))}, ${toNum(arg('B'))}, ${toNum(arg('C'))}))`
			};
		case 'rgb':
			return { kind: COL, code: `vec3(${toNum(arg('R'))}, ${toNum(arg('G'))}, ${toNum(arg('B'))})` };
		case 'just':
			return arg('A');
	}
	return { kind: NUM, code: '0.0' };
}

const shader = (decls, colorExpr) => `precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_clock;

float sb_wave(float n) {
	return 0.5 + 0.5 * sin(n * 6.28318530718);
}

vec3 sb_rainbow(float n) {
	float h = fract(n);
	return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
}

float sb_hash(vec2 q) {
	return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453123);
}

float sb_vnoise(vec2 q) {
	vec2 i = floor(q);
	vec2 f = fract(q);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = sb_hash(i);
	float b = sb_hash(i + vec2(1.0, 0.0));
	float c = sb_hash(i + vec2(0.0, 1.0));
	float d = sb_hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Simplex noise (iq / drift's 2D clouds): output swings roughly -1..1.
vec2 sb_hash2(vec2 p) {
	p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float sb_snoise(vec2 p) {
	const float K1 = 0.366025404;
	const float K2 = 0.211324865;
	vec2 i = floor(p + (p.x + p.y) * K1);
	vec2 a = p - i + (i.x + i.y) * K2;
	vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0 * K2;
	vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
	vec3 n = h * h * h * h
		* vec3(dot(a, sb_hash2(i + 0.0)), dot(b, sb_hash2(i + o)), dot(c, sb_hash2(i + 1.0)));
	return dot(n, vec3(70.0));
}

float sb_hash3(vec3 q) {
	return fract(sin(dot(q, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float sb_vnoise3(vec3 q) {
	vec3 i = floor(q);
	vec3 f = fract(q);
	vec3 u = f * f * (3.0 - 2.0 * f);
	float a = mix(sb_hash3(i), sb_hash3(i + vec3(1.0, 0.0, 0.0)), u.x);
	float b = mix(sb_hash3(i + vec3(0.0, 1.0, 0.0)), sb_hash3(i + vec3(1.0, 1.0, 0.0)), u.x);
	float c = mix(sb_hash3(i + vec3(0.0, 0.0, 1.0)), sb_hash3(i + vec3(1.0, 0.0, 1.0)), u.x);
	float d = mix(sb_hash3(i + vec3(0.0, 1.0, 1.0)), sb_hash3(i + vec3(1.0, 1.0, 1.0)), u.x);
	return mix(mix(a, b, u.y), mix(c, d, u.y), u.z);
}

// Fractal value noise that slowly drifts up and to the right, so clouds
// float by and fire rises. The zoom argument sets the feature size.
float sb_clouds(vec2 pos, float zoom, float t) {
	vec2 q = pos * zoom + vec2(t * -0.15, t * -0.35);
	float v = 0.5 * sb_vnoise(q);
	v += 0.25 * sb_vnoise(q * 2.0 + 11.3);
	v += 0.125 * sb_vnoise(q * 4.0 + 27.7);
	return v / 0.875;
}

void main() {
	vec2 p = gl_FragCoord.xy / u_resolution;
	float x = p.x;
	float y = p.y;
	float t = u_time;
	float dist = length(p - 0.5) * 2.0;
	float ang = atan(p.y - 0.5, p.x - 0.5) / 6.28318530718 + 0.5;
	float lap = 0.0;
${decls}
	vec3 color = ${colorExpr};
	gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/**
 * Returns { main, sources } where main is the full-picture shader and
 * sources[stepId] shows that step's value on its own (numbers as
 * grayscale). Steps inside a repeat block show their value after the
 * whole loop has run.
 */
export function compileProgram(program) {
	const steps = program.steps ?? [];
	const lines = [];
	const marks = new Map(); // step id -> line count once its value exists
	const kinds = new Map(); // step id -> NUM | COL, once in scope
	const vars = new Map(); // step id -> GLSL variable name
	let vi = 0;
	let li = 0;

	for (const step of steps) {
		if (step.op === 'loop') {
			// Nested loops are not supported; plain steps only in the body.
			const body = (step.steps ?? []).filter((s) => s.op !== 'loop');
			if (!body.length) continue;
			const raw = step.args?.N?.t === 'num' ? Number(step.args.N.v) : 8;
			const n = Math.min(LOOP_MAX, Math.max(1, Math.round(Number.isFinite(raw) ? raw : 8)));

			for (const s of body) vars.set(s.id, `v${vi++}`);
			// Loop-carried references make kinds circular; iterate to settle
			// (unknown refs read as numbers on the first pass).
			const bodyKinds = new Map(kinds);
			for (let pass = 0; pass < 3; pass++) {
				for (const s of body) {
					bodyKinds.set(s.id, stepExpr(s, (v) => refExpr(v, bodyKinds, vars)).kind);
				}
			}

			for (const s of body) {
				const k = bodyKinds.get(s.id);
				lines.push(`\t${k === COL ? 'vec3' : 'float'} ${vars.get(s.id)} = ${k === COL ? 'vec3(0.0)' : '0.0'};`);
			}
			const it = `l${li++}`;
			lines.push(`\tfor (int ${it} = 0; ${it} < ${n}; ${it}++) {`);
			lines.push(`\t\tlap = float(${it});`);
			for (const s of body) {
				const e = stepExpr(s, (v) => refExpr(v, bodyKinds, vars));
				const k = bodyKinds.get(s.id);
				const code = e.kind === k ? e.code : k === COL ? toCol(e) : toNum(e);
				lines.push(`\t\t${vars.get(s.id)} = ${code};`);
			}
			lines.push('\t}');
			lines.push('\tlap = 0.0;');
			for (const s of body) {
				kinds.set(s.id, bodyKinds.get(s.id));
				marks.set(s.id, lines.length);
			}
		} else {
			const e = stepExpr(step, (v) => refExpr(v, kinds, vars));
			const v = `v${vi++}`;
			vars.set(step.id, v);
			kinds.set(step.id, e.kind);
			lines.push(`\t${e.kind === COL ? 'vec3' : 'float'} ${v} = ${e.code};`);
			marks.set(step.id, lines.length);
		}
	}

	const finalRef = refExpr(program.color, kinds, vars);
	const main = shader(lines.join('\n'), program.color ? toCol(finalRef) : 'vec3(0.15)');

	const sources = {};
	for (const [id, mark] of marks) {
		sources[id] = shader(
			lines.slice(0, mark).join('\n'),
			toCol({ kind: kinds.get(id), code: vars.get(id) })
		);
	}

	return { main, sources };
}
