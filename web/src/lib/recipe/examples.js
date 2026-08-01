// Starter recipes, so kids begin by remixing something fun.

const num = (v) => ({ t: 'num', v });
const inp = (id) => ({ t: 'in', id });
const ref = (id) => ({ t: 'step', id });
const col = (v) => ({ t: 'col', v });
const loop = (id, n, steps) => ({ id, name: 'repeat', op: 'loop', args: { N: num(n) }, steps });

// ---- Clock building blocks: a faithful translation of Inigo Quilez's
// watch shader. Only fwidth (edge softness, replaced by a small constant)
// and the dither hash are approximated.

// p = 2*(uv - 0.5) and r = length(p), like the original's centered coords.
const clockCoords = [
	{ id: 'ox', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
	{ id: 'px0', name: 'px', op: 'mul', args: { A: ref('ox'), B: num(2) } },
	{ id: 'oy', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
	{ id: 'py0', name: 'py', op: 'mul', args: { A: ref('oy'), B: num(2) } },
	{ id: 'rx', name: 'rx', op: 'mul', args: { A: ref('px0'), B: ref('px0') } },
	{ id: 'ry', name: 'ry', op: 'mul', args: { A: ref('py0'), B: ref('py0') } },
	{ id: 'rs', name: 'rs', op: 'add', args: { A: ref('rx'), B: ref('ry') } },
	{ id: 'r', name: 'r', op: 'sqrt', args: { A: ref('rs') } }
];

// Watch body: d = r-0.94; outside gets the soft shadow 1 - 0.5/(1+32d),
// inside becomes the 0.9 grey plate.
const clockBody = [
	{ id: 'bd', name: 'bd', op: 'sub', args: { A: ref('r'), B: num(0.94) } },
	{ id: 'bdp', name: 'bd+', op: 'max', args: { A: ref('bd'), B: num(0) } },
	{ id: 'bs1', name: 'bs1', op: 'mul', args: { A: ref('bdp'), B: num(32) } },
	{ id: 'bs2', name: 'bs2', op: 'add', args: { A: ref('bs1'), B: num(1) } },
	{ id: 'bs3', name: 'bs3', op: 'div', args: { A: num(0.5), B: ref('bs2') } },
	{ id: 'bs4', name: 'shadow', op: 'sub', args: { A: num(1), B: ref('bs3') } },
	{ id: 'bcol', name: 'bg', op: 'mul', args: { A: col('#ffffff'), B: ref('bs4') } },
	{ id: 'be', name: 'be', op: 'smoothstep', args: { A: num(0), B: num(0.01), T: ref('bd') } },
	{ id: 'bei', name: 'inside', op: 'sub', args: { A: num(1), B: ref('be') } },
	{ id: 'bodycol', name: 'body', op: 'mix', args: { A: ref('bcol'), B: col('#e6e6e6'), T: ref('bei') } }
];

// Five-minute marks: a triangle wave with 60 spokes, thickened and pulled
// inward at every 12th spoke, kept to the ring between r=0.85 and 0.94.
const clockMarks = [
	{ id: 'k1', name: 'k1', op: 'mul', args: { A: inp('angle'), B: num(60) } },
	{ id: 'k2', name: 'k2', op: 'add', args: { A: ref('k1'), B: num(0.5) } },
	{ id: 'k3', name: 'k3', op: 'repeat', args: { N: ref('k2') } },
	{ id: 'k4', name: 'k4', op: 'mul', args: { A: ref('k3'), B: num(2) } },
	{ id: 'k5', name: 'k5', op: 'sub', args: { A: ref('k4'), B: num(1) } },
	{ id: 'k6', name: 'f', op: 'abs', args: { A: ref('k5') } },
	{ id: 'k7', name: 'k7', op: 'mul', args: { A: inp('angle'), B: num(12) } },
	{ id: 'k8', name: 'k8', op: 'add', args: { A: ref('k7'), B: num(0.5) } },
	{ id: 'k9', name: 'k9', op: 'repeat', args: { N: ref('k8') } },
	{ id: 'k10', name: 'k10', op: 'mul', args: { A: ref('k9'), B: num(2) } },
	{ id: 'k11', name: 'k11', op: 'sub', args: { A: ref('k10'), B: num(1) } },
	{ id: 'k12', name: 'k12', op: 'abs', args: { A: ref('k11') } },
	{ id: 'k13', name: 'k13', op: 'smoothstep', args: { A: num(0), B: num(0.1), T: ref('k12') } },
	{ id: 'k14', name: 'g', op: 'sub', args: { A: num(1), B: ref('k13') } },
	{ id: 'k15', name: 'k15', op: 'mul', args: { A: ref('k14'), B: num(0.1) } },
	{ id: 'k16', name: 'k16', op: 'add', args: { A: ref('k15'), B: num(0.05) } },
	{ id: 'k17', name: 'k17', op: 'sub', args: { A: ref('k16'), B: num(0.02) } },
	{ id: 'k18', name: 'k18', op: 'add', args: { A: ref('k16'), B: num(0.02) } },
	{ id: 'k19', name: 'k19', op: 'smoothstep', args: { A: ref('k17'), B: ref('k18'), T: ref('k6') } },
	{ id: 'k20', name: 'spokes', op: 'sub', args: { A: num(1), B: ref('k19') } },
	{ id: 'k21', name: 'k21', op: 'mul', args: { A: ref('k14'), B: num(0.05) } },
	{ id: 'k22', name: 'k22', op: 'add', args: { A: ref('r'), B: ref('k21') } },
	{ id: 'k23', name: 'k23', op: 'smoothstep', args: { A: num(0.85), B: num(0.86), T: ref('k22') } },
	{ id: 'k24', name: 'k24', op: 'smoothstep', args: { A: num(0.94), B: num(0.95), T: ref('r') } },
	{ id: 'k25', name: 'ring', op: 'sub', args: { A: ref('k23'), B: ref('k24') } },
	{ id: 'k26', name: 'marks', op: 'mul', args: { A: ref('k20'), B: ref('k25') } },
	{ id: 'markscol', name: 'with marks', op: 'mix', args: { A: ref('bodycol'), B: col('#000000'), T: ref('k26') } }
];

// One hand, IQ's sdLine exactly: the segment runs from -0.15*dir to
// M*dir, distance to it via project-clamp, then a soft-edged stroke of
// width wx painted over the previous color.
const clockHand = (p, dirT, M, wx, color, prev) => [
	{ id: p + 'tx', name: p + ' turn', op: 'mul', args: { A: ref(dirT), B: num(6.283185) } },
	{ id: p + 'dx', name: p + ' dir x', op: 'sin', args: { A: ref(p + 'tx') } },
	{ id: p + 'dy', name: p + ' dir y', op: 'cos', args: { A: ref(p + 'tx') } },
	{ id: p + 'e1', name: p + ' e1', op: 'mul', args: { A: ref('px0'), B: ref(p + 'dx') } },
	{ id: p + 'e2', name: p + ' e2', op: 'mul', args: { A: ref('py0'), B: ref(p + 'dy') } },
	{ id: p + 'e', name: p + ' along', op: 'add', args: { A: ref(p + 'e1'), B: ref(p + 'e2') } },
	{ id: p + 'u', name: p + ' u', op: 'add', args: { A: ref(p + 'e'), B: num(0.15) } },
	{ id: p + 'c', name: p + ' c', op: 'clamp', args: { A: ref(p + 'u'), LO: num(0), HI: num(M) } },
	{ id: p + 'k', name: p + ' k', op: 'sub', args: { A: num(0.15), B: ref(p + 'c') } },
	{ id: p + 'w1', name: p + ' w1', op: 'mul', args: { A: ref(p + 'dx'), B: ref(p + 'k') } },
	{ id: p + 'vx', name: p + ' vx', op: 'add', args: { A: ref('px0'), B: ref(p + 'w1') } },
	{ id: p + 'w2', name: p + ' w2', op: 'mul', args: { A: ref(p + 'dy'), B: ref(p + 'k') } },
	{ id: p + 'vy', name: p + ' vy', op: 'add', args: { A: ref('py0'), B: ref(p + 'w2') } },
	{ id: p + 'q1', name: p + ' q1', op: 'mul', args: { A: ref(p + 'vx'), B: ref(p + 'vx') } },
	{ id: p + 'q2', name: p + ' q2', op: 'mul', args: { A: ref(p + 'vy'), B: ref(p + 'vy') } },
	{ id: p + 'q', name: p + ' q', op: 'add', args: { A: ref(p + 'q1'), B: ref(p + 'q2') } },
	{ id: p + 'd', name: p + ' dist', op: 'sqrt', args: { A: ref(p + 'q') } },
	{
		id: p + 'sm',
		name: p + ' sm',
		op: 'smoothstep',
		args: { A: num(wx - 0.004), B: num(wx + 0.004), T: ref(p + 'd') }
	},
	{ id: p + 'a', name: p + ' stroke', op: 'sub', args: { A: num(1), B: ref(p + 'sm') } },
	{ id: p + 'col', name: 'with ' + p, op: 'mix', args: { A: ref(prev), B: col(color), T: ref(p + 'a') } }
];

// The seconds hand ticks: whole seconds, plus a smoothstep snap in the
// last tenth of each second (IQ's secs += smoothstep(0.9,1.0,mils)).
const clockSecTick = [
	{ id: 'sf', name: 'secs', op: 'mul', args: { A: inp('sechand'), B: num(60) } },
	{ id: 'sw', name: 'whole', op: 'floor', args: { A: ref('sf') } },
	{ id: 'sfr', name: 'mils', op: 'sub', args: { A: ref('sf'), B: ref('sw') } },
	{ id: 'snap', name: 'snap', op: 'smoothstep', args: { A: num(0.9), B: num(1), T: ref('sfr') } },
	{ id: 'st', name: 'ticked', op: 'add', args: { A: ref('sw'), B: ref('snap') } },
	{ id: 'ssec', name: 'sec turn', op: 'div', args: { A: ref('st'), B: num(60) } }
];

// Minute and hour hands jump like the original's floor(iDate/60) etc.
const clockMinHr = [
	{ id: 'mf', name: 'mins', op: 'mul', args: { A: inp('minhand'), B: num(60) } },
	{ id: 'mw', name: 'mins whole', op: 'floor', args: { A: ref('mf') } },
	{ id: 'mm', name: 'min turn', op: 'div', args: { A: ref('mw'), B: num(60) } },
	{ id: 'hf', name: 'hours', op: 'mul', args: { A: inp('hourhand'), B: num(12) } },
	{ id: 'hw', name: 'hours whole', op: 'floor', args: { A: ref('hf') } },
	{ id: 'hh', name: 'hour turn', op: 'div', args: { A: ref('hw'), B: num(12) } }
];

// Center: shaded mini circle (1 - 0.5/(1+64d)), 0.9 grey cap, black ring.
const clockCenter = (prev) => [
	{ id: 'zd', name: 'zd', op: 'sub', args: { A: ref('r'), B: num(0.035) } },
	{ id: 'zdp', name: 'zd+', op: 'max', args: { A: ref('zd'), B: num(0) } },
	{ id: 'z1', name: 'z1', op: 'mul', args: { A: ref('zdp'), B: num(64) } },
	{ id: 'z2', name: 'z2', op: 'add', args: { A: ref('z1'), B: num(1) } },
	{ id: 'z3', name: 'z3', op: 'div', args: { A: num(0.5), B: ref('z2') } },
	{ id: 'z4', name: 'cap shadow', op: 'sub', args: { A: num(1), B: ref('z3') } },
	{ id: 'zca', name: 'zca', op: 'mul', args: { A: ref(prev), B: ref('z4') } },
	{ id: 'zs', name: 'zs', op: 'smoothstep', args: { A: num(0.035), B: num(0.038), T: ref('r') } },
	{ id: 'zsi', name: 'in cap', op: 'sub', args: { A: num(1), B: ref('zs') } },
	{ id: 'zcb', name: 'zcb', op: 'mix', args: { A: ref('zca'), B: col('#e6e6e6'), T: ref('zsi') } },
	{ id: 'zr1', name: 'zr1', op: 'sub', args: { A: ref('r'), B: num(0.038) } },
	{ id: 'zra', name: 'zra', op: 'abs', args: { A: ref('zr1') } },
	{ id: 'zrs', name: 'zrs', op: 'smoothstep', args: { A: num(0), B: num(0.007), T: ref('zra') } },
	{ id: 'zri', name: 'cap ring', op: 'sub', args: { A: num(1), B: ref('zrs') } },
	{ id: 'paint', name: 'paint', op: 'mix', args: { A: ref('zcb'), B: col('#000000'), T: ref('zri') } }
];

// ---- Shapes building blocks: the classic signed-distance recipes.

const shapeCoords = [
	{ id: 'ox', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
	{ id: 'px0', name: 'px', op: 'mul', args: { A: ref('ox'), B: num(2) } },
	{ id: 'oy', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
	{ id: 'py0', name: 'py', op: 'mul', args: { A: ref('oy'), B: num(2) } }
];

// Circle: how far from the center, minus the radius.
const shapeCircle = [
	{ id: 'cX', name: 'c x', op: 'add', args: { A: ref('px0'), B: num(0.5) } },
	{ id: 'cY', name: 'c y', op: 'sub', args: { A: ref('py0'), B: num(0.5) } },
	{ id: 'cxx', name: 'c xx', op: 'mul', args: { A: ref('cX'), B: ref('cX') } },
	{ id: 'cyy', name: 'c yy', op: 'mul', args: { A: ref('cY'), B: ref('cY') } },
	{ id: 'crr', name: 'c rr', op: 'add', args: { A: ref('cxx'), B: ref('cyy') } },
	{ id: 'cr', name: 'c r', op: 'sqrt', args: { A: ref('crr') } },
	{ id: 'cd', name: 'c d', op: 'sub', args: { A: ref('cr'), B: num(0.3) } },
	{ id: 'csm', name: 'c sm', op: 'smoothstep', args: { A: num(0), B: num(0.01), T: ref('cd') } },
	{ id: 'cfill', name: 'circle', op: 'sub', args: { A: num(1), B: ref('csm') } }
];

// Box: fold into one corner with abs, subtract the half-size, then
// distance to the corner outside plus the interior term (IQ's sdBox).
const shapeBox = [
	{ id: 'bX', name: 'b x', op: 'sub', args: { A: ref('px0'), B: num(0.5) } },
	{ id: 'bY', name: 'b y', op: 'sub', args: { A: ref('py0'), B: num(0.5) } },
	{ id: 'bax', name: 'b ax', op: 'abs', args: { A: ref('bX') } },
	{ id: 'bay', name: 'b ay', op: 'abs', args: { A: ref('bY') } },
	{ id: 'bqx', name: 'b qx', op: 'sub', args: { A: ref('bax'), B: num(0.28) } },
	{ id: 'bqy', name: 'b qy', op: 'sub', args: { A: ref('bay'), B: num(0.2) } },
	{ id: 'bmx', name: 'b mx', op: 'max', args: { A: ref('bqx'), B: num(0) } },
	{ id: 'bmy', name: 'b my', op: 'max', args: { A: ref('bqy'), B: num(0) } },
	{ id: 'bxx', name: 'b xx', op: 'mul', args: { A: ref('bmx'), B: ref('bmx') } },
	{ id: 'byy', name: 'b yy', op: 'mul', args: { A: ref('bmy'), B: ref('bmy') } },
	{ id: 'bqq', name: 'b qq', op: 'add', args: { A: ref('bxx'), B: ref('byy') } },
	{ id: 'bout', name: 'b out', op: 'sqrt', args: { A: ref('bqq') } },
	{ id: 'bmax', name: 'b max', op: 'max', args: { A: ref('bqx'), B: ref('bqy') } },
	{ id: 'bmin', name: 'b in', op: 'min', args: { A: ref('bmax'), B: num(0) } },
	{ id: 'bd', name: 'b d', op: 'add', args: { A: ref('bout'), B: ref('bmin') } },
	{ id: 'bsm', name: 'b sm', op: 'smoothstep', args: { A: num(0), B: num(0.01), T: ref('bd') } },
	{ id: 'bfill', name: 'box', op: 'sub', args: { A: num(1), B: ref('bsm') } }
];

// Line segment from a=(-0.75,-0.15) to b=(-0.15,-0.7): project onto the
// segment, clamp, and take the distance to the closest point (sdLine).
const shapeLine = [
	{ id: 'lx', name: 'l x', op: 'add', args: { A: ref('px0'), B: num(0.75) } },
	{ id: 'ly', name: 'l y', op: 'add', args: { A: ref('py0'), B: num(0.15) } },
	{ id: 'le1', name: 'l e1', op: 'mul', args: { A: ref('lx'), B: num(0.6) } },
	{ id: 'le2', name: 'l e2', op: 'mul', args: { A: ref('ly'), B: num(-0.55) } },
	{ id: 'le', name: 'l along', op: 'add', args: { A: ref('le1'), B: ref('le2') } },
	{ id: 'lh0', name: 'l h0', op: 'div', args: { A: ref('le'), B: num(0.6625) } },
	{ id: 'lh', name: 'l h', op: 'clamp', args: { A: ref('lh0'), LO: num(0), HI: num(1) } },
	{ id: 'lhx', name: 'l hx', op: 'mul', args: { A: ref('lh'), B: num(0.6) } },
	{ id: 'lvx', name: 'l vx', op: 'sub', args: { A: ref('lx'), B: ref('lhx') } },
	{ id: 'lhy', name: 'l hy', op: 'mul', args: { A: ref('lh'), B: num(-0.55) } },
	{ id: 'lvy', name: 'l vy', op: 'sub', args: { A: ref('ly'), B: ref('lhy') } },
	{ id: 'lq1', name: 'l q1', op: 'mul', args: { A: ref('lvx'), B: ref('lvx') } },
	{ id: 'lq2', name: 'l q2', op: 'mul', args: { A: ref('lvy'), B: ref('lvy') } },
	{ id: 'lq', name: 'l q', op: 'add', args: { A: ref('lq1'), B: ref('lq2') } },
	{ id: 'ld', name: 'l d', op: 'sqrt', args: { A: ref('lq') } },
	{ id: 'lsm', name: 'l sm', op: 'smoothstep', args: { A: num(0.03), B: num(0.04), T: ref('ld') } },
	{ id: 'lstroke', name: 'line', op: 'sub', args: { A: num(1), B: ref('lsm') } }
];

// Curve: a parabola (the simplest bezier), stroked. Distance is the
// implicit value y - 2x^2 divided by the length of its slope, then a
// smoothstep window keeps it to a short arc.
const shapeCurve = [
	{ id: 'vX', name: 'v x', op: 'sub', args: { A: ref('px0'), B: num(0.5) } },
	{ id: 'vY', name: 'v y', op: 'add', args: { A: ref('py0'), B: num(0.55) } },
	{ id: 'vx2', name: 'v xx', op: 'mul', args: { A: ref('vX'), B: ref('vX') } },
	{ id: 'vk', name: 'v 2xx', op: 'mul', args: { A: ref('vx2'), B: num(2) } },
	{ id: 'vf', name: 'v f', op: 'sub', args: { A: ref('vY'), B: ref('vk') } },
	{ id: 'vfa', name: 'v |f|', op: 'abs', args: { A: ref('vf') } },
	{ id: 'vg1', name: 'v g1', op: 'mul', args: { A: ref('vx2'), B: num(16) } },
	{ id: 'vg2', name: 'v g2', op: 'add', args: { A: ref('vg1'), B: num(1) } },
	{ id: 'vg', name: 'v slope', op: 'sqrt', args: { A: ref('vg2') } },
	{ id: 'vd', name: 'v d', op: 'div', args: { A: ref('vfa'), B: ref('vg') } },
	{ id: 'vsm', name: 'v sm', op: 'smoothstep', args: { A: num(0.03), B: num(0.04), T: ref('vd') } },
	{ id: 'vln', name: 'v line', op: 'sub', args: { A: num(1), B: ref('vsm') } },
	{ id: 'vxa', name: 'v |x|', op: 'abs', args: { A: ref('vX') } },
	{ id: 'vcm', name: 'v ends', op: 'smoothstep', args: { A: num(0.3), B: num(0.32), T: ref('vxa') } },
	{ id: 'vcmi', name: 'v keep', op: 'sub', args: { A: num(1), B: ref('vcm') } },
	{ id: 'vstroke', name: 'curve', op: 'mul', args: { A: ref('vln'), B: ref('vcmi') } }
];

// ---- Flame building blocks: adapted from XT95's raymarched candle
// flame. The 64-step marching loop cannot exist in a step list, so this
// is the same flame formula flattened to 2D: a squashed-sphere distance,
// plus two octaves of value noise rising over time and growing with
// height, shaped into a glow with smoothstep and pow.

const flameCoords = [
	{ id: 'ox', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
	{ id: 'px0', name: 'px', op: 'mul', args: { A: ref('ox'), B: num(2) } },
	{ id: 'oy', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
	{ id: 'py0', name: 'py', op: 'mul', args: { A: ref('oy'), B: num(2) } }
];

// sphere(p*vec2(1.5,0.75), center (0,-0.55), r 0.55): squeeze x harder
// than y so the ball stretches into a flame-tall oval.
const flameShape = [
	{ id: 'sx', name: 'sx', op: 'mul', args: { A: ref('px0'), B: num(1.5) } },
	{ id: 'syo', name: 'syo', op: 'add', args: { A: ref('py0'), B: num(0.55) } },
	{ id: 'sy', name: 'sy', op: 'mul', args: { A: ref('syo'), B: num(0.75) } },
	{ id: 'qx', name: 'qx', op: 'mul', args: { A: ref('sx'), B: ref('sx') } },
	{ id: 'qy', name: 'qy', op: 'mul', args: { A: ref('sy'), B: ref('sy') } },
	{ id: 'qq', name: 'qq', op: 'add', args: { A: ref('qx'), B: ref('qy') } },
	{ id: 'q', name: 'q', op: 'sqrt', args: { A: ref('qq') } },
	{ id: 'd0', name: 'd0', op: 'sub', args: { A: ref('q'), B: num(0.55) } }
];

// Bright inside the surface, fading past it, sharpened with pow - the
// stand-in for the raymarcher's iteration-count glow.
const flameGlow = (dId) => [
	{ id: 'gsm', name: 'gsm', op: 'smoothstep', args: { A: num(-0.1), B: num(0.3), T: ref(dId) } },
	{ id: 'glow', name: 'glow', op: 'sub', args: { A: num(1), B: ref('gsm') } },
	{ id: 'pw', name: 'hot', op: 'pow', args: { A: ref('glow'), B: num(3) } }
];

// First noise octave, sampled at 3*p and sliding upward with time.
const flameNoise1 = [
	{ id: 'nx', name: 'nx', op: 'mul', args: { A: ref('px0'), B: num(3) } },
	{ id: 'ny', name: 'ny', op: 'mul', args: { A: ref('py0'), B: num(3) } },
	{ id: 'nt', name: 'nt', op: 'mul', args: { A: inp('time'), B: num(3) } },
	{ id: 'nys', name: 'rising', op: 'sub', args: { A: ref('ny'), B: ref('nt') } },
	{ id: 'n1', name: 'n1', op: 'noisexy', args: { A: ref('nx'), B: ref('nys') } }
];

// Distortion grows with height (the original's *0.25*p.y) so the tip
// flickers while the base stays steady.
const flameDistort = (ncId) => [
	{ id: 'up', name: 'up', op: 'add', args: { A: ref('py0'), B: num(1) } },
	{ id: 'ftr', name: 'ftr', op: 'mul', args: { A: ref('up'), B: num(0.35) } },
	{ id: 'nd', name: 'wobble', op: 'mul', args: { A: ref(ncId), B: ref('ftr') } },
	{ id: 'd', name: 'd', op: 'add', args: { A: ref('d0'), B: ref('nd') } }
];

// The camera ray for the faithful raymarched tier:
// dir = normalize(vec3(v.x*1.6, -v.y, -1.5)), org = (0,-2,4).
const flameRay = [
	{ id: 't2', name: 't2', op: 'mul', args: { A: inp('time'), B: num(2) } },
	{ id: 'dx0', name: 'dx0', op: 'mul', args: { A: ref('px0'), B: num(1.6) } },
	{ id: 'ndy', name: 'dy0', op: 'mul', args: { A: ref('py0'), B: num(-1) } },
	{ id: 'dxx', name: 'dxx', op: 'mul', args: { A: ref('dx0'), B: ref('dx0') } },
	{ id: 'dyy', name: 'dyy', op: 'mul', args: { A: ref('ndy'), B: ref('ndy') } },
	{ id: 'ds1', name: 'ds1', op: 'add', args: { A: ref('dxx'), B: ref('dyy') } },
	{ id: 'ds2', name: 'ds2', op: 'add', args: { A: ref('ds1'), B: num(2.25) } },
	{ id: 'dl', name: 'dl', op: 'sqrt', args: { A: ref('ds2') } },
	{ id: 'dx', name: 'dir x', op: 'div', args: { A: ref('dx0'), B: ref('dl') } },
	{ id: 'dy', name: 'dir y', op: 'div', args: { A: ref('ndy'), B: ref('dl') } },
	{ id: 'dz', name: 'dir z', op: 'div', args: { A: num(-1.5), B: ref('dl') } }
];

// One lap of the original raymarch. q accumulates the marched offset so
// p = org + q starts at the camera with everything zeroed; qx/qy/qz are
// read before they're assigned, which gives last lap's position.
const flameMarchBody = [
	{ id: 'pyv', name: 'p y', op: 'sub', args: { A: ref('qy'), B: num(2) } },
	{ id: 'pzv', name: 'p z', op: 'add', args: { A: ref('qz'), B: num(4) } },
	{ id: 'fy', name: 'fy', op: 'mul', args: { A: ref('pyv'), B: num(0.5) } },
	{ id: 'cy', name: 'cy', op: 'add', args: { A: ref('fy'), B: num(1) } },
	{ id: 'sxx', name: 'sxx', op: 'mul', args: { A: ref('qx'), B: ref('qx') } },
	{ id: 'syy', name: 'syy', op: 'mul', args: { A: ref('cy'), B: ref('cy') } },
	{ id: 'szz', name: 'szz', op: 'mul', args: { A: ref('pzv'), B: ref('pzv') } },
	{ id: 'ss1', name: 'ss1', op: 'add', args: { A: ref('sxx'), B: ref('syy') } },
	{ id: 'ss2', name: 'ss2', op: 'add', args: { A: ref('ss1'), B: ref('szz') } },
	{ id: 'sl', name: 'sl', op: 'sqrt', args: { A: ref('ss2') } },
	{ id: 'sd', name: 'sphere', op: 'sub', args: { A: ref('sl'), B: num(1) } },
	{ id: 'nya', name: 'nya', op: 'add', args: { A: ref('pyv'), B: ref('t2') } },
	{ id: 'na', name: 'na', op: 'noise3', args: { A: ref('qx'), B: ref('nya'), C: ref('pzv') } },
	{ id: 'bx', name: 'bx', op: 'mul', args: { A: ref('qx'), B: num(3) } },
	{ id: 'by', name: 'by', op: 'mul', args: { A: ref('pyv'), B: num(3) } },
	{ id: 'bz', name: 'bz', op: 'mul', args: { A: ref('pzv'), B: num(3) } },
	{ id: 'nb', name: 'nb', op: 'noise3', args: { A: ref('bx'), B: ref('by'), C: ref('bz') } },
	{ id: 'nbh', name: 'nbh', op: 'mul', args: { A: ref('nb'), B: num(0.5) } },
	{ id: 'nsum', name: 'nsum', op: 'add', args: { A: ref('na'), B: ref('nbh') } },
	{ id: 'nsc', name: 'nsc', op: 'mul', args: { A: ref('nsum'), B: num(0.25) } },
	{ id: 'nyf', name: 'nyf', op: 'mul', args: { A: ref('nsc'), B: ref('pyv') } },
	{ id: 'fl', name: 'flame', op: 'add', args: { A: ref('sd'), B: ref('nyf') } },
	{ id: 'pyy', name: 'pyy', op: 'mul', args: { A: ref('pyv'), B: ref('pyv') } },
	{ id: 'pl1', name: 'pl1', op: 'add', args: { A: ref('sxx'), B: ref('pyy') } },
	{ id: 'pl2', name: 'pl2', op: 'add', args: { A: ref('pl1'), B: ref('szz') } },
	{ id: 'pl', name: 'pl', op: 'sqrt', args: { A: ref('pl2') } },
	{ id: 'far', name: 'far', op: 'sub', args: { A: num(100), B: ref('pl') } },
	{ id: 'fla', name: '|flame|', op: 'abs', args: { A: ref('fl') } },
	{ id: 'sc', name: 'scene', op: 'min', args: { A: ref('far'), B: ref('fla') } },
	{ id: 'dm', name: 'd', op: 'add', args: { A: ref('sc'), B: num(0.02) } },
	{ id: 'mx', name: 'mx', op: 'mul', args: { A: ref('dm'), B: ref('dx') } },
	{ id: 'my', name: 'my', op: 'mul', args: { A: ref('dm'), B: ref('dy') } },
	{ id: 'mz', name: 'mz', op: 'mul', args: { A: ref('dm'), B: ref('dz') } },
	{ id: 'qx', name: 'q x', op: 'add', args: { A: ref('qx'), B: ref('mx') } },
	{ id: 'qy', name: 'q y', op: 'add', args: { A: ref('qy'), B: ref('my') } },
	{ id: 'qz', name: 'q z', op: 'add', args: { A: ref('qz'), B: ref('mz') } },
	{ id: 'gni', name: 'gni', op: 'mul', args: { A: ref('fl'), B: num(-1000) } },
	{ id: 'gcl', name: 'inside', op: 'clamp', args: { A: ref('gni'), LO: num(0), HI: num(1) } },
	{ id: 'gld', name: 'glowed', op: 'max', args: { A: ref('gld'), B: ref('gcl') } },
	{ id: 'ga1', name: 'ga1', op: 'mul', args: { A: ref('sc'), B: num(100000) } },
	{ id: 'gate', name: 'gate', op: 'clamp', args: { A: ref('ga1'), LO: num(0), HI: num(1) } },
	{ id: 'gg', name: 'gg', op: 'mul', args: { A: ref('gld'), B: ref('gate') } },
	{ id: 'lo', name: 'lap/64', op: 'div', args: { A: inp('lap'), B: num(64) } },
	{ id: 'glow', name: 'glow', op: 'mix', args: { A: ref('glow'), B: ref('lo'), T: ref('gg') } }
];

// ---- Heart building blocks: a faithful translation of Inigo Quilez's
// beating heart, now that the language has the real math ops it uses.

// Center the canvas: p = 2*(uv - 0.5), so px/py run -1..1 like the original.
const heartCoords = [
	{ id: 'ox', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
	{ id: 'px0', name: 'px0', op: 'mul', args: { A: ref('ox'), B: num(2) } },
	{ id: 'oy', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
	{ id: 'py0', name: 'py0', op: 'mul', args: { A: ref('oy'), B: num(2) } }
];

// The animate block:
//   tt = mod(t,1.5)/1.5
//   ss = pow(tt,0.2)*0.5 + 0.5
//   ss = 1 + ss*0.5*sin(tt*tau*3 + py*0.5)*exp(-tt*4)
//   p *= vec2(0.5,1.5) + ss*vec2(0.5,-0.5)
const heartBeatSteps = [
	{ id: 'tm', name: 'tm', op: 'mod', args: { A: inp('time'), B: num(1.5) } },
	{ id: 'tt', name: 'tt', op: 'div', args: { A: ref('tm'), B: num(1.5) } },
	{ id: 'sp', name: 'sp', op: 'pow', args: { A: ref('tt'), B: num(0.2) } },
	{ id: 'sp2', name: 'sp2', op: 'mul', args: { A: ref('sp'), B: num(0.5) } },
	{ id: 'sp3', name: 'sp3', op: 'add', args: { A: ref('sp2'), B: num(0.5) } },
	{ id: 'wb1', name: 'wb1', op: 'mul', args: { A: ref('tt'), B: num(18.8496) } },
	{ id: 'wb2', name: 'wb2', op: 'mul', args: { A: ref('py0'), B: num(0.5) } },
	{ id: 'wb3', name: 'wb3', op: 'add', args: { A: ref('wb1'), B: ref('wb2') } },
	{ id: 'wob', name: 'wobble', op: 'sin', args: { A: ref('wb3') } },
	{ id: 'dc1', name: 'dc1', op: 'mul', args: { A: ref('tt'), B: num(-4) } },
	{ id: 'dcy', name: 'decay', op: 'exp', args: { A: ref('dc1') } },
	{ id: 'ss1', name: 'ss1', op: 'mul', args: { A: ref('sp3'), B: num(0.5) } },
	{ id: 'ss2', name: 'ss2', op: 'mul', args: { A: ref('ss1'), B: ref('wob') } },
	{ id: 'ss3', name: 'ss3', op: 'mul', args: { A: ref('ss2'), B: ref('dcy') } },
	{ id: 'ss', name: 'ss', op: 'add', args: { A: num(1), B: ref('ss3') } },
	{ id: 'kx1', name: 'kx1', op: 'mul', args: { A: ref('ss'), B: num(0.5) } },
	{ id: 'kx', name: 'kx', op: 'add', args: { A: ref('kx1'), B: num(0.5) } },
	{ id: 'px', name: 'px', op: 'mul', args: { A: ref('px0'), B: ref('kx') } },
	{ id: 'ky', name: 'ky', op: 'sub', args: { A: num(1.5), B: ref('kx1') } },
	{ id: 'py', name: 'py', op: 'mul', args: { A: ref('py0'), B: ref('ky') } }
];

// The shape block, exactly IQ's polar heart:
//   p.y -= 0.25;  a = atan(px,py)/pi;  r = length(p);  h = abs(a)
//   d = (13h - 22h^2 + 10h^3) / (6 - 5h)
//   m = smoothstep(-0.01, 0.01, d - r)
const heartShapeSteps = (pxId, pyId) => [
	{ id: 'pys', name: 'pys', op: 'sub', args: { A: ref(pyId), B: num(0.25) } },
	{ id: 'aa', name: 'aa', op: 'atan', args: { A: ref(pxId), B: ref('pys') } },
	{ id: 'a', name: 'a', op: 'div', args: { A: ref('aa'), B: num(3.141593) } },
	{ id: 'h', name: 'h', op: 'abs', args: { A: ref('a') } },
	{ id: 'xx', name: 'xx', op: 'mul', args: { A: ref(pxId), B: ref(pxId) } },
	{ id: 'yy', name: 'yy', op: 'mul', args: { A: ref('pys'), B: ref('pys') } },
	{ id: 'rr', name: 'rr', op: 'add', args: { A: ref('xx'), B: ref('yy') } },
	{ id: 'r', name: 'r', op: 'sqrt', args: { A: ref('rr') } },
	{ id: 'n1', name: '13h', op: 'mul', args: { A: ref('h'), B: num(13) } },
	{ id: 'hh', name: 'hh', op: 'mul', args: { A: ref('h'), B: ref('h') } },
	{ id: 'n2', name: '22hh', op: 'mul', args: { A: ref('hh'), B: num(22) } },
	{ id: 'hhh', name: 'hhh', op: 'mul', args: { A: ref('hh'), B: ref('h') } },
	{ id: 'n3', name: '10hhh', op: 'mul', args: { A: ref('hhh'), B: num(10) } },
	{ id: 'n4', name: 'n4', op: 'sub', args: { A: ref('n1'), B: ref('n2') } },
	{ id: 'top', name: 'top', op: 'add', args: { A: ref('n4'), B: ref('n3') } },
	{ id: 'dn', name: '5h', op: 'mul', args: { A: ref('h'), B: num(5) } },
	{ id: 'bot', name: 'bot', op: 'sub', args: { A: num(6), B: ref('dn') } },
	{ id: 'd', name: 'd', op: 'div', args: { A: ref('top'), B: ref('bot') } },
	{ id: 'dr', name: 'd-r', op: 'sub', args: { A: ref('d'), B: ref('r') } },
	{
		id: 'm',
		name: 'm',
		op: 'smoothstep',
		args: { A: num(-0.01), B: num(0.01), T: ref('dr') }
	}
];

// The full IQ coloring: graded background with a vignette, and a heart
// shaded by side light, distance, and a soft rim toward the edge.
const heartColorSteps = [
	{ id: 'bb1', name: 'bb1', op: 'mul', args: { A: ref('py0'), B: num(0.07) } },
	{ id: 'bb2', name: 'bb2', op: 'sub', args: { A: num(0.7), B: ref('bb1') } },
	{ id: 'bb', name: 'bg base', op: 'rgb', args: { R: num(1), G: num(0.8), B: ref('bb2') } },
	{ id: 'qx', name: 'qx', op: 'mul', args: { A: ref('px0'), B: ref('px0') } },
	{ id: 'qy', name: 'qy', op: 'mul', args: { A: ref('py0'), B: ref('py0') } },
	{ id: 'qq', name: 'qq', op: 'add', args: { A: ref('qx'), B: ref('qy') } },
	{ id: 'r0', name: 'r0', op: 'sqrt', args: { A: ref('qq') } },
	{ id: 'v1', name: 'v1', op: 'mul', args: { A: ref('r0'), B: num(0.25) } },
	{ id: 'v2', name: 'v2', op: 'sub', args: { A: num(1), B: ref('v1') } },
	{ id: 'bcol', name: 'bcol', op: 'mul', args: { A: ref('bb'), B: ref('v2') } },
	{ id: 's1', name: 's1', op: 'mul', args: { A: ref('px'), B: num(0.75) } },
	{ id: 's2', name: 's2', op: 'add', args: { A: ref('s1'), B: num(0.75) } },
	{ id: 's3', name: 's3', op: 'mul', args: { A: ref('r'), B: num(0.4) } },
	{ id: 's4', name: 's4', op: 'sub', args: { A: num(1), B: ref('s3') } },
	{ id: 's5', name: 's5', op: 'mul', args: { A: ref('s2'), B: ref('s4') } },
	{ id: 's6', name: 's6', op: 'mul', args: { A: ref('s5'), B: num(0.7) } },
	{ id: 's7', name: 's7', op: 'add', args: { A: ref('s6'), B: num(0.3) } },
	{ id: 'g1', name: 'g1', op: 'div', args: { A: ref('r'), B: ref('d') } },
	{ id: 'g2', name: 'g2', op: 'clamp', args: { A: ref('g1'), LO: num(0), HI: num(1) } },
	{ id: 'g3', name: 'g3', op: 'sub', args: { A: num(1), B: ref('g2') } },
	{ id: 'g4', name: 'g4', op: 'pow', args: { A: ref('g3'), B: num(0.1) } },
	{ id: 'g5', name: 'g5', op: 'mul', args: { A: ref('g4'), B: num(0.5) } },
	{ id: 'g6', name: 'g6', op: 'add', args: { A: ref('g5'), B: num(0.5) } },
	{ id: 's8', name: 'shade', op: 'mul', args: { A: ref('s7'), B: ref('g6') } },
	{ id: 'hg', name: 'hg', op: 'mul', args: { A: ref('r'), B: num(0.4) } },
	{ id: 'hb', name: 'heart base', op: 'rgb', args: { R: num(1), G: ref('hg'), B: num(0.3) } },
	{ id: 'hcol', name: 'hcol', op: 'mul', args: { A: ref('hb'), B: ref('s8') } }
];

// ---- Neon building blocks: a faithful translation of kishimisu's
// "Introduction to Shader Art Coding", loop unrolled one layer per block.

// uv = 2*(p-0.5), plus everything the loop reuses: r0 = length(uv0),
// the exp(-r0) falloff, and the palette's time drift.
const neonShared = [
	{ id: 'ox', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
	{ id: 'ux', name: 'uv x', op: 'mul', args: { A: ref('ox'), B: num(2) } },
	{ id: 'oy', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
	{ id: 'uy', name: 'uv y', op: 'mul', args: { A: ref('oy'), B: num(2) } },
	{ id: 'gx', name: 'gx', op: 'mul', args: { A: ref('ux'), B: ref('ux') } },
	{ id: 'gy', name: 'gy', op: 'mul', args: { A: ref('uy'), B: ref('uy') } },
	{ id: 'gg', name: 'gg', op: 'add', args: { A: ref('gx'), B: ref('gy') } },
	{ id: 'r0', name: 'r0', op: 'sqrt', args: { A: ref('gg') } },
	{ id: 'ne', name: '-r0', op: 'mul', args: { A: ref('r0'), B: num(-1) } },
	{ id: 'e0', name: 'falloff', op: 'exp', args: { A: ref('ne') } },
	{ id: 't4', name: 't4', op: 'mul', args: { A: inp('time'), B: num(0.4) } },
	{ id: 'base', name: 'base', op: 'add', args: { A: ref('r0'), B: ref('t4') } }
];

// One loop turn: uv = fract(uv*1.5)-0.5; d = length(uv)*exp(-r0);
// col = palette(r0 + i*0.4 + t*0.4); d = pow(0.01/abs(sin(8d+t)/8), 1.2);
// accumulate col*d. The palette is 0.5 + 0.5*cos(tau*(t + offset)) per
// channel with kishimisu's offsets 0.263 / 0.416 / 0.557.
const neonLayer = (p, xIn, yIn, i, accPrev) => {
	const steps = [
		{ id: p + 'ax', name: p + ' zoom x', op: 'mul', args: { A: ref(xIn), B: num(1.5) } },
		{ id: p + 'fx', name: p + ' fract x', op: 'repeat', args: { N: ref(p + 'ax') } },
		{ id: p + 'cx', name: p + ' x', op: 'sub', args: { A: ref(p + 'fx'), B: num(0.5) } },
		{ id: p + 'ay', name: p + ' zoom y', op: 'mul', args: { A: ref(yIn), B: num(1.5) } },
		{ id: p + 'fy', name: p + ' fract y', op: 'repeat', args: { N: ref(p + 'ay') } },
		{ id: p + 'cy', name: p + ' y', op: 'sub', args: { A: ref(p + 'fy'), B: num(0.5) } },
		{ id: p + 'xx', name: p + ' xx', op: 'mul', args: { A: ref(p + 'cx'), B: ref(p + 'cx') } },
		{ id: p + 'yy', name: p + ' yy', op: 'mul', args: { A: ref(p + 'cy'), B: ref(p + 'cy') } },
		{ id: p + 'll', name: p + ' ll', op: 'add', args: { A: ref(p + 'xx'), B: ref(p + 'yy') } },
		{ id: p + 'len', name: p + ' len', op: 'sqrt', args: { A: ref(p + 'll') } },
		{ id: p + 'd0', name: p + ' d', op: 'mul', args: { A: ref(p + 'len'), B: ref('e0') } },
		{ id: p + 'hue', name: p + ' hue', op: 'add', args: { A: ref('base'), B: num(i * 0.4) } }
	];
	for (const [c, off] of [
		['r', 0.263],
		['g', 0.416],
		['b', 0.557]
	]) {
		steps.push(
			{ id: p + c + '1', name: `${p} ${c}1`, op: 'add', args: { A: ref(p + 'hue'), B: num(off) } },
			{
				id: p + c + '2',
				name: `${p} ${c}2`,
				op: 'mul',
				args: { A: ref(p + c + '1'), B: num(6.28318) }
			},
			{ id: p + c + '3', name: `${p} ${c}3`, op: 'cos', args: { A: ref(p + c + '2') } },
			{ id: p + c + '4', name: `${p} ${c}4`, op: 'mul', args: { A: ref(p + c + '3'), B: num(0.5) } },
			{ id: p + c + '5', name: `${p} ${c}`, op: 'add', args: { A: ref(p + c + '4'), B: num(0.5) } }
		);
	}
	steps.push(
		{
			id: p + 'pal',
			name: p + ' palette',
			op: 'rgb',
			args: { R: ref(p + 'r5'), G: ref(p + 'g5'), B: ref(p + 'b5') }
		},
		{ id: p + 's1', name: p + ' s1', op: 'mul', args: { A: ref(p + 'd0'), B: num(8) } },
		{ id: p + 's2', name: p + ' s2', op: 'add', args: { A: ref(p + 's1'), B: inp('time') } },
		{ id: p + 's3', name: p + ' s3', op: 'sin', args: { A: ref(p + 's2') } },
		{ id: p + 's4', name: p + ' s4', op: 'div', args: { A: ref(p + 's3'), B: num(8) } },
		{ id: p + 's5', name: p + ' |d|', op: 'abs', args: { A: ref(p + 's4') } },
		{ id: p + 'q1', name: p + ' q1', op: 'div', args: { A: num(0.01), B: ref(p + 's5') } },
		{ id: p + 'q2', name: p + ' glow', op: 'pow', args: { A: ref(p + 'q1'), B: num(1.2) } },
		{ id: p + 'lit', name: p + ' lit', op: 'mul', args: { A: ref(p + 'pal'), B: ref(p + 'q2') } }
	);
	if (accPrev) {
		steps.push({
			id: p + 'acc',
			name: 'glow so far',
			op: 'add',
			args: { A: ref(accPrev), B: ref(p + 'lit') }
		});
	}
	return steps;
};


// ---- Fractal (guil's colorful fractal ball) ----------------------------
// The real thing raymarches a sphere; at every step the density comes
// from folding the point 10 times with p = 0.7*abs(p)/dot(p,p) - 0.7,
// squaring p.yz as a complex number, and summing exp(-19*|dot(p,c)|).
// The 10 folds are unrolled inside a 64-lap repeat block (loops can't
// nest). The cubemap background/reflection and mouse orbit are skipped:
// no textures or mouse here, so the ball spins on its own over black.

const fst = (id, op, args, name = id) => ({ id, name, op, args });

// One unrolled map(): input point (cx,cy,cz) is both the start of the
// folding AND the c that every fold is dotted against.
function fractalMapSteps(cx, cy, cz) {
	const steps = [];
	let px = cx;
	let py = cy;
	let pz = cz;
	let res = null;
	for (let k = 1; k <= 10; k++) {
		const P = (n) => `m${k}${n}`;
		steps.push(
			fst(P('ax'), 'abs', { A: ref(px) }),
			fst(P('ay'), 'abs', { A: ref(py) }),
			fst(P('az'), 'abs', { A: ref(pz) }),
			fst(P('xx'), 'mul', { A: ref(px), B: ref(px) }),
			fst(P('yy'), 'mul', { A: ref(py), B: ref(py) }),
			fst(P('zz'), 'mul', { A: ref(pz), B: ref(pz) }),
			fst(P('d1'), 'add', { A: ref(P('xx')), B: ref(P('yy')) }),
			fst(P('dp'), 'add', { A: ref(P('d1')), B: ref(P('zz')) }),
			fst(P('s'), 'div', { A: num(0.7), B: ref(P('dp')) }),
			fst(P('fx'), 'mul', { A: ref(P('ax')), B: ref(P('s')) }),
			fst(P('gx'), 'sub', { A: ref(P('fx')), B: num(0.7) }),
			fst(P('fy'), 'mul', { A: ref(P('ay')), B: ref(P('s')) }),
			fst(P('gy'), 'sub', { A: ref(P('fy')), B: num(0.7) }),
			fst(P('fz'), 'mul', { A: ref(P('az')), B: ref(P('s')) }),
			fst(P('gz'), 'sub', { A: ref(P('fz')), B: num(0.7) }),
			// csqr on the new (y,z)
			fst(P('cy'), 'mul', { A: ref(P('gy')), B: ref(P('gy')) }),
			fst(P('cz'), 'mul', { A: ref(P('gz')), B: ref(P('gz')) }),
			fst(P('ny'), 'sub', { A: ref(P('cy')), B: ref(P('cz')) }),
			fst(P('yz'), 'mul', { A: ref(P('gy')), B: ref(P('gz')) }),
			fst(P('nz'), 'mul', { A: ref(P('yz')), B: num(2) }),
			// p = p.zxy of (gx, ny, nz) -> (nz, gx, ny); dot with c
			fst(P('q1'), 'mul', { A: ref(P('nz')), B: ref(cx) }),
			fst(P('q2'), 'mul', { A: ref(P('gx')), B: ref(cy) }),
			fst(P('q3'), 'mul', { A: ref(P('ny')), B: ref(cz) }),
			fst(P('q4'), 'add', { A: ref(P('q1')), B: ref(P('q2')) }),
			fst(P('dc'), 'add', { A: ref(P('q4')), B: ref(P('q3')) }),
			fst(P('ab'), 'abs', { A: ref(P('dc')) }),
			fst(P('g'), 'mul', { A: ref(P('ab')), B: num(-19) }),
			fst(P('ex'), 'exp', { A: ref(P('g')) }),
			res
				? fst(P('res'), 'add', { A: ref(res), B: ref(P('ex')) })
				: fst(P('res'), 'add', { A: ref(P('ex')), B: num(0) })
		);
		px = P('nz');
		py = P('gx');
		pz = P('ny');
		res = P('res');
	}
	return { steps, res };
}

// ---- Clouds (drift's "2D Clouds") --------------------------------------
// The original layers several fbm loops of simplex noise, each rotating
// uv by m = mat2(1.6, 1.2, -1.2, 1.6) and shrinking the weight every
// lap. This builds one such loop as a repeat block: on lap 0 the mix
// seeds uv from seedX/seedY, after that it carries between laps, and
// weight = w0 * decay^lap replaces the *= inside the loop.
function cloudLoop(prefix, { laps, w0, decay, ridged, seedX, seedY, timeRef }) {
	const P = (n) => `${prefix}${n}`;
	const term = ridged ? P('ta') : P('t');
	return loop(prefix, laps, [
		fst(P('l1'), 'mul', { A: inp('lap'), B: num(1000) }),
		fst(P('cl'), 'clamp', { A: ref(P('l1')), LO: num(0), HI: num(1) }),
		fst(P('isf'), 'sub', { A: num(1), B: ref(P('cl')) }, 'first lap?'),
		fst(P('xu'), 'mix', { A: ref(P('ux')), B: ref(seedX), T: ref(P('isf')) }),
		fst(P('yu'), 'mix', { A: ref(P('uy')), B: ref(seedY), T: ref(P('isf')) }),
		fst(P('n'), 'snoise', { A: ref(P('xu')), B: ref(P('yu')) }),
		fst(P('wp'), 'pow', { A: num(decay), B: inp('lap') }),
		fst(P('w'), 'mul', { A: ref(P('wp')), B: num(w0) }, 'weight'),
		fst(P('t'), 'mul', { A: ref(P('n')), B: ref(P('w')) }),
		...(ridged ? [fst(P('ta'), 'abs', { A: ref(P('t')) })] : []),
		fst(P('acc'), 'add', { A: ref(P('acc')), B: ref(term) }, 'total'),
		fst(P('r1'), 'mul', { A: ref(P('xu')), B: num(1.6) }),
		fst(P('r2'), 'mul', { A: ref(P('yu')), B: num(1.2) }),
		fst(P('r3'), 'sub', { A: ref(P('r1')), B: ref(P('r2')) }),
		timeRef
			? fst(P('ux'), 'add', { A: ref(P('r3')), B: ref(timeRef) })
			: fst(P('ux'), 'just', { A: ref(P('r3')) }),
		fst(P('r4'), 'mul', { A: ref(P('xu')), B: num(1.2) }),
		fst(P('r5'), 'mul', { A: ref(P('yu')), B: num(1.6) }),
		fst(P('r6'), 'add', { A: ref(P('r4')), B: ref(P('r5')) }),
		timeRef
			? fst(P('uy'), 'add', { A: ref(P('r6')), B: ref(timeRef) })
			: fst(P('uy'), 'just', { A: ref(P('r6')) })
	]);
}

// Camera setup. rot(-0.5) on ro.yz is constant and precomputed:
// ro = (4, 1.5926281, 5.4280324) before the time spin, |ro| = 6.9282032,
// so ww = -ro/|ro| has constant y = -0.2298761 and dot(ro,ro)-4 = 44.
const fractalCamera = [
	fst('ox', 'sub', { A: inp('x'), B: num(0.5) }),
	fst('vx', 'mul', { A: ref('ox'), B: num(2) }),
	fst('oy', 'sub', { A: inp('y'), B: num(0.5) }),
	fst('vy', 'mul', { A: ref('oy'), B: num(2) }),
	fst('a1', 'mul', { A: inp('time'), B: num(0.1) }, 'spin'),
	fst('a2', 'sub', { A: ref('a1'), B: num(0.5) }),
	fst('ca', 'cos', { A: ref('a2') }),
	fst('sa', 'sin', { A: ref('a2') }),
	fst('rm1', 'mul', { A: ref('ca'), B: num(4) }),
	fst('rm2', 'mul', { A: ref('sa'), B: num(5.4280324) }),
	fst('rox', 'add', { A: ref('rm1'), B: ref('rm2') }, 'eye x'),
	fst('rm3', 'mul', { A: ref('sa'), B: num(-4) }),
	fst('rm4', 'mul', { A: ref('ca'), B: num(5.4280324) }),
	fst('roz', 'add', { A: ref('rm3'), B: ref('rm4') }, 'eye z'),
	fst('wwx', 'mul', { A: ref('rox'), B: num(-0.1443376) }),
	fst('wwz', 'mul', { A: ref('roz'), B: num(-0.1443376) }),
	fst('wx2', 'mul', { A: ref('wwx'), B: ref('wwx') }),
	fst('wz2', 'mul', { A: ref('wwz'), B: ref('wwz') }),
	fst('ws', 'add', { A: ref('wx2'), B: ref('wz2') }),
	fst('wn', 'sqrt', { A: ref('ws') }),
	fst('nwz', 'mul', { A: ref('wwz'), B: num(-1) }),
	fst('uux', 'div', { A: ref('nwz'), B: ref('wn') }),
	fst('uuz', 'div', { A: ref('wwx'), B: ref('wn') }),
	fst('vvx', 'mul', { A: ref('uuz'), B: num(0.2298761) }),
	fst('vm2', 'mul', { A: ref('uuz'), B: ref('wwx') }),
	fst('vm3', 'mul', { A: ref('uux'), B: ref('wwz') }),
	fst('vvy', 'sub', { A: ref('vm2'), B: ref('vm3') }),
	fst('vvz', 'mul', { A: ref('uux'), B: num(-0.2298761) }),
	fst('r1', 'mul', { A: ref('vx'), B: ref('uux') }),
	fst('r2', 'mul', { A: ref('vy'), B: ref('vvx') }),
	fst('r3', 'add', { A: ref('r1'), B: ref('r2') }),
	fst('r4', 'mul', { A: ref('wwx'), B: num(4) }),
	fst('rdx0', 'add', { A: ref('r3'), B: ref('r4') }),
	fst('r5', 'mul', { A: ref('vy'), B: ref('vvy') }),
	fst('rdy0', 'add', { A: ref('r5'), B: num(-0.9195044) }),
	fst('r6', 'mul', { A: ref('vx'), B: ref('uuz') }),
	fst('r7', 'mul', { A: ref('vy'), B: ref('vvz') }),
	fst('r8', 'add', { A: ref('r6'), B: ref('r7') }),
	fst('r9', 'mul', { A: ref('wwz'), B: num(4) }),
	fst('rdz0', 'add', { A: ref('r8'), B: ref('r9') }),
	fst('n1', 'mul', { A: ref('rdx0'), B: ref('rdx0') }),
	fst('n2', 'mul', { A: ref('rdy0'), B: ref('rdy0') }),
	fst('n3', 'mul', { A: ref('rdz0'), B: ref('rdz0') }),
	fst('n4', 'add', { A: ref('n1'), B: ref('n2') }),
	fst('n5', 'add', { A: ref('n4'), B: ref('n3') }),
	fst('rl', 'sqrt', { A: ref('n5') }),
	fst('rdx', 'div', { A: ref('rdx0'), B: ref('rl') }, 'ray x'),
	fst('rdy', 'div', { A: ref('rdy0'), B: ref('rl') }, 'ray y'),
	fst('rdz', 'div', { A: ref('rdz0'), B: ref('rl') }, 'ray z'),
	// iSphere(ro, rd, r=2): sqrt clips negatives to 0, so missing rays
	// get tmin = tmax and the gate below shuts the whole march off.
	fst('b1', 'mul', { A: ref('rox'), B: ref('rdx') }),
	fst('b2', 'mul', { A: ref('rdy'), B: num(1.5926281) }),
	fst('b3', 'mul', { A: ref('roz'), B: ref('rdz') }),
	fst('b4', 'add', { A: ref('b1'), B: ref('b2') }),
	fst('bb', 'add', { A: ref('b4'), B: ref('b3') }),
	fst('h1', 'mul', { A: ref('bb'), B: ref('bb') }),
	fst('hh', 'sub', { A: ref('h1'), B: num(44) }),
	fst('hs', 'sqrt', { A: ref('hh') }),
	fst('nb', 'mul', { A: ref('bb'), B: num(-1) }),
	fst('tmin', 'sub', { A: ref('nb'), B: ref('hs') }, 'enter'),
	fst('tmax', 'add', { A: ref('nb'), B: ref('hs') }, 'leave')
];

const fractalMap = fractalMapSteps('sx', 'sy', 'sz');

// One lap of the raymarch: advance t by 0.02*exp(-2*density), sample
// the fold, and fade 99% old color + 8% of (c^2, c, c^3), but only
// while still inside the sphere (the gate stands in for the break).
const fractalMarchBody = [
	fst('e1', 'mul', { A: ref('cden'), B: num(-2) }),
	fst('df', 'exp', { A: ref('e1') }),
	fst('ds', 'mul', { A: ref('df'), B: num(0.02) }),
	fst('tt', 'add', { A: ref('tt'), B: ref('ds') }, 'march'),
	fst('tot', 'add', { A: ref('tmin'), B: ref('tt') }),
	fst('over', 'sub', { A: ref('tmax'), B: ref('tot') }),
	fst('ov1', 'mul', { A: ref('over'), B: num(10000) }),
	fst('gate', 'clamp', { A: ref('ov1'), LO: num(0), HI: num(1) }, 'inside?'),
	fst('msx', 'mul', { A: ref('tot'), B: ref('rdx') }),
	fst('sx', 'add', { A: ref('rox'), B: ref('msx') }, 'p x'),
	fst('msy', 'mul', { A: ref('tot'), B: ref('rdy') }),
	fst('sy', 'add', { A: ref('msy'), B: num(1.5926281) }, 'p y'),
	fst('msz', 'mul', { A: ref('tot'), B: ref('rdz') }),
	fst('sz', 'add', { A: ref('roz'), B: ref('msz') }, 'p z'),
	...fractalMap.steps,
	fst('cden', 'mul', { A: ref(fractalMap.res), B: num(0.5) }, 'density'),
	fst('cc', 'mul', { A: ref('cden'), B: ref('cden') }),
	fst('ccc', 'mul', { A: ref('cc'), B: ref('cden') }),
	fst('dr', 'mul', { A: ref('colr'), B: num(0.99) }),
	fst('sr', 'mul', { A: ref('cc'), B: num(0.08) }),
	fst('nr', 'add', { A: ref('dr'), B: ref('sr') }),
	fst('colr', 'mix', { A: ref('colr'), B: ref('nr'), T: ref('gate') }, 'red'),
	fst('dg', 'mul', { A: ref('colg'), B: num(0.99) }),
	fst('sg', 'mul', { A: ref('cden'), B: num(0.08) }),
	fst('ng', 'add', { A: ref('dg'), B: ref('sg') }),
	fst('colg', 'mix', { A: ref('colg'), B: ref('ng'), T: ref('gate') }, 'green'),
	fst('db', 'mul', { A: ref('colb'), B: num(0.99) }),
	fst('sb', 'mul', { A: ref('ccc'), B: num(0.08) }),
	fst('nb2', 'add', { A: ref('db'), B: ref('sb') }),
	fst('colb', 'mix', { A: ref('colb'), B: ref('nb2'), T: ref('gate') }, 'blue')
];

// col = 0.5*log(1 + col), per channel.
const fractalShade = [
	fst('lr', 'add', { A: ref('colr'), B: num(1) }),
	fst('llr', 'log', { A: ref('lr') }),
	fst('shr', 'mul', { A: ref('llr'), B: num(0.5) }),
	fst('lg', 'add', { A: ref('colg'), B: num(1) }),
	fst('llg', 'log', { A: ref('lg') }),
	fst('shg', 'mul', { A: ref('llg'), B: num(0.5) }),
	fst('lb', 'add', { A: ref('colb'), B: num(1) }),
	fst('llb', 'log', { A: ref('lb') }),
	fst('shb', 'mul', { A: ref('llb'), B: num(0.5) }),
	fst('paint', 'rgb', { R: ref('shr'), G: ref('shg'), B: ref('shb') })
];

// Every picture is a family: the same idea at three sizes (a drop,
// a splash, the cauldron!) so kids can see how a picture grows one
// step at a time.
// ---- Warp: the classic star tunnel --------------------------------------
// Shared by the two tunnel tiers. Aim a ray out from the screen middle
// and see how far it steps per grid cell.
const warpRay = [
	fst('x2', 'mul', { A: inp('x'), B: num(2) }),
	fst('rx', 'sub', { A: ref('x2'), B: num(1) }, 'ray x'),
	fst('y2', 'mul', { A: inp('y'), B: num(2) }),
	fst('ry', 'sub', { A: ref('y2'), B: num(1) }, 'ray y'),
	fst('arx', 'abs', { A: ref('rx') }),
	fst('ary', 'abs', { A: ref('ry') }),
	fst('mm', 'max', { A: ref('arx'), B: ref('ary') }, 'edge'),
	fst('sx', 'div', { A: ref('rx'), B: ref('mm') }, 'walk x'),
	fst('sy', 'div', { A: ref('ry'), B: ref('mm') }, 'walk y'),
	fst('sz', 'div', { A: num(1), B: ref('mm') }, 'walk z'),
	fst('ix0', 'mul', { A: ref('sx'), B: num(2) }),
	fst('ix', 'add', { A: ref('ix0'), B: num(0.5) }, 'start x'),
	fst('iy0', 'mul', { A: ref('sy'), B: num(2) }),
	fst('iy', 'add', { A: ref('iy0'), B: num(0.5) }, 'start y'),
	fst('iz0', 'mul', { A: ref('sz'), B: num(2) }),
	fst('iz', 'add', { A: ref('iz0'), B: num(0.5) }, 'start z')
];

// One lap = one grid cell the ray flies through: the cell's star has a
// random depth, and how close that depth is to the ray sets the color -
// red a bit ahead, blue a bit behind, so speed smears into rainbow.
// Needs 'off' (warp), 'spd' (speed) and 'hf' (half surge) defined above.
const warpFly = [
	fst('l1', 'mul', { A: inp('lap'), B: num(1000) }),
	fst('cl', 'clamp', { A: ref('l1'), LO: num(0), HI: num(1) }),
	fst('isf', 'sub', { A: num(1), B: ref('cl') }, 'first lap?'),
	fst('pxa', 'add', { A: ref('px'), B: ref('sx') }),
	fst('px', 'mix', { A: ref('pxa'), B: ref('ix'), T: ref('isf') }, 'pos x'),
	fst('pya', 'add', { A: ref('py'), B: ref('sy') }),
	fst('py', 'mix', { A: ref('pya'), B: ref('iy'), T: ref('isf') }, 'pos y'),
	fst('pza', 'add', { A: ref('pz'), B: ref('sz') }),
	fst('pz', 'mix', { A: ref('pza'), B: ref('iz'), T: ref('isf') }, 'pos z'),
	fst('cx', 'floor', { A: ref('px') }, 'cell x'),
	fst('cy', 'floor', { A: ref('py') }, 'cell y'),
	fst('rz', 'noisexy', { A: ref('cx'), B: ref('cy') }, 'star luck'),
	fst('zo', 'sub', { A: ref('rz'), B: ref('off') }),
	fst('zf', 'floor', { A: ref('zo') }),
	fst('z', 'sub', { A: ref('zo'), B: ref('zf') }, 'depth'),
	fst('d0', 'mul', { A: ref('z'), B: num(50) }),
	fst('d', 'sub', { A: ref('d0'), B: ref('pz') }, 'gap'),
	fst('fx', 'sub', { A: ref('px'), B: ref('cx') }),
	fst('fy', 'sub', { A: ref('py'), B: ref('cy') }),
	fst('ox', 'sub', { A: ref('fx'), B: num(0.5) }),
	fst('oy', 'sub', { A: ref('fy'), B: num(0.5) }),
	fst('ox2', 'mul', { A: ref('ox'), B: ref('ox') }),
	fst('oy2', 'mul', { A: ref('oy'), B: ref('oy') }),
	fst('dd', 'add', { A: ref('ox2'), B: ref('oy2') }),
	fst('ln', 'sqrt', { A: ref('dd') }),
	fst('l8', 'mul', { A: ref('ln'), B: num(8) }),
	fst('wi', 'sub', { A: num(1), B: ref('l8') }),
	fst('wm', 'max', { A: ref('wi'), B: num(0) }),
	fst('w', 'mul', { A: ref('wm'), B: ref('wm') }, 'star glow'),
	fst('dr', 'add', { A: ref('d'), B: ref('hf') }),
	fst('adr', 'abs', { A: ref('dr') }),
	fst('nr', 'div', { A: ref('adr'), B: ref('spd') }),
	fst('r1', 'sub', { A: num(1), B: ref('nr') }),
	fst('cr', 'max', { A: ref('r1'), B: num(0) }, 'red'),
	fst('ad', 'abs', { A: ref('d') }),
	fst('ng', 'div', { A: ref('ad'), B: ref('spd') }),
	fst('g1', 'sub', { A: num(1), B: ref('ng') }),
	fst('cg', 'max', { A: ref('g1'), B: num(0) }, 'green'),
	fst('db', 'sub', { A: ref('d'), B: ref('hf') }),
	fst('adb', 'abs', { A: ref('db') }),
	fst('nb', 'div', { A: ref('adb'), B: ref('spd') }),
	fst('b1', 'sub', { A: num(1), B: ref('nb') }),
	fst('cb', 'max', { A: ref('b1'), B: num(0) }, 'blue'),
	fst('zi', 'sub', { A: num(1), B: ref('z') }),
	fst('fa0', 'mul', { A: ref('zi'), B: num(1.5) }),
	fst('fac', 'mul', { A: ref('fa0'), B: ref('w') }, 'shine'),
	fst('pr', 'mul', { A: ref('cr'), B: ref('fac') }),
	fst('pg', 'mul', { A: ref('cg'), B: ref('fac') }),
	fst('pb', 'mul', { A: ref('cb'), B: ref('fac') }),
	fst('accr', 'add', { A: ref('accr'), B: ref('pr') }, 'total red'),
	fst('accg', 'add', { A: ref('accg'), B: ref('pg') }, 'total green'),
	fst('accb', 'add', { A: ref('accb'), B: ref('pb') }, 'total blue')
];

// Gamma correction, like the original: light adds up linearly, then gets
// converted back to screen color at the end.
const warpGamma = [
	fst('gr', 'pow', { A: ref('accr'), B: num(0.4545) }, 'gamma red'),
	fst('gg', 'pow', { A: ref('accg'), B: num(0.4545) }, 'gamma green'),
	fst('gb', 'pow', { A: ref('accb'), B: num(0.4545) }, 'gamma blue'),
	fst('paint', 'rgb', { R: ref('gr'), G: ref('gg'), B: ref('gb') })
];

const legacyFamilies = [
{
		name: 'Paint',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// One solid color on every pixel — the green line alone.
				label: 'solid',
				program: {
					steps: [],
					color: col('#3b82f6')
				}
			},
			{
				// Left → right blend driven by x.
				label: 'across',
				program: {
					steps: [
						{
							id: 'a',
							name: 'paint',
							op: 'mix',
							args: { A: col('#ef4444'), B: col('#3b82f6'), T: inp('x') }
						}
					],
					color: ref('a')
				}
			}
		]
	},
{
		name: 'Fold',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// abs folds x around the middle — a V of light.
				label: 'mirror',
				program: {
					steps: [
						{ id: 'a', name: 'center', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'fold', op: 'abs', args: { A: ref('a') } },
						{ id: 'c', name: 'stretch', op: 'mul', args: { A: ref('b'), B: num(2) } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1e293b'), B: col('#a3e635'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			},
			{
				// abs(x)+abs(y) makes a diamond shade.
				label: 'diamond',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'ax', op: 'abs', args: { A: ref('a') } },
						{ id: 'd', name: 'ay', op: 'abs', args: { A: ref('b') } },
						{ id: 'e', name: 'diamond', op: 'add', args: { A: ref('c'), B: ref('d') } },
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#312e81'), B: col('#f472b6'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			}
		]
	},
{
		name: 'Stairs',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// floor chops a smooth ramp into flat bands.
				label: 'bands',
				program: {
					steps: [
						{ id: 'a', name: 'many', op: 'mul', args: { A: inp('x'), B: num(5) } },
						{ id: 'b', name: 'steps', op: 'floor', args: { A: ref('a') } },
						{ id: 'c', name: 'shade', op: 'div', args: { A: ref('b'), B: num(4) } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#fbbf24'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			},
			{
				// floor on x and y → big chunky blocks.
				label: 'blocks',
				program: {
					steps: [
						{ id: 'a', name: 'wide', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'col', op: 'floor', args: { A: ref('a') } },
						{ id: 'c', name: 'tall', op: 'mul', args: { A: inp('y'), B: num(6) } },
						{ id: 'd', name: 'row', op: 'floor', args: { A: ref('c') } },
						{ id: 'e', name: 'id', op: 'add', args: { A: ref('b'), B: ref('d') } },
						{ id: 'f', name: 'shade', op: 'div', args: { A: ref('e'), B: num(10) } },
						{
							id: 'g',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1e1b4b'), B: col('#67e8f9'), T: ref('f') }
						}
					],
					color: ref('g')
				}
			}
		]
	},
{
		// wrap numbers back into a range — frac stripes, mod tiles, then scroll.
		name: 'Tile',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// repeat (= leftover after floor) makes sawtooth stripes — no sin.
				label: 'stripes',
				program: {
					steps: [
						{ id: 'a', name: 'many', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'wrap', op: 'fn:repeat', args: { N: ref('a') } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#f97316'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			},
			{
				// mod leftover after dividing — same wrap idea, bare op.
				label: 'tiles',
				program: {
					steps: [
						{ id: 'a', name: 'many', op: 'mul', args: { A: inp('x'), B: num(5) } },
						{ id: 'b', name: 'wrap', op: 'mod', args: { A: ref('a'), B: num(1) } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#fb923c'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			},
			{
				// Same wrap, sliding with time.
				label: 'scroll',
				program: {
					steps: [
						{ id: 'a', name: 'many', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'move', op: 'sub', args: { A: ref('a'), B: inp('time') } },
						{ id: 'c', name: 'wrap', op: 'fn:repeat', args: { N: ref('b') } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#172554'), B: col('#fde047'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			}
		]
	},
{
		name: 'Cut',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// min keeps the smaller side — a soft corner wipe.
				label: 'gate',
				program: {
					steps: [
						{ id: 'a', name: 'both', op: 'min', args: { A: inp('x'), B: inp('y') } },
						{
							id: 'b',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0c4a6e'), B: col('#fcd34d'), T: ref('a') }
						}
					],
					color: ref('b')
				}
			},
			{
				// max(abs x, abs y) is a square — soft edge with smoothstep.
				label: 'box',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'ax', op: 'abs', args: { A: ref('a') } },
						{ id: 'd', name: 'ay', op: 'abs', args: { A: ref('b') } },
						{ id: 'e', name: 'box', op: 'max', args: { A: ref('c'), B: ref('d') } },
						{
							id: 'f',
							name: 'edge',
							op: 'smoothstep',
							args: { A: num(0.28), B: num(0.32), T: ref('e') }
						},
						{ id: 'g', name: 'fill', op: 'sub', args: { A: num(1), B: ref('f') } },
						{
							id: 'h',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#fb7185'), T: ref('g') }
						}
					],
					color: ref('h')
				}
			}
		]
	},
{
		name: 'Pulse',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				// Pulse with bare ops — same math as wave(time), no library call.
				label: 'glow',
				program: {
					steps: [
						{ id: 'a', name: 'turn', op: 'mul', args: { A: inp('time'), B: num(6.28318) } },
						{ id: 'b', name: 'swing', op: 'sin', args: { A: ref('a') } },
						{ id: 'c', name: 'half', op: 'mul', args: { A: ref('b'), B: num(0.5) } },
						{ id: 'd', name: 'glow', op: 'add', args: { A: ref('c'), B: num(0.5) } }
					],
					color: ref('d')
				}
			},
			{
				// Same pulse as glow, then mix it into a hot color.
				label: 'tint',
				program: {
					steps: [
						{ id: 'a', name: 'turn', op: 'mul', args: { A: inp('time'), B: num(6.28318) } },
						{ id: 'b', name: 'swing', op: 'sin', args: { A: ref('a') } },
						{ id: 'c', name: 'half', op: 'mul', args: { A: ref('b'), B: num(0.5) } },
						{ id: 'd', name: 'glow', op: 'add', args: { A: ref('c'), B: num(0.5) } },
						{
							id: 'e',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#f97316'), T: ref('d') }
						}
					],
					color: ref('e')
				}
			},
			{
				// Phase by x and y so the beat chases diagonally across the screen.
				label: 'ripple',
				program: {
					steps: [
						{ id: 'xy', name: 'place', op: 'add', args: { A: inp('x'), B: inp('y') } },
						{ id: 'ph', name: 'phase', op: 'add', args: { A: inp('time'), B: ref('xy') } },
						{ id: 'a', name: 'turn', op: 'mul', args: { A: ref('ph'), B: num(6.28318) } },
						{ id: 'b', name: 'swing', op: 'sin', args: { A: ref('a') } },
						{ id: 'c', name: 'half', op: 'mul', args: { A: ref('b'), B: num(0.5) } },
						{ id: 'g', name: 'glow', op: 'add', args: { A: ref('c'), B: num(0.5) } },
						{
							id: 'p',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#38bdf8'), T: ref('g') }
						}
					],
					color: ref('p')
				}
			}
		]
	},
{
		// cos is sin's twin — starts at the top instead of the middle.
		name: 'Twin',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'crest',
				program: {
					steps: [
						{ id: 'a', name: 'bars', op: 'mul', args: { A: inp('x'), B: num(12.566) } },
						{ id: 'b', name: 'crest', op: 'cos', args: { A: ref('a') } },
						{ id: 'c', name: 'half', op: 'mul', args: { A: ref('b'), B: num(0.5) } },
						{ id: 'd', name: 'lift', op: 'add', args: { A: ref('c'), B: num(0.5) } },
						{
							id: 'e',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1e1b4b'), B: col('#67e8f9'), T: ref('d') }
						}
					],
					color: ref('e')
				}
			},
			{
				label: 'orbit',
				program: {
					steps: [
						{ id: 'a', name: 'turn', op: 'mul', args: { A: inp('time'), B: num(2) } },
						{ id: 'b', name: 'cx', op: 'cos', args: { A: ref('a') } },
						{ id: 'c', name: 'cy', op: 'sin', args: { A: ref('a') } },
						{ id: 'd', name: 'ox', op: 'mul', args: { A: ref('b'), B: num(0.25) } },
						{ id: 'e', name: 'oy', op: 'mul', args: { A: ref('c'), B: num(0.25) } },
						{ id: 'f', name: 'px', op: 'add', args: { A: ref('d'), B: num(0.5) } },
						{ id: 'g', name: 'py', op: 'add', args: { A: ref('e'), B: num(0.5) } },
						{ id: 'h', name: 'dx', op: 'sub', args: { A: inp('x'), B: ref('f') } },
						{ id: 'i', name: 'dy', op: 'sub', args: { A: inp('y'), B: ref('g') } },
						{ id: 'j', name: 'xx', op: 'mul', args: { A: ref('h'), B: ref('h') } },
						{ id: 'k', name: 'yy', op: 'mul', args: { A: ref('i'), B: ref('i') } },
						{ id: 'l', name: 'apart', op: 'add', args: { A: ref('j'), B: ref('k') } },
						{ id: 'm', name: 'glow', op: 'div', args: { A: num(0.01), B: ref('l') } },
						{
							id: 'n',
							name: 'held',
							op: 'clamp',
							args: { A: ref('m'), LO: num(0), HI: num(1) }
						},
						{
							id: 'o',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#f472b6'), T: ref('n') }
						}
					],
					color: ref('o')
				}
			}
		]
	},
{
		// sqrt turns x²+y² into real distance — a soft disc from the center.
		name: 'Root',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'disc',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'xx', op: 'mul', args: { A: ref('a'), B: ref('a') } },
						{ id: 'd', name: 'yy', op: 'mul', args: { A: ref('b'), B: ref('b') } },
						{ id: 'e', name: 'sum', op: 'add', args: { A: ref('c'), B: ref('d') } },
						{ id: 'f', name: 'dist', op: 'sqrt', args: { A: ref('e') } },
						{ id: 'g', name: 'soft', op: 'sub', args: { A: num(0.55), B: ref('f') } },
						{ id: 'h', name: 'glow', op: 'max', args: { A: ref('g'), B: num(0) } },
						{
							id: 'i',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0b1020'), B: col('#5ef0ff'), T: ref('h') }
						}
					],
					color: ref('i')
				}
			},
			{
				label: 'rings',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'xx', op: 'mul', args: { A: ref('a'), B: ref('a') } },
						{ id: 'd', name: 'yy', op: 'mul', args: { A: ref('b'), B: ref('b') } },
						{ id: 'e', name: 'sum', op: 'add', args: { A: ref('c'), B: ref('d') } },
						{ id: 'f', name: 'dist', op: 'sqrt', args: { A: ref('e') } },
						{ id: 'g', name: 'rings', op: 'mul', args: { A: ref('f'), B: num(10) } },
						{ id: 'h', name: 'pulse', op: 'wave', args: { N: ref('g') } },
						{ id: 'i', name: 'fade', op: 'sub', args: { A: num(0.8), B: ref('f') } },
						{ id: 'j', name: 'lit', op: 'mul', args: { A: ref('h'), B: ref('i') } },
						{
							id: 'k',
							name: 'paint',
							op: 'mix',
							args: { A: col('#05030f'), B: col('#c084fc'), T: ref('j') }
						}
					],
					color: ref('k')
				}
			}
		]
	},
{
		// ^ sharpens a soft blob into a hot core.
		name: 'Sharp',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'soft',
				program: {
					steps: [
						{ id: 'a', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'b', name: 'keep', op: 'max', args: { A: ref('a'), B: num(0) } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#fbbf24'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			},
			{
				label: 'crisp',
				program: {
					steps: [
						{ id: 'a', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'b', name: 'keep', op: 'max', args: { A: ref('a'), B: num(0) } },
						{ id: 'c', name: 'hot', op: 'pow', args: { A: ref('b'), B: num(3) } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#fbbf24'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			}
		]
	},
{
		// clamp keeps a value between two ends — a hard band of light.
		name: 'Hold',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'band',
				program: {
					steps: [
						{
							id: 'a',
							name: 'held',
							op: 'clamp',
							args: { A: inp('x'), LO: num(0.3), HI: num(0.7) }
						},
						{ id: 'b', name: 'shift', op: 'sub', args: { A: ref('a'), B: num(0.3) } },
						{ id: 'c', name: 'shade', op: 'div', args: { A: ref('b'), B: num(0.4) } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#111827'), B: col('#34d399'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			},
			{
				label: 'cap',
				program: {
					steps: [
						{ id: 'a', name: 'glow', op: 'div', args: { A: num(0.08), B: inp('dist') } },
						{
							id: 'b',
							name: 'held',
							op: 'clamp',
							args: { A: ref('a'), LO: num(0), HI: num(1) }
						},
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#f472b6'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			}
		]
	},
{
		// atan gives the angle around a point — a color sweep.
		name: 'Turn',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'sweep',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'ang', op: 'atan', args: { A: ref('b'), B: ref('a') } },
						{ id: 'd', name: 'spin', op: 'div', args: { A: ref('c'), B: num(6.28318) } },
						{ id: 'e', name: 'paint', op: 'rainbow', args: { N: ref('d') } },
						{ id: 'f', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'g', name: 'lit', op: 'mul', args: { A: ref('e'), B: ref('f') } }
					],
					color: ref('g')
				}
			},
			{
				label: 'spin',
				program: {
					steps: [
						{ id: 'a', name: 'ox', op: 'sub', args: { A: inp('x'), B: num(0.5) } },
						{ id: 'b', name: 'oy', op: 'sub', args: { A: inp('y'), B: num(0.5) } },
						{ id: 'c', name: 'ang', op: 'atan', args: { A: ref('b'), B: ref('a') } },
						{ id: 'd', name: 'unit', op: 'div', args: { A: ref('c'), B: num(6.28318) } },
						{ id: 'e', name: 'slide', op: 'mul', args: { A: inp('time'), B: num(0.15) } },
						{ id: 'f', name: 'turn', op: 'add', args: { A: ref('d'), B: ref('e') } },
						{ id: 'g', name: 'rays', op: 'mul', args: { A: ref('f'), B: num(8) } },
						{ id: 'h', name: 'shine', op: 'wave', args: { N: ref('g') } },
						{ id: 'i', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'j', name: 'lit', op: 'mul', args: { A: ref('h'), B: ref('i') } },
						{
							id: 'k',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0b0420'), B: col('#fde047'), T: ref('j') }
						}
					],
					color: ref('k')
				}
			}
		]
	},
{
		// exp grows crazy fast — feed it minus numbers for a soft fade.
		name: 'Fade',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'halo',
				program: {
					steps: [
						{ id: 'a', name: 'neg', op: 'mul', args: { A: inp('dist'), B: num(-6) } },
						{ id: 'b', name: 'fall', op: 'exp', args: { A: ref('a') } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#38bdf8'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			},
			{
				label: 'flash',
				program: {
					steps: [
						{ id: 'a', name: 'beat', op: 'mod', args: { A: inp('time'), B: num(1.2) } },
						{ id: 'b', name: 'neg', op: 'mul', args: { A: ref('a'), B: num(-4) } },
						{ id: 'c', name: 'burst', op: 'exp', args: { A: ref('b') } },
						{ id: 'd', name: 'place', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'e', name: 'keep', op: 'max', args: { A: ref('d'), B: num(0) } },
						{ id: 'f', name: 'lit', op: 'mul', args: { A: ref('c'), B: ref('e') } },
						{
							id: 'g',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0a0612'), B: col('#fb7185'), T: ref('f') }
						}
					],
					color: ref('g')
				}
			}
		]
	},
{
		// log squashes big numbers down — soft distance shading.
		name: 'Squash',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'soft',
				program: {
					steps: [
						{ id: 'a', name: 'wide', op: 'mul', args: { A: inp('dist'), B: num(8) } },
						{ id: 'b', name: 'lift', op: 'add', args: { A: ref('a'), B: num(1) } },
						{ id: 'c', name: 'squash', op: 'log', args: { A: ref('b') } },
						{ id: 'd', name: 'shade', op: 'div', args: { A: ref('c'), B: num(2.2) } },
						{
							id: 'e',
							name: 'paint',
							op: 'mix',
							args: { A: col('#fef3c7'), B: col('#9a3412'), T: ref('d') }
						}
					],
					color: ref('e')
				}
			},
			{
				label: 'glow',
				program: {
					steps: [
						{ id: 'a', name: 'hot', op: 'div', args: { A: num(0.15), B: inp('dist') } },
						{ id: 'b', name: 'lift', op: 'add', args: { A: ref('a'), B: num(1) } },
						{ id: 'c', name: 'squash', op: 'log', args: { A: ref('b') } },
						{ id: 'd', name: 'shade', op: 'div', args: { A: ref('c'), B: num(3) } },
						{
							id: 'e',
							name: 'held',
							op: 'clamp',
							args: { A: ref('d'), LO: num(0), HI: num(1) }
						},
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#fbbf24'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			}
		]
	},
{
		name: 'Rainbow',
		dim: 'color',
		section: 'learn',
		tiers: [
			{
				label: 'place',
				program: {
					steps: [{ id: 'a', name: 'paint', op: 'rainbow', args: { N: inp('x') } }],
					color: ref('a')
				}
			},
			{
				label: 'slide',
				program: {
					steps: [
						{ id: 'a', name: 'slide', op: 'mul', args: { A: inp('time'), B: num(0.2) } },
						{ id: 'b', name: 'where', op: 'add', args: { A: inp('x'), B: ref('a') } },
						{ id: 'c', name: 'paint', op: 'rainbow', args: { N: ref('b') } }
					],
					color: ref('c')
				}
			},
			{
				label: 'bend',
				program: {
					steps: [
						{ id: 'a', name: 'slide', op: 'mul', args: { A: inp('time'), B: num(0.2) } },
						{ id: 'b', name: 'where', op: 'add', args: { A: inp('x'), B: ref('a') } },
						{ id: 'c', name: 'drift', op: 'add', args: { A: inp('y'), B: inp('time') } },
						{ id: 'd', name: 'wob', op: 'wave', args: { N: ref('c') } },
						{ id: 'e', name: 'bend', op: 'mul', args: { A: ref('d'), B: num(0.25) } },
						{ id: 'f', name: 'wavy', op: 'add', args: { A: ref('b'), B: ref('e') } },
						{ id: 'g', name: 'paint', op: 'rainbow', args: { N: ref('f') } }
					],
					color: ref('g')
				}
			}
		]
	},
{
		// build a color from red, green, and blue numbers.
		name: 'Channels',
		dim: 'color',
		section: 'learn',
		tiers: [
			{
				label: 'ramp',
				program: {
					steps: [
						{
							id: 'a',
							name: 'paint',
							op: 'rgb',
							args: { R: inp('x'), G: inp('y'), B: num(0.4) }
						}
					],
					color: ref('a')
				}
			},
			{
				label: 'glow',
				program: {
					steps: [
						{ id: 'a', name: 'pulse', op: 'wave', args: { N: inp('time') } },
						{ id: 'b', name: 'red', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'c', name: 'keep', op: 'max', args: { A: ref('b'), B: num(0) } },
						{ id: 'd', name: 'hot', op: 'mul', args: { A: ref('c'), B: ref('a') } },
						{ id: 'e', name: 'green', op: 'mul', args: { A: ref('d'), B: num(0.35) } },
						{
							id: 'f',
							name: 'paint',
							op: 'rgb',
							args: { R: ref('d'), G: ref('e'), B: num(0.15) }
						}
					],
					color: ref('f')
				}
			}
		]
	},
{
		name: 'Grid',
		dim: '2D',
		section: 'learn',
		tiers: [
			{
				label: 'bars',
				program: {
					steps: [
						{ id: 'a', name: 'bars', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'stripes', op: 'wave', args: { N: ref('a') } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1e293b'), B: col('#fbbf24'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			},
			{
				label: 'checks',
				program: {
					steps: [
						{ id: 'a', name: 'bars', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'across', op: 'wave', args: { N: ref('a') } },
						{ id: 'c', name: 'rows', op: 'mul', args: { A: inp('y'), B: num(6) } },
						{ id: 'd', name: 'up', op: 'wave', args: { N: ref('c') } },
						{ id: 'e', name: 'checks', op: 'mul', args: { A: ref('b'), B: ref('d') } },
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#312e81'), B: col('#f472b6'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			},
			{
				label: 'march',
				program: {
					steps: [
						{ id: 'a', name: 'bars', op: 'mul', args: { A: inp('x'), B: num(6) } },
						{ id: 'b', name: 'slide', op: 'add', args: { A: ref('a'), B: inp('time') } },
						{ id: 'c', name: 'across', op: 'wave', args: { N: ref('b') } },
						{ id: 'd', name: 'rows', op: 'mul', args: { A: inp('y'), B: num(6) } },
						{ id: 'e', name: 'slow', op: 'mul', args: { A: inp('time'), B: num(0.7) } },
						{ id: 'f', name: 'climb', op: 'add', args: { A: ref('d'), B: ref('e') } },
						{ id: 'g', name: 'up', op: 'wave', args: { N: ref('f') } },
						{ id: 'h', name: 'checks', op: 'mul', args: { A: ref('c'), B: ref('g') } },
						{
							id: 'i',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f0f23'), B: col('#22d3ee'), T: ref('h') }
						}
					],
					color: ref('i')
				}
			}
		]
	},
{
		name: 'Edge',
		dim: '2D',
		section: 'learn',
		tiers: [
			{
				label: 'soft',
				program: {
					steps: [
						{
							id: 'a',
							name: 'edge',
							op: 'smoothstep',
							args: { A: num(0.3), B: num(0.35), T: inp('dist') }
						},
						{ id: 'b', name: 'fill', op: 'sub', args: { A: num(1), B: ref('a') } },
						{
							id: 'c',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#38bdf8'), T: ref('b') }
						}
					],
					color: ref('c')
				}
			}
		]
	},
{
		name: 'Repeat',
		dim: 'repeat',
		section: 'learn',
		tiers: [
			{
				label: 'loop',
				program: {
					steps: [
						loop('rings', 5, [
							{ id: 'grow', name: 'grow', op: 'mul', args: { A: inp('lap'), B: num(0.22) } },
							{ id: 'rad', name: 'radius', op: 'add', args: { A: ref('grow'), B: num(0.12) } },
							{ id: 'away', name: 'away', op: 'sub', args: { A: inp('dist'), B: ref('rad') } },
							{ id: 'ab', name: 'ab', op: 'abs', args: { A: ref('away') } },
							{
								id: 'sm',
								name: 'sm',
								op: 'smoothstep',
								args: { A: num(0), B: num(0.02), T: ref('ab') }
							},
							{ id: 'ring', name: 'ring', op: 'sub', args: { A: num(1), B: ref('sm') } },
							{ id: 'acc', name: 'rings', op: 'add', args: { A: ref('acc'), B: ref('ring') } }
						]),
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0b1020'), B: col('#7de2ff'), T: ref('acc') }
						}
					],
					color: ref('paint')
				}
			}
		]
	},
{
		// noise at a spot — the raw grain clouds are made of.
		name: 'Grain',
		dim: 'noise',
		section: 'learn',
		tiers: [
			{
				label: 'field',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(4) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(4) } },
						{ id: 'c', name: 'grain', op: 'noisexy', args: { A: ref('a'), B: ref('b') } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#94a3b8'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			},
			{
				label: 'drift',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(3) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(3) } },
						{ id: 'c', name: 'rise', op: 'add', args: { A: ref('b'), B: inp('time') } },
						{ id: 'd', name: 'grain', op: 'noisexy', args: { A: ref('a'), B: ref('c') } },
						{
							id: 'e',
							name: 'paint',
							op: 'mix',
							args: { A: col('#082f49'), B: col('#e0f2fe'), T: ref('d') }
						}
					],
					color: ref('e')
				}
			}
		]
	},
{
		// simplex noise swings above and below zero — streakier clouds.
		name: 'Streak',
		dim: 'noise',
		section: 'learn',
		tiers: [
			{
				label: 'field',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(3) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(3) } },
						{ id: 'c', name: 'raw', op: 'snoise', args: { A: ref('a'), B: ref('b') } },
						{ id: 'd', name: 'half', op: 'mul', args: { A: ref('c'), B: num(0.5) } },
						{ id: 'e', name: 'lift', op: 'add', args: { A: ref('d'), B: num(0.5) } },
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1e1b4b'), B: col('#c4b5fd'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			},
			{
				label: 'flow',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(2.5) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(2.5) } },
						{ id: 'c', name: 'drift', op: 'mul', args: { A: inp('time'), B: num(0.4) } },
						{ id: 'd', name: 'move', op: 'add', args: { A: ref('a'), B: ref('c') } },
						{ id: 'e', name: 'raw', op: 'snoise', args: { A: ref('d'), B: ref('b') } },
						{ id: 'f', name: 'half', op: 'mul', args: { A: ref('e'), B: num(0.5) } },
						{ id: 'g', name: 'lift', op: 'add', args: { A: ref('f'), B: num(0.5) } },
						{
							id: 'h',
							name: 'paint',
							op: 'mix',
							args: { A: col('#042f2e'), B: col('#5eead4'), T: ref('g') }
						}
					],
					color: ref('h')
				}
			}
		]
	},
{
		// noise3 adds a third axis — feed it time to churn.
		name: 'Churn',
		dim: 'noise',
		section: 'learn',
		tiers: [
			{
				label: 'boil',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(3) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(3) } },
						{ id: 'c', name: 'slow', op: 'mul', args: { A: inp('time'), B: num(0.6) } },
						{
							id: 'd',
							name: 'boil',
							op: 'noise3',
							args: { A: ref('a'), B: ref('b'), C: ref('c') }
						},
						{
							id: 'e',
							name: 'paint',
							op: 'mix',
							args: { A: col('#431407'), B: col('#fdba74'), T: ref('d') }
						}
					],
					color: ref('e')
				}
			},
			{
				label: 'lava',
				program: {
					steps: [
						{ id: 'a', name: 'sx', op: 'mul', args: { A: inp('x'), B: num(4) } },
						{ id: 'b', name: 'sy', op: 'mul', args: { A: inp('y'), B: num(4) } },
						{ id: 'c', name: 'slow', op: 'mul', args: { A: inp('time'), B: num(0.5) } },
						{
							id: 'd',
							name: 'boil',
							op: 'noise3',
							args: { A: ref('a'), B: ref('b'), C: ref('c') }
						},
						{ id: 'e', name: 'hot', op: 'pow', args: { A: ref('d'), B: num(2) } },
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#1c1917'), B: col('#f97316'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			}
		]
	},
{
		// just passes a value through — handy for naming a number.
		name: 'Pass',
		dim: 'basics',
		section: 'learn',
		tiers: [
			{
				label: 'pin',
				program: {
					steps: [
						{ id: 'a', name: 'amount', op: 'just', args: { A: num(0.65) } },
						{
							id: 'b',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0f172a'), B: col('#a78bfa'), T: ref('a') }
						}
					],
					color: ref('b')
				}
			},
			{
				label: 'named',
				program: {
					steps: [
						{ id: 'a', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'b', name: 'keep', op: 'max', args: { A: ref('a'), B: num(0) } },
						{ id: 'c', name: 'brightness', op: 'just', args: { A: ref('b') } },
						{
							id: 'd',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#f9a8d4'), T: ref('c') }
						}
					],
					color: ref('d')
				}
			}
		]
	},
{
		name: 'Shapes',
		section: 'gallery',
		dim: '2D',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						...shapeCoords,
						{ id: 'xx', name: 'xx', op: 'mul', args: { A: ref('px0'), B: ref('px0') } },
						{ id: 'yy', name: 'yy', op: 'mul', args: { A: ref('py0'), B: ref('py0') } },
						{ id: 'rr', name: 'rr', op: 'add', args: { A: ref('xx'), B: ref('yy') } },
						{ id: 'r', name: 'r', op: 'sqrt', args: { A: ref('rr') } },
						{ id: 'd', name: 'd', op: 'sub', args: { A: ref('r'), B: num(0.42) } },
						{ id: 'sm', name: 'sm', op: 'smoothstep', args: { A: num(0), B: num(0.01), T: ref('d') } },
						{ id: 'fill', name: 'circle', op: 'sub', args: { A: num(1), B: ref('sm') } },
						{
							id: 'halo',
							name: 'halo',
							op: 'smoothstep',
							args: { A: num(0.4), B: num(-0.02), T: ref('d') }
						},
						{ id: 'hot', name: 'glow', op: 'pow', args: { A: ref('halo'), B: num(2.4) } },
						{ id: 'edge', name: 'edge', op: 'mul', args: { A: ref('r'), B: num(0.35) } },
						{ id: 'room', name: 'room', op: 'sub', args: { A: num(1), B: ref('edge') } },
						{
							id: 'bg',
							name: 'bg',
							op: 'mix',
							args: { A: col('#05030f'), B: col('#1a1450'), T: ref('room') }
						},
						{
							id: 'lit',
							name: 'lit',
							op: 'mix',
							args: { A: ref('bg'), B: col('#3cf0ff'), T: ref('hot') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('lit'), B: col('#eaffff'), T: ref('fill') }
						}
					],
					color: ref('paint')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						...shapeCoords,
						...shapeCircle,
						...shapeBox,
						{
							id: 'cglow',
							name: 'c glow',
							op: 'smoothstep',
							args: { A: num(0.32), B: num(-0.02), T: ref('cd') }
						},
						{ id: 'chot', name: 'c hot', op: 'pow', args: { A: ref('cglow'), B: num(2.2) } },
						{
							id: 'bglow',
							name: 'b glow',
							op: 'smoothstep',
							args: { A: num(0.28), B: num(-0.02), T: ref('bd') }
						},
						{ id: 'bhot', name: 'b hot', op: 'pow', args: { A: ref('bglow'), B: num(2.2) } },
						{ id: 'fade', name: 'fade', op: 'mul', args: { A: inp('dist'), B: num(0.45) } },
						{ id: 'room', name: 'room', op: 'sub', args: { A: num(1), B: ref('fade') } },
						{
							id: 'bg',
							name: 'bg',
							op: 'mix',
							args: { A: col('#060412'), B: col('#1a1040'), T: ref('room') }
						},
						{
							id: 'p1',
							name: 'with circle',
							op: 'mix',
							args: { A: ref('bg'), B: col('#38bdf8'), T: ref('chot') }
						},
						{
							id: 'p2',
							name: 'circle core',
							op: 'mix',
							args: { A: ref('p1'), B: col('#e0f7ff'), T: ref('cfill') }
						},
						{
							id: 'p3',
							name: 'with box',
							op: 'mix',
							args: { A: ref('p2'), B: col('#fb923c'), T: ref('bhot') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('p3'), B: col('#fff1c9'), T: ref('bfill') }
						}
					],
					color: ref('paint')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						...shapeCoords,
						...shapeCircle,
						...shapeBox,
						...shapeLine,
						...shapeCurve,
						{ id: 'fade', name: 'fade', op: 'mul', args: { A: inp('dist'), B: num(0.4) } },
						{ id: 'room', name: 'room', op: 'sub', args: { A: num(1), B: ref('fade') } },
						{
							id: 'bg',
							name: 'bg',
							op: 'mix',
							args: { A: col('#05030f'), B: col('#17124a'), T: ref('room') }
						},
						{
							id: 'p1',
							name: 'with circle',
							op: 'mix',
							args: { A: ref('bg'), B: col('#38bdf8'), T: ref('cfill') }
						},
						{
							id: 'p2',
							name: 'with box',
							op: 'mix',
							args: { A: ref('p1'), B: col('#fb923c'), T: ref('bfill') }
						},
						{
							id: 'p3',
							name: 'with line',
							op: 'mix',
							args: { A: ref('p2'), B: col('#4ade80'), T: ref('lstroke') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('p3'), B: col('#f472b6'), T: ref('vstroke') }
						}
					],
					color: ref('paint')
				}
			}
		]
	},
{
		name: 'Heart',
		dim: 'beat',
		section: 'gallery',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						...heartCoords,
						...heartShapeSteps('px0', 'py0'),
						{
							id: 'halo',
							name: 'halo',
							op: 'smoothstep',
							args: { A: num(-0.22), B: num(0.04), T: ref('dr') }
						},
						{ id: 'hot', name: 'glow', op: 'pow', args: { A: ref('halo'), B: num(2.6) } },
						{ id: 'qx', name: 'qx', op: 'mul', args: { A: ref('px0'), B: ref('px0') } },
						{ id: 'qy', name: 'qy', op: 'mul', args: { A: ref('py0'), B: ref('py0') } },
						{ id: 'qq', name: 'qq', op: 'add', args: { A: ref('qx'), B: ref('qy') } },
						{ id: 'r0', name: 'r0', op: 'sqrt', args: { A: ref('qq') } },
						{ id: 'v1', name: 'v1', op: 'mul', args: { A: ref('r0'), B: num(0.3) } },
						{ id: 'room', name: 'room', op: 'sub', args: { A: num(1), B: ref('v1') } },
						{
							id: 'bg',
							name: 'bg',
							op: 'mix',
							args: { A: col('#0c0408'), B: col('#2a0a18'), T: ref('room') }
						},
						{
							id: 'lit',
							name: 'lit',
							op: 'mix',
							args: { A: ref('bg'), B: col('#ff2d55'), T: ref('hot') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('lit'), B: col('#ffc2d1'), T: ref('m') }
						}
					],
					color: ref('paint')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						...heartCoords,
						...heartBeatSteps,
						...heartShapeSteps('px', 'py'),
						{
							id: 'halo',
							name: 'halo',
							op: 'smoothstep',
							args: { A: num(-0.22), B: num(0.04), T: ref('dr') }
						},
						{ id: 'hot', name: 'glow', op: 'pow', args: { A: ref('halo'), B: num(2.6) } },
						{ id: 'qx', name: 'qx', op: 'mul', args: { A: ref('px0'), B: ref('px0') } },
						{ id: 'qy', name: 'qy', op: 'mul', args: { A: ref('py0'), B: ref('py0') } },
						{ id: 'qq', name: 'qq', op: 'add', args: { A: ref('qx'), B: ref('qy') } },
						{ id: 'r0', name: 'r0', op: 'sqrt', args: { A: ref('qq') } },
						{ id: 'v1', name: 'v1', op: 'mul', args: { A: ref('r0'), B: num(0.3) } },
						{ id: 'room', name: 'room', op: 'sub', args: { A: num(1), B: ref('v1') } },
						{
							id: 'bg',
							name: 'bg',
							op: 'mix',
							args: { A: col('#0c0408'), B: col('#2a0a18'), T: ref('room') }
						},
						{
							id: 'lit',
							name: 'lit',
							op: 'mix',
							args: { A: ref('bg'), B: col('#ff2d55'), T: ref('hot') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('lit'), B: col('#ffc2d1'), T: ref('m') }
						}
					],
					color: ref('paint')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						...heartCoords,
						...heartBeatSteps,
						...heartShapeSteps('px', 'py'),
						...heartColorSteps,
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: ref('bcol'), B: ref('hcol'), T: ref('m') }
						}
					],
					color: ref('paint')
				}
			}
		]
	},
{
		name: 'Ripples',
		section: 'gallery',
		dim: 'waves',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						{ id: 'a', name: 'rings', op: 'mul', args: { A: inp('dist'), B: num(5) } },
						{ id: 'b', name: 'glow', op: 'wave', args: { N: ref('a') } },
						{ id: 'c', name: 'hot', op: 'pow', args: { A: ref('b'), B: num(2.2) } },
						{ id: 'd', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'e', name: 'lit', op: 'mul', args: { A: ref('c'), B: ref('d') } },
						{
							id: 'f',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#5ef0ff'), T: ref('e') }
						}
					],
					color: ref('f')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						{ id: 'a', name: 'rings', op: 'mul', args: { A: inp('dist'), B: num(5) } },
						{ id: 'b', name: 'moving', op: 'sub', args: { A: ref('a'), B: inp('time') } },
						{ id: 'c', name: 'glow', op: 'wave', args: { N: ref('b') } },
						{ id: 'd', name: 'hot', op: 'pow', args: { A: ref('c'), B: num(2.2) } },
						{ id: 'e', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'f', name: 'lit', op: 'mul', args: { A: ref('d'), B: ref('e') } },
						{
							id: 'g',
							name: 'paint',
							op: 'mix',
							args: { A: col('#020617'), B: col('#7df9ff'), T: ref('f') }
						}
					],
					color: ref('g')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						{ id: 'a', name: 'rings', op: 'mul', args: { A: inp('dist'), B: num(5) } },
						{ id: 'b', name: 'move', op: 'sub', args: { A: ref('a'), B: inp('time') } },
						{ id: 'c', name: 'wave 1', op: 'wave', args: { N: ref('b') } },
						{ id: 'd', name: 'off x', op: 'sub', args: { A: inp('x'), B: num(0.8) } },
						{ id: 'e', name: 'off y', op: 'sub', args: { A: inp('y'), B: num(0.8) } },
						{ id: 'f', name: 'xx', op: 'mul', args: { A: ref('d'), B: ref('d') } },
						{ id: 'g', name: 'yy', op: 'mul', args: { A: ref('e'), B: ref('e') } },
						{ id: 'h', name: 'apart', op: 'add', args: { A: ref('f'), B: ref('g') } },
						{ id: 'i', name: 'rings 2', op: 'mul', args: { A: ref('h'), B: num(40) } },
						{ id: 'j', name: 'move 2', op: 'sub', args: { A: ref('i'), B: inp('time') } },
						{ id: 'k', name: 'wave 2', op: 'wave', args: { N: ref('j') } },
						{ id: 'l', name: 'overlap', op: 'mul', args: { A: ref('c'), B: ref('k') } },
						{ id: 'm', name: 'hot', op: 'pow', args: { A: ref('l'), B: num(1.8) } },
						{ id: 'n', name: 'fade', op: 'sub', args: { A: num(1.1), B: inp('dist') } },
						{ id: 'o', name: 'lit', op: 'mul', args: { A: ref('m'), B: ref('n') } },
						{
							id: 'p',
							name: 'paint',
							op: 'mix',
							args: { A: col('#01040f'), B: col('#9be8ff'), T: ref('o') }
						}
					],
					color: ref('p')
				}
			}
		]
	},
{
		name: 'Pinwheel',
		section: 'gallery',
		dim: 'spin',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						{ id: 'a', name: 'colors', op: 'rainbow', args: { N: inp('angle') } },
						{ id: 'b', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'c', name: 'soft', op: 'pow', args: { A: ref('b'), B: num(1.4) } },
						{ id: 'd', name: 'paint', op: 'mul', args: { A: ref('a'), B: ref('c') } }
					],
					color: ref('d')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						{ id: 'a', name: 'spin', op: 'mul', args: { A: inp('time'), B: num(0.1) } },
						{ id: 'b', name: 'turn', op: 'add', args: { A: inp('angle'), B: ref('a') } },
						{ id: 'c', name: 'colors', op: 'rainbow', args: { N: ref('b') } },
						{ id: 'd', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'e', name: 'soft', op: 'pow', args: { A: ref('d'), B: num(1.35) } },
						{ id: 'f', name: 'paint', op: 'mul', args: { A: ref('c'), B: ref('e') } }
					],
					color: ref('f')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						{ id: 'a', name: 'spin', op: 'mul', args: { A: inp('time'), B: num(0.15) } },
						{ id: 'b', name: 'turn', op: 'add', args: { A: inp('angle'), B: ref('a') } },
						{ id: 'c', name: 'twist', op: 'mul', args: { A: inp('dist'), B: num(2) } },
						{ id: 'd', name: 'spiral', op: 'add', args: { A: ref('b'), B: ref('c') } },
						{ id: 'e', name: 'colors', op: 'rainbow', args: { N: ref('d') } },
						{ id: 'f', name: 'fade', op: 'sub', args: { A: num(1), B: inp('dist') } },
						{ id: 'g', name: 'soft', op: 'pow', args: { A: ref('f'), B: num(1.5) } },
						{ id: 'h', name: 'paint', op: 'mul', args: { A: ref('e'), B: ref('g') } }
					],
					color: ref('h')
				}
			}
		]
	},
{
		name: 'Neon',
		dim: 'glow',
		section: 'gallery',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [...neonShared, ...neonLayer('A', 'ux', 'uy', 0, null)],
					color: ref('Alit')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						...neonShared,
						...neonLayer('A', 'ux', 'uy', 0, null),
						...neonLayer('B', 'Acx', 'Acy', 1, 'Alit')
					],
					color: ref('Bacc')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						...neonShared,
						...neonLayer('A', 'ux', 'uy', 0, null),
						...neonLayer('B', 'Acx', 'Acy', 1, 'Alit'),
						...neonLayer('C', 'Bcx', 'Bcy', 2, 'Bacc'),
						...neonLayer('D', 'Ccx', 'Ccy', 3, 'Cacc')
					],
					color: ref('Dacc')
				}
			}
		]
	},
{
		name: 'Loops',
		section: 'gallery',
		dim: 'repeat',
		tiers: [
			{
				// Five rings, one per lap: the radius grows with lap.
				label: 'small',
				program: {
					steps: [
						loop('rings', 5, [
							{ id: 'grow', name: 'grow', op: 'mul', args: { A: inp('lap'), B: num(0.22) } },
							{ id: 'rad', name: 'radius', op: 'add', args: { A: ref('grow'), B: num(0.12) } },
							{ id: 'away', name: 'away', op: 'sub', args: { A: inp('dist'), B: ref('rad') } },
							{ id: 'ab', name: 'ab', op: 'abs', args: { A: ref('away') } },
							{
								id: 'sm',
								name: 'sm',
								op: 'smoothstep',
								args: { A: num(0), B: num(0.02), T: ref('ab') }
							},
							{ id: 'ring', name: 'ring', op: 'sub', args: { A: num(1), B: ref('sm') } },
							{ id: 'acc', name: 'rings', op: 'add', args: { A: ref('acc'), B: ref('ring') } }
						]),
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0b1020'), B: col('#7de2ff'), T: ref('acc') }
						}
					],
					color: ref('paint')
				}
			},
			{
				// Six glowing dots spaced around a circle, spinning: lap
				// picks each dot's angle, acc collects all their glows.
				label: 'medium',
				program: {
					steps: [
						loop('dots', 6, [
							{ id: 'frac', name: 'frac', op: 'div', args: { A: inp('lap'), B: num(6) } },
							{ id: 'turn', name: 'turn', op: 'mul', args: { A: inp('time'), B: num(0.15) } },
							{ id: 'spun', name: 'spun', op: 'add', args: { A: ref('frac'), B: ref('turn') } },
							{ id: 'ang', name: 'ang', op: 'mul', args: { A: ref('spun'), B: num(6.2832) } },
							{ id: 'cx0', name: 'cx0', op: 'cos', args: { A: ref('ang') } },
							{ id: 'cx1', name: 'cx1', op: 'mul', args: { A: ref('cx0'), B: num(0.3) } },
							{ id: 'cx', name: 'dot x', op: 'add', args: { A: ref('cx1'), B: num(0.5) } },
							{ id: 'cy0', name: 'cy0', op: 'sin', args: { A: ref('ang') } },
							{ id: 'cy1', name: 'cy1', op: 'mul', args: { A: ref('cy0'), B: num(0.3) } },
							{ id: 'cy', name: 'dot y', op: 'add', args: { A: ref('cy1'), B: num(0.5) } },
							{ id: 'dx', name: 'dx', op: 'sub', args: { A: inp('x'), B: ref('cx') } },
							{ id: 'dy', name: 'dy', op: 'sub', args: { A: inp('y'), B: ref('cy') } },
							{ id: 'xx', name: 'xx', op: 'mul', args: { A: ref('dx'), B: ref('dx') } },
							{ id: 'yy', name: 'yy', op: 'mul', args: { A: ref('dy'), B: ref('dy') } },
							{ id: 'rr', name: 'apart', op: 'add', args: { A: ref('xx'), B: ref('yy') } },
							{ id: 'g', name: 'glow', op: 'div', args: { A: num(0.002), B: ref('rr') } },
							{ id: 'acc', name: 'all glow', op: 'add', args: { A: ref('acc'), B: ref('g') } }
						]),
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: col('#10142a'), B: col('#ffd43b'), T: ref('acc') }
						}
					],
					color: ref('paint')
				}
			},
			{
				// A comet: eight balls chase the same wavy path, each lap
				// a bit further back in time and a new rainbow color. The
				// collector step holds a color this time!
				label: 'big',
				program: {
					steps: [
						loop('comet', 8, [
							{ id: 'frac', name: 'frac', op: 'div', args: { A: inp('lap'), B: num(8) } },
							{ id: 'back', name: 'back', op: 'mul', args: { A: inp('lap'), B: num(0.15) } },
							{ id: 'ti', name: 'earlier', op: 'sub', args: { A: inp('time'), B: ref('back') } },
							{ id: 'sx', name: 'sx', op: 'mul', args: { A: ref('ti'), B: num(0.31) } },
							{ id: 'bx', name: 'ball x', op: 'wave', args: { N: ref('sx') } },
							{ id: 'sy', name: 'sy', op: 'mul', args: { A: ref('ti'), B: num(0.23) } },
							{ id: 'by', name: 'ball y', op: 'wave', args: { N: ref('sy') } },
							{ id: 'dx', name: 'dx', op: 'sub', args: { A: inp('x'), B: ref('bx') } },
							{ id: 'dy', name: 'dy', op: 'sub', args: { A: inp('y'), B: ref('by') } },
							{ id: 'xx', name: 'xx', op: 'mul', args: { A: ref('dx'), B: ref('dx') } },
							{ id: 'yy', name: 'yy', op: 'mul', args: { A: ref('dy'), B: ref('dy') } },
							{ id: 'rr', name: 'apart', op: 'add', args: { A: ref('xx'), B: ref('yy') } },
							{ id: 'g', name: 'glow', op: 'div', args: { A: num(0.0015), B: ref('rr') } },
							{ id: 'tint', name: 'tint', op: 'rainbow', args: { N: ref('frac') } },
							{ id: 'gcol', name: 'lit', op: 'mul', args: { A: ref('tint'), B: ref('g') } },
							{ id: 'acc', name: 'comet', op: 'add', args: { A: ref('acc'), B: ref('gcol') } }
						])
					],
					color: ref('acc')
				}
			}
		]
	},
{
		name: 'Metaballs',
		dim: '2D',
		section: 'gallery',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						{ id: 'a', name: 'apart', op: 'mul', args: { A: inp('dist'), B: inp('dist') } },
						{ id: 'b', name: 'glow', op: 'div', args: { A: num(0.05), B: ref('a') } },
						{ id: 'c', name: 'paint', op: 'mix', args: { A: col('#0b1020'), B: col('#6ee7ff'), T: ref('b') } }
					],
					color: ref('c')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						{ id: 'a', name: 'speed x', op: 'mul', args: { A: inp('time'), B: num(0.31) } },
						{ id: 'b', name: 'ball x', op: 'wave', args: { N: ref('a') } },
						{ id: 'c', name: 'speed y', op: 'mul', args: { A: inp('time'), B: num(0.23) } },
						{ id: 'd', name: 'ball y', op: 'wave', args: { N: ref('c') } },
						{ id: 'e', name: 'away x', op: 'sub', args: { A: inp('x'), B: ref('b') } },
						{ id: 'f', name: 'away y', op: 'sub', args: { A: inp('y'), B: ref('d') } },
						{ id: 'g', name: 'xx', op: 'mul', args: { A: ref('e'), B: ref('e') } },
						{ id: 'h', name: 'yy', op: 'mul', args: { A: ref('f'), B: ref('f') } },
						{ id: 'i', name: 'apart', op: 'add', args: { A: ref('g'), B: ref('h') } },
						{ id: 'j', name: 'glow', op: 'div', args: { A: num(0.02), B: ref('i') } },
						{ id: 'k', name: 'paint', op: 'mix', args: { A: col('#0b1020'), B: col('#6ee7ff'), T: ref('j') } }
					],
					color: ref('k')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						{ id: 'a', name: 'speed x', op: 'mul', args: { A: inp('time'), B: num(0.31) } },
						{ id: 'b', name: 'ball x', op: 'wave', args: { N: ref('a') } },
						{ id: 'c', name: 'speed y', op: 'mul', args: { A: inp('time'), B: num(0.23) } },
						{ id: 'd', name: 'ball y', op: 'wave', args: { N: ref('c') } },
						{ id: 'e', name: 'away x', op: 'sub', args: { A: inp('x'), B: ref('b') } },
						{ id: 'f', name: 'away y', op: 'sub', args: { A: inp('y'), B: ref('d') } },
						{ id: 'g', name: 'xx', op: 'mul', args: { A: ref('e'), B: ref('e') } },
						{ id: 'h', name: 'yy', op: 'mul', args: { A: ref('f'), B: ref('f') } },
						{ id: 'i', name: 'apart', op: 'add', args: { A: ref('g'), B: ref('h') } },
						{ id: 'j', name: 'glow', op: 'div', args: { A: num(0.02), B: ref('i') } },
						{ id: 'k', name: 'ball 2 x', op: 'sub', args: { A: num(1), B: ref('b') } },
						{ id: 'l', name: 'ball 2 y', op: 'sub', args: { A: num(1), B: ref('d') } },
						{ id: 'm', name: 'away 2 x', op: 'sub', args: { A: inp('x'), B: ref('k') } },
						{ id: 'n', name: 'away 2 y', op: 'sub', args: { A: inp('y'), B: ref('l') } },
						{ id: 'o', name: 'xx 2', op: 'mul', args: { A: ref('m'), B: ref('m') } },
						{ id: 'p', name: 'yy 2', op: 'mul', args: { A: ref('n'), B: ref('n') } },
						{ id: 'q', name: 'apart 2', op: 'add', args: { A: ref('o'), B: ref('p') } },
						{ id: 'r', name: 'glow 2', op: 'div', args: { A: num(0.02), B: ref('q') } },
						{ id: 's', name: 'both', op: 'add', args: { A: ref('j'), B: ref('r') } },
						{ id: 't', name: 'base', op: 'mix', args: { A: col('#05060f'), B: col('#22d3ee'), T: ref('s') } },
						{ id: 'u', name: 'hot', op: 'sub', args: { A: ref('s'), B: num(1.4) } },
						{ id: 'v', name: 'hot!', op: 'mul', args: { A: ref('u'), B: num(6) } },
						{ id: 'w', name: 'paint', op: 'mix', args: { A: ref('t'), B: col('#ffffff'), T: ref('v') } }
					],
					color: ref('w')
				}
			}
		]
	},
{
		name: 'Clouds',
		section: 'gallery',
		dim: 'noise',
		tiers: [
			{
				// One drifting fbm loop of simplex noise over a sky
				// gradient: the simplest cloud there is.
				label: 'small',
				program: {
					steps: [
						fst('ux0', 'mul', { A: inp('x'), B: num(2) }),
						fst('uy0', 'mul', { A: inp('y'), B: num(2) }),
						fst('tm', 'mul', { A: inp('time'), B: num(0.05) }, 'drift'),
						fst('sx0', 'add', { A: ref('ux0'), B: ref('tm') }),
						cloudLoop('s', {
							laps: 5,
							w0: 1,
							decay: 0.6,
							ridged: false,
							seedX: 'sx0',
							seedY: 'uy0',
							timeRef: 'tm'
						}),
						fst('cov1', 'mul', { A: ref('sacc'), B: num(1.5) }),
						fst('cover', 'add', { A: ref('cov1'), B: num(0.25) }),
						fst('sky', 'mix', { A: col('#66b3ff'), B: col('#336699'), T: inp('y') }),
						fst('paint', 'mix', { A: ref('sky'), B: col('#ffffff'), T: ref('cover') })
					],
					color: ref('paint')
				}
			},
			{
				// Two loops like the real thing: a soft shape and a
				// ridged one (abs of each term), sharpened by f*(r+f).
				label: 'medium',
				program: {
					steps: [
						fst('ux0', 'mul', { A: inp('x'), B: num(1.5) }),
						fst('uy0', 'mul', { A: inp('y'), B: num(1.5) }),
						fst('tm', 'mul', { A: inp('time'), B: num(0.04) }, 'drift'),
						fst('sx0', 'add', { A: ref('ux0'), B: ref('tm') }),
						cloudLoop('f', {
							laps: 6,
							w0: 0.7,
							decay: 0.6,
							ridged: false,
							seedX: 'sx0',
							seedY: 'uy0',
							timeRef: 'tm'
						}),
						cloudLoop('r', {
							laps: 6,
							w0: 0.8,
							decay: 0.7,
							ridged: true,
							seedX: 'sx0',
							seedY: 'uy0',
							timeRef: 'tm'
						}),
						fst('fr', 'add', { A: ref('racc'), B: ref('facc') }),
						fst('ff', 'mul', { A: ref('facc'), B: ref('fr') }, 'shape'),
						fst('cov1', 'mul', { A: ref('ff'), B: num(4) }),
						fst('cover', 'add', { A: ref('cov1'), B: num(0.2) }),
						fst('cb1', 'mul', { A: ref('facc'), B: num(0.3) }),
						fst('cb2', 'add', { A: ref('cb1'), B: num(0.55) }),
						fst('cb', 'clamp', { A: ref('cb2'), LO: num(0), HI: num(1) }, 'bright'),
						fst('cloudc', 'mix', { A: col('#8fa3b0'), B: col('#fffbe6'), T: ref('cb') }),
						fst('sky', 'mix', { A: col('#66b3ff'), B: col('#336699'), T: inp('y') }),
						fst('paint', 'mix', { A: ref('sky'), B: ref('cloudc'), T: ref('cover') })
					],
					color: ref('paint')
				}
			},
			{
				// The real thing: q = fbm warps everything, then four
				// loops - ridged shape r, soft shape f, colour c and
				// ridged colour c1 - exactly like the original.
				label: 'big',
				program: {
					steps: [
						// q = fbm(uv * cloudscale * 0.5)
						fst('qx0', 'mul', { A: inp('x'), B: num(0.55) }),
						fst('qy0', 'mul', { A: inp('y'), B: num(0.55) }),
						cloudLoop('q', {
							laps: 7,
							w0: 0.1,
							decay: 0.4,
							ridged: false,
							seedX: 'qx0',
							seedY: 'qy0',
							timeRef: null
						}),
						// uv*cloudscale - (q - time), shared by r and f
						fst('t1', 'mul', { A: inp('time'), B: num(0.03) }, 'drift'),
						fst('sx1', 'mul', { A: inp('x'), B: num(1.1) }),
						fst('sx2', 'sub', { A: ref('sx1'), B: ref('qacc') }),
						fst('rx0', 'add', { A: ref('sx2'), B: ref('t1') }),
						fst('sy1', 'mul', { A: inp('y'), B: num(1.1) }),
						fst('sy2', 'sub', { A: ref('sy1'), B: ref('qacc') }),
						fst('ry0', 'add', { A: ref('sy2'), B: ref('t1') }),
						cloudLoop('r', {
							laps: 8,
							w0: 0.8,
							decay: 0.7,
							ridged: true,
							seedX: 'rx0',
							seedY: 'ry0',
							timeRef: 't1'
						}),
						cloudLoop('f', {
							laps: 8,
							w0: 0.7,
							decay: 0.6,
							ridged: false,
							seedX: 'rx0',
							seedY: 'ry0',
							timeRef: 't1'
						}),
						fst('fr', 'add', { A: ref('racc'), B: ref('facc') }),
						fst('ff', 'mul', { A: ref('facc'), B: ref('fr') }, 'shape'),
						// colour loop at 2x scale, double speed
						fst('t2', 'mul', { A: inp('time'), B: num(0.06) }),
						fst('cx1', 'mul', { A: inp('x'), B: num(2.2) }),
						fst('cx2', 'sub', { A: ref('cx1'), B: ref('qacc') }),
						fst('cx0', 'add', { A: ref('cx2'), B: ref('t2') }),
						fst('cy1', 'mul', { A: inp('y'), B: num(2.2) }),
						fst('cy2', 'sub', { A: ref('cy1'), B: ref('qacc') }),
						fst('cy0', 'add', { A: ref('cy2'), B: ref('t2') }),
						cloudLoop('c', {
							laps: 7,
							w0: 0.4,
							decay: 0.6,
							ridged: false,
							seedX: 'cx0',
							seedY: 'cy0',
							timeRef: 't2'
						}),
						// ridged colour loop at 3x scale, triple speed
						fst('t3', 'mul', { A: inp('time'), B: num(0.09) }),
						fst('dx1', 'mul', { A: inp('x'), B: num(3.3) }),
						fst('dx2', 'sub', { A: ref('dx1'), B: ref('qacc') }),
						fst('dx0', 'add', { A: ref('dx2'), B: ref('t3') }),
						fst('dy1', 'mul', { A: inp('y'), B: num(3.3) }),
						fst('dy2', 'sub', { A: ref('dy1'), B: ref('qacc') }),
						fst('dy0', 'add', { A: ref('dy2'), B: ref('t3') }),
						cloudLoop('d', {
							laps: 7,
							w0: 0.4,
							decay: 0.6,
							ridged: true,
							seedX: 'dx0',
							seedY: 'dy0',
							timeRef: 't3'
						}),
						fst('ctot', 'add', { A: ref('cacc'), B: ref('dacc') }, 'colour'),
						// sky gradient per channel: mix(sky2, sky1, y)
						fst('sr1', 'mul', { A: inp('y'), B: num(-0.2) }),
						fst('sr', 'add', { A: ref('sr1'), B: num(0.4) }, 'sky r'),
						fst('sg1', 'mul', { A: inp('y'), B: num(-0.3) }),
						fst('sg', 'add', { A: ref('sg1'), B: num(0.7) }, 'sky g'),
						fst('sb1', 'mul', { A: inp('y'), B: num(-0.4) }),
						fst('sb', 'add', { A: ref('sb1'), B: num(1) }, 'sky b'),
						// cloudcolour = (1.1,1.1,0.9)*clamp(0.5 + 0.3c)
						fst('cb1', 'mul', { A: ref('ctot'), B: num(0.3) }),
						fst('cb2', 'add', { A: ref('cb1'), B: num(0.5) }),
						fst('cb', 'clamp', { A: ref('cb2'), LO: num(0), HI: num(1) }, 'bright'),
						// lit sky = clamp(0.5*sky + cloudcolour), per channel
						fst('lr1', 'mul', { A: ref('sr'), B: num(0.5) }),
						fst('lr2', 'mul', { A: ref('cb'), B: num(1.1) }),
						fst('lr3', 'add', { A: ref('lr1'), B: ref('lr2') }),
						fst('lr', 'clamp', { A: ref('lr3'), LO: num(0), HI: num(1) }, 'lit r'),
						fst('lg1', 'mul', { A: ref('sg'), B: num(0.5) }),
						fst('lg3', 'add', { A: ref('lg1'), B: ref('lr2') }),
						fst('lg', 'clamp', { A: ref('lg3'), LO: num(0), HI: num(1) }, 'lit g'),
						fst('lb1', 'mul', { A: ref('sb'), B: num(0.5) }),
						fst('lb2', 'mul', { A: ref('cb'), B: num(0.9) }),
						fst('lb3', 'add', { A: ref('lb1'), B: ref('lb2') }),
						fst('lb', 'clamp', { A: ref('lb3'), LO: num(0), HI: num(1) }, 'lit b'),
						// f = cloudcover + cloudalpha*f*r; mix by f + c
						fst('fa', 'mul', { A: ref('ff'), B: ref('racc') }),
						fst('fb', 'mul', { A: ref('fa'), B: num(8) }),
						fst('fcov', 'add', { A: ref('fb'), B: num(0.2) }, 'cover'),
						fst('tmv', 'add', { A: ref('fcov'), B: ref('ctot') }),
						fst('resr', 'mix', { A: ref('sr'), B: ref('lr'), T: ref('tmv') }),
						fst('resg', 'mix', { A: ref('sg'), B: ref('lg'), T: ref('tmv') }),
						fst('resb', 'mix', { A: ref('sb'), B: ref('lb'), T: ref('tmv') }),
						fst('paint', 'rgb', { R: ref('resr'), G: ref('resg'), B: ref('resb') })
					],
					color: ref('paint')
				}
			}
		]
	},
{
		// The classic warp-speed star tunnel. The whole trick: chop space
		// into grid cells, give every cell one star with a random depth
		// (noise sampled at whole numbers IS a plain random number), and
		// light the star up when its depth flies past you.
		name: 'Warp',
		dim: '3D',
		section: 'gallery',
		tiers: [
			{
				// Frozen mid-flight: same ray walk and star streaks as
				// big, but warp and speed are plain numbers - so you can
				// study the streaks without them flying past.
				label: 'medium',
				program: {
					steps: [
						...warpRay,
						fst('off', 'just', { A: num(3.6) }, 'warp'),
						fst('spd', 'just', { A: num(3.2) }, 'speed'),
						fst('hf', 'just', { A: num(1.55) }, 'half surge'),
						loop('fly', 20, warpFly),
						...warpGamma
					],
					color: ref('paint')
				}
			},
			{
				// Warp and speed breathe with time, so the tunnel surges
				// and the streaks stretch as you fly.
				label: 'big',
				program: {
					steps: [
						...warpRay,
						fst('of1', 'mul', { A: inp('time'), B: num(0.5) }),
						fst('co', 'cos', { A: ref('of1') }),
						fst('co1', 'add', { A: ref('co'), B: num(1) }),
						fst('sp2', 'mul', { A: ref('co1'), B: num(2) }, 'surge'),
						fst('spd', 'add', { A: ref('sp2'), B: num(0.1) }, 'speed'),
						fst('si', 'sin', { A: ref('of1') }),
						fst('si9', 'mul', { A: ref('si'), B: num(0.96) }),
						fst('of2', 'add', { A: ref('of1'), B: ref('si9') }),
						fst('off', 'mul', { A: ref('of2'), B: num(2) }, 'warp'),
						fst('hf', 'mul', { A: ref('sp2'), B: num(0.5) }, 'half surge'),
						loop('fly', 20, warpFly),
						...warpGamma
					],
					color: ref('paint')
				}
			}
		]
	},
{
		name: 'Clock',
		dim: 'time',
		section: 'gallery',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						...clockCoords,
						...clockBody,
						...clockSecTick,
						...clockHand('s', 'ssec', 0.85, 0.005, '#990000', 'bodycol'),
						...clockCenter('scol')
					],
					color: ref('paint')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						...clockCoords,
						...clockBody,
						...clockSecTick,
						...clockMinHr,
						...clockHand('s', 'ssec', 0.85, 0.005, '#990000', 'bodycol'),
						...clockHand('n', 'mm', 0.85, 0.015, '#000000', 'scol'),
						...clockHand('h', 'hh', 0.55, 0.015, '#000000', 'ncol'),
						...clockCenter('hcol')
					],
					color: ref('paint')
				}
			},
			{
				label: 'big',
				program: {
					steps: [
						...clockCoords,
						...clockBody,
						...clockMarks,
						...clockSecTick,
						...clockMinHr,
						...clockHand('s', 'ssec', 0.85, 0.005, '#990000', 'markscol'),
						...clockHand('n', 'mm', 0.85, 0.015, '#000000', 'scol'),
						...clockHand('h', 'hh', 0.55, 0.015, '#000000', 'ncol'),
						...clockCenter('hcol')
					],
					color: ref('paint')
				}
			}
		]
	},
{
		name: 'Flame',
		dim: '3D',
		section: 'gallery',
		tiers: [
			{
				label: 'small',
				program: {
					steps: [
						...flameCoords,
						...flameShape,
						...flameGlow('d0'),
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0a0402'), B: col('#ff801a'), T: ref('pw') }
						}
					],
					color: ref('paint')
				}
			},
			{
				label: 'medium',
				program: {
					steps: [
						...flameCoords,
						...flameShape,
						...flameNoise1,
						{ id: 'nc', name: 'nc', op: 'sub', args: { A: ref('n1'), B: num(0.5) } },
						...flameDistort('nc'),
						...flameGlow('d'),
						{
							id: 'core',
							name: 'core',
							op: 'mix',
							args: { A: col('#ff801a'), B: col('#ffe680'), T: ref('pw') }
						},
						{
							id: 'paint',
							name: 'paint',
							op: 'mix',
							args: { A: col('#0a0402'), B: ref('core'), T: ref('pw') }
						}
					],
					color: ref('paint')
				}
			},
			{
				// The real thing: XT95's raymarched flame, 64 laps of a
				// repeat block marching a ray through 3D noise.
				label: 'big',
				program: {
					steps: [
						...flameCoords,
						...flameRay,
						loop('march', 64, flameMarchBody),
						{ id: 'pyf', name: 'end y', op: 'sub', args: { A: ref('qy'), B: num(2) } },
						{ id: 'cm1', name: 'cm1', op: 'mul', args: { A: ref('pyf'), B: num(0.02) } },
						{ id: 'cm2', name: 'cm2', op: 'add', args: { A: ref('cm1'), B: num(0.4) } },
						{
							id: 'colm',
							name: 'tint',
							op: 'mix',
							args: { A: col('#1a80ff'), B: col('#ff801a'), T: ref('cm2') }
						},
						{ id: 'g2', name: 'g2', op: 'mul', args: { A: ref('glow'), B: num(2) } },
						{ id: 'g4', name: 'bright', op: 'pow', args: { A: ref('g2'), B: num(4) } },
						{ id: 'paint', name: 'paint', op: 'mul', args: { A: ref('colm'), B: ref('g4') } }
					],
					color: ref('paint')
				}
			}
		]
	},
{
		name: 'Fractal',
		dim: '3D',
		section: 'gallery',
		tiers: [
			{
				// The fold alone, in 2D: p = 0.7*abs(p)/dot(p,p) - 0.7
				// over and over. px/py carry between laps; the mix seeds
				// them with the pixel on lap 0.
				label: 'small',
				program: {
					steps: [
						fst('ox', 'sub', { A: inp('x'), B: num(0.5) }),
						fst('vx', 'mul', { A: ref('ox'), B: num(2) }),
						fst('oy', 'sub', { A: inp('y'), B: num(0.5) }),
						fst('vy', 'mul', { A: ref('oy'), B: num(2) }),
						loop('fold', 8, [
							fst('l1', 'mul', { A: inp('lap'), B: num(1000) }),
							fst('cl', 'clamp', { A: ref('l1'), LO: num(0), HI: num(1) }),
							fst('isf', 'sub', { A: num(1), B: ref('cl') }, 'first lap?'),
							fst('pxu', 'mix', { A: ref('px'), B: ref('vx'), T: ref('isf') }),
							fst('pyu', 'mix', { A: ref('py'), B: ref('vy'), T: ref('isf') }),
							fst('ax', 'abs', { A: ref('pxu') }),
							fst('ay', 'abs', { A: ref('pyu') }),
							fst('xx', 'mul', { A: ref('pxu'), B: ref('pxu') }),
							fst('yy', 'mul', { A: ref('pyu'), B: ref('pyu') }),
							fst('dpp', 'add', { A: ref('xx'), B: ref('yy') }),
							fst('s', 'div', { A: num(0.7), B: ref('dpp') }),
							fst('fx', 'mul', { A: ref('ax'), B: ref('s') }),
							fst('px', 'sub', { A: ref('fx'), B: num(0.7) }),
							fst('fy', 'mul', { A: ref('ay'), B: ref('s') }),
							fst('py', 'sub', { A: ref('fy'), B: num(0.7) }),
							fst('e', 'mul', { A: ref('dpp'), B: num(-2) }),
							fst('ex', 'exp', { A: ref('e') }),
							fst('res', 'add', { A: ref('res'), B: ref('ex') }, 'glow')
						]),
						fst('sc', 'mul', { A: ref('res'), B: num(0.12) }),
						fst('paint', 'rainbow', { N: ref('sc') })
					],
					color: ref('paint')
				}
			},
			{
				// The full 2D map(): fold, square as a complex number,
				// and sum exp(-19*|dot(p,c)|), painted with the original
				// (c*c, c, c*c*c) green palette.
				label: 'medium',
				program: {
					steps: [
						fst('ox', 'sub', { A: inp('x'), B: num(0.5) }),
						fst('vx', 'mul', { A: ref('ox'), B: num(2) }),
						fst('oy', 'sub', { A: inp('y'), B: num(0.5) }),
						fst('vy', 'mul', { A: ref('oy'), B: num(2) }),
						loop('fold', 10, [
							fst('l1', 'mul', { A: inp('lap'), B: num(1000) }),
							fst('cl', 'clamp', { A: ref('l1'), LO: num(0), HI: num(1) }),
							fst('isf', 'sub', { A: num(1), B: ref('cl') }, 'first lap?'),
							fst('pxu', 'mix', { A: ref('px'), B: ref('vx'), T: ref('isf') }),
							fst('pyu', 'mix', { A: ref('py'), B: ref('vy'), T: ref('isf') }),
							fst('ax', 'abs', { A: ref('pxu') }),
							fst('ay', 'abs', { A: ref('pyu') }),
							fst('xx', 'mul', { A: ref('pxu'), B: ref('pxu') }),
							fst('yy', 'mul', { A: ref('pyu'), B: ref('pyu') }),
							fst('dpp', 'add', { A: ref('xx'), B: ref('yy') }),
							fst('s', 'div', { A: num(0.7), B: ref('dpp') }),
							fst('fx', 'mul', { A: ref('ax'), B: ref('s') }),
							fst('gx', 'sub', { A: ref('fx'), B: num(0.7) }),
							fst('fy', 'mul', { A: ref('ay'), B: ref('s') }),
							fst('gy', 'sub', { A: ref('fy'), B: num(0.7) }),
							fst('xx2', 'mul', { A: ref('gx'), B: ref('gx') }),
							fst('yy2', 'mul', { A: ref('gy'), B: ref('gy') }),
							fst('nx', 'sub', { A: ref('xx2'), B: ref('yy2') }),
							fst('xy', 'mul', { A: ref('gx'), B: ref('gy') }),
							fst('ny', 'mul', { A: ref('xy'), B: num(2) }),
							fst('dm1', 'mul', { A: ref('nx'), B: ref('vx') }),
							fst('dm2', 'mul', { A: ref('ny'), B: ref('vy') }),
							fst('dpc', 'add', { A: ref('dm1'), B: ref('dm2') }),
							fst('ab', 'abs', { A: ref('dpc') }),
							fst('g19', 'mul', { A: ref('ab'), B: num(-19) }),
							fst('ex', 'exp', { A: ref('g19') }),
							fst('res', 'add', { A: ref('res'), B: ref('ex') }, 'glow'),
							fst('px', 'just', { A: ref('nx') }),
							fst('py', 'just', { A: ref('ny') })
						]),
						fst('cden', 'mul', { A: ref('res'), B: num(0.5) }, 'density'),
						fst('cc', 'mul', { A: ref('cden'), B: ref('cden') }),
						fst('ccc', 'mul', { A: ref('cc'), B: ref('cden') }),
						fst('rr', 'mul', { A: ref('cc'), B: num(0.9) }),
						fst('gg', 'mul', { A: ref('cden'), B: num(0.9) }),
						fst('bb', 'mul', { A: ref('ccc'), B: num(0.9) }),
						fst('paint', 'rgb', { R: ref('rr'), G: ref('gg'), B: ref('bb') })
					],
					color: ref('paint')
				}
			},
			{
				// The real thing: raymarch the sphere, 64 laps, with all
				// 10 folds unrolled inside each lap.
				label: 'big',
				program: {
					steps: [...fractalCamera, loop('march', 64, fractalMarchBody), ...fractalShade],
					color: ref('paint')
				}
			}
		]
	}

];

// ---------------------------------------------------------------------------
// The potion book is a course, not an operation catalog. Each chapter keeps
// one visual idea on screen and adds one new piece of thinking at a time.
// Finished, deliberately complex recipes live in the showcase below instead
// of pretending to be the next lesson.

const legacyProgram = (familyName, tierLabel) =>
	legacyFamilies.find((family) => family.name === familyName)?.tiers.find((tier) => tier.label === tierLabel)
		?.program;

const colorCourse = {
	name: 'Color',
	dim: 'start',
	section: 'learn',
	phase: 'Foundations',
	tagline: 'Color the canvas, then let position steer the blend.',
	tiers: [
		{
			label: 'solid',
			newIdea: 'one value',
			teaches: 'Start with the final color: one choice reaches every pixel.',
			program: { steps: [], color: col('#312e81') }
		},
		{
			label: 'gradient',
			newIdea: 'mix + y',
			teaches: 'Use y to blend from a midnight horizon into warm light.',
			program: {
				steps: [
					fst('paint', 'mix', { A: col('#111827'), B: col('#fb7185'), T: inp('y') }, 'sky')
				],
				color: ref('paint')
			}
		},
		{
			label: 'diagonal',
			newIdea: 'x + y',
			teaches: 'Combine x and y so the same blend can travel across two dimensions.',
			program: {
				steps: [
					fst('both', 'add', { A: inp('x'), B: inp('y') }, 'x + y'),
					fst('balance', 'mul', { A: ref('both'), B: num(0.5) }, 'balance'),
					fst('paint', 'mix', { A: col('#06b6d4'), B: col('#7c3aed'), T: ref('balance') }, 'paint')
				],
				color: ref('paint')
			}
		}
	]
};

const patternCourse = {
	name: 'Pattern',
	dim: '2D',
	section: 'learn',
	phase: 'Foundations',
	tagline: 'Turn one wave into stripes, checks, and motion.',
	tiers: [
		{
			label: 'stripes',
			newIdea: 'wave',
			teaches: 'Stretch x, then feed it through wave to make repeating light.',
			program: {
				steps: [
					fst('wide', 'mul', { A: inp('x'), B: num(6) }, 'six across'),
					fst('bars', 'fn:wave', { N: ref('wide') }, 'stripes'),
					fst('paint', 'mix', { A: col('#172554'), B: col('#facc15'), T: ref('bars') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'checks',
			newIdea: 'a second axis',
			teaches: 'Build the same wave on y and multiply the two patterns together.',
			program: {
				steps: [
					fst('wide', 'mul', { A: inp('x'), B: num(6) }, 'six across'),
					fst('bars', 'fn:wave', { N: ref('wide') }, 'x stripes'),
					fst('tall', 'mul', { A: inp('y'), B: num(6) }, 'six up'),
					fst('rows', 'fn:wave', { N: ref('tall') }, 'y stripes'),
					fst('checks', 'mul', { A: ref('bars'), B: ref('rows') }, 'checks'),
					fst('paint', 'mix', { A: col('#083344'), B: col('#67e8f9'), T: ref('checks') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'scroll',
			newIdea: 'time',
			teaches: 'Add time to one direction and subtract it from the other.',
			program: {
				steps: [
					fst('clock', 'mul', { A: inp('time'), B: num(0.35) }, 'slow time'),
					fst('wide', 'mul', { A: inp('x'), B: num(6) }, 'six across'),
					fst('xmove', 'add', { A: ref('wide'), B: ref('clock') }, 'slide x'),
					fst('bars', 'fn:wave', { N: ref('xmove') }, 'x stripes'),
					fst('tall', 'mul', { A: inp('y'), B: num(6) }, 'six up'),
					fst('ymove', 'sub', { A: ref('tall'), B: ref('clock') }, 'slide y'),
					fst('rows', 'fn:wave', { N: ref('ymove') }, 'y stripes'),
					fst('checks', 'mul', { A: ref('bars'), B: ref('rows') }, 'checks'),
					fst('paint', 'mix', { A: col('#1e1b4b'), B: col('#f0abfc'), T: ref('checks') }, 'paint')
				],
				color: ref('paint')
			}
		}
	]
};

const centeredDistance = [
	fst('ox', 'sub', { A: inp('x'), B: num(0.5) }, 'center x'),
	fst('oy', 'sub', { A: inp('y'), B: num(0.5) }, 'center y'),
	fst('xx', 'mul', { A: ref('ox'), B: ref('ox') }, 'x squared'),
	fst('yy', 'mul', { A: ref('oy'), B: ref('oy') }, 'y squared'),
	fst('sum', 'add', { A: ref('xx'), B: ref('yy') }, 'squares together'),
	fst('dist', 'sqrt', { A: ref('sum') }, 'distance')
];

const shapeCourse = {
	name: 'Shape',
	dim: '2D',
	section: 'learn',
	phase: 'Fields',
	tagline: 'Measure from the center, cut a silhouette, then polish its edge.',
	tiers: [
		{
			label: 'distance',
			newIdea: 'distance',
			teaches: 'Square x and y, add them, and take the root to measure from the center.',
			program: {
				steps: [
					...centeredDistance,
					fst('shade', 'mul', { A: ref('dist'), B: num(1.7) }, 'stretch'),
					fst('paint', 'mix', { A: col('#a5f3fc'), B: col('#111827'), T: ref('shade') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'disc',
			newIdea: 'smoothstep',
			teaches: 'Turn distance into a soft-edged switch with smoothstep.',
			program: {
				steps: [
					...centeredDistance,
					fst('edge', 'smoothstep', { A: num(0.28), B: num(0.3), T: ref('dist') }, 'soft edge'),
					fst('fill', 'sub', { A: num(1), B: ref('edge') }, 'inside'),
					fst('paint', 'mix', { A: col('#0f172a'), B: col('#fb7185'), T: ref('fill') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'neon ring',
			newIdea: 'abs + layers',
			teaches: 'Use abs to fold distance around a radius, then layer a halo and a bright core.',
			program: {
				steps: [
					...centeredDistance,
					fst('offset', 'sub', { A: ref('dist'), B: num(0.31) }, 'ring radius'),
					fst('rim', 'abs', { A: ref('offset') }, 'distance to ring'),
					fst('haloedge', 'smoothstep', { A: num(0), B: num(0.1), T: ref('rim') }, 'halo edge'),
					fst('halo', 'sub', { A: num(1), B: ref('haloedge') }, 'halo'),
					fst('base', 'mix', { A: col('#09051f'), B: col('#22d3ee'), T: ref('halo') }, 'blue glow'),
					fst('coreedge', 'smoothstep', { A: num(0), B: num(0.018), T: ref('rim') }, 'core edge'),
					fst('core', 'sub', { A: num(1), B: ref('coreedge') }, 'bright core'),
					fst('paint', 'mix', { A: ref('base'), B: col('#ffffff'), T: ref('core') }, 'paint')
				],
				color: ref('paint')
			}
		}
	]
};

const motionPulseBase = [
	fst('dist', 'fn:dist', {}, 'distance'),
	fst('turn', 'mul', { A: inp('time'), B: num(1.4) }, 'slow time'),
	fst('swing', 'sin', { A: ref('turn') }, 'breathe'),
	fst('breath', 'mul', { A: ref('swing'), B: num(0.045) }, 'small change'),
	fst('radius', 'add', { A: ref('breath'), B: num(0.27) }, 'moving radius'),
	fst('offset', 'sub', { A: ref('dist'), B: ref('radius') }, 'ring radius'),
	fst('rim', 'abs', { A: ref('offset') }, 'distance to ring'),
	fst('haloedge', 'smoothstep', { A: num(0), B: num(0.1), T: ref('rim') }, 'halo edge'),
	fst('halo', 'sub', { A: num(1), B: ref('haloedge') }, 'halo'),
	fst('base', 'mix', { A: col('#07051b'), B: col('#22d3ee'), T: ref('halo') }, 'blue glow'),
	fst('coreedge', 'smoothstep', { A: num(0), B: num(0.018), T: ref('rim') }, 'core edge'),
	fst('core', 'sub', { A: num(1), B: ref('coreedge') }, 'bright core'),
	fst('pulsepaint', 'mix', { A: ref('base'), B: col('#ffffff'), T: ref('core') }, 'breathing ring')
];

const motionRippleBase = [
	...motionPulseBase,
	fst('many', 'mul', { A: ref('dist'), B: num(7) }, 'many rings'),
	fst('ripplespeed', 'mul', { A: inp('time'), B: num(0.38) }, 'travel'),
	fst('ripplephase', 'sub', { A: ref('many'), B: ref('ripplespeed') }, 'move outward'),
	fst('rings', 'fn:wave', { N: ref('ripplephase') }, 'rings'),
	fst('shine', 'pow', { A: ref('rings'), B: num(4) }, 'thin rings'),
	fst('fade0', 'sub', { A: num(1), B: ref('dist') }, 'fade away'),
	fst('fade', 'clamp', { A: ref('fade0'), LO: num(0), HI: num(1) }, 'keep visible range'),
	fst('ringmask', 'mul', { A: ref('shine'), B: ref('fade') }, 'fading ripples'),
	fst('ripplepaint', 'mix', { A: ref('pulsepaint'), B: col('#a78bfa'), T: ref('ringmask') }, 'ring and ripples')
];

const motionCourse = {
	name: 'Motion',
	dim: 'time',
	section: 'learn',
	phase: 'Fields',
	tagline: 'Make one neon ring breathe, send ripples from it, then add an orbiting spark.',
	tiers: [
		{
			label: 'breathe',
			newIdea: 'time → radius',
			teaches: 'Reuse distance, then let a slow sine wave change the radius of the neon ring.',
			program: {
				steps: motionPulseBase,
				color: ref('pulsepaint')
			}
		},
		{
			label: 'ripples',
			newIdea: 'distance as phase',
			teaches: 'Keep the breathing ring and use its distance as the phase of waves moving outward.',
			program: {
				steps: motionRippleBase,
				color: ref('ripplepaint')
			}
		},
		{
			label: 'orbit',
			newIdea: 'sine + cosine',
			teaches: 'Keep the ring and ripples, then use sine and cosine as x and y for one orbiting spark.',
			program: {
				steps: [
					...motionRippleBase,
					fst('orbitturn', 'mul', { A: inp('time'), B: num(1.5) }, 'orbit turn'),
					fst('cx0', 'cos', { A: ref('orbitturn') }, 'circle x'),
					fst('cy0', 'sin', { A: ref('orbitturn') }, 'circle y'),
					fst('cx1', 'mul', { A: ref('cx0'), B: num(0.28) }, 'orbit x'),
					fst('cy1', 'mul', { A: ref('cy0'), B: num(0.28) }, 'orbit y'),
					fst('cx', 'add', { A: ref('cx1'), B: num(0.5) }, 'point x'),
					fst('cy', 'add', { A: ref('cy1'), B: num(0.5) }, 'point y'),
					fst('dx', 'sub', { A: inp('x'), B: ref('cx') }, 'away x'),
					fst('dy', 'sub', { A: inp('y'), B: ref('cy') }, 'away y'),
					fst('xx', 'mul', { A: ref('dx'), B: ref('dx') }, 'x squared'),
					fst('yy', 'mul', { A: ref('dy'), B: ref('dy') }, 'y squared'),
					fst('apart', 'add', { A: ref('xx'), B: ref('yy') }, 'distance squared'),
					fst('glow', 'div', { A: num(0.012), B: ref('apart') }, 'glow'),
					fst('held', 'clamp', { A: ref('glow'), LO: num(0), HI: num(1) }, 'hold 0 to 1'),
					fst('paint', 'mix', { A: ref('ripplepaint'), B: col('#fef08a'), T: ref('held') }, 'add spark')
				],
				color: ref('paint')
			}
		}
	]
};

const polarCourse = {
	name: 'Polar',
	dim: '2D',
	section: 'learn',
	phase: 'Fields',
	tagline: 'Turn the circular motion you just made into a coordinate system of its own.',
	tiers: [
		{
			label: 'sweep',
			newIdea: 'angle',
			teaches: 'Reuse finished angle, distance, and rainbow helpers so every direction gets a color.',
			program: {
				steps: [
					fst('angle', 'fn:angle', {}, 'angle'),
					fst('dist', 'fn:dist', {}, 'distance'),
					fst('colors', 'fn:rainbow', { N: ref('angle') }, 'colors'),
					fst('fade', 'sub', { A: num(1), B: ref('dist') }, 'fade out'),
					fst('paint', 'mul', { A: ref('colors'), B: ref('fade') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'pinwheel',
			newIdea: 'repeat around a center',
			teaches: 'Multiply angle into arms, then sharpen the wave and fade its tips.',
			program: {
				steps: [
					fst('angle', 'fn:angle', {}, 'angle'),
					fst('dist', 'fn:dist', {}, 'distance'),
					fst('arms', 'mul', { A: ref('angle'), B: num(8) }, 'eight arms'),
					fst('wave', 'fn:wave', { N: ref('arms') }, 'soft arms'),
					fst('sharp', 'pow', { A: ref('wave'), B: num(2) }, 'sharp arms'),
					fst('fade', 'sub', { A: num(1), B: ref('dist') }, 'fade tips'),
					fst('lit', 'mul', { A: ref('sharp'), B: ref('fade') }, 'lit arms'),
					fst('paint', 'mix', { A: col('#0b071e'), B: col('#fde047'), T: ref('lit') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'spiral',
			newIdea: 'angle + distance',
			teaches: 'Add distance to angle and subtract time so the pinwheel curls and turns.',
			program: {
				steps: [
					fst('angle', 'fn:angle', {}, 'angle'),
					fst('dist', 'fn:dist', {}, 'distance'),
					fst('arms', 'mul', { A: ref('angle'), B: num(9) }, 'nine arms'),
					fst('curl', 'mul', { A: ref('dist'), B: num(4) }, 'curl'),
					fst('shape', 'add', { A: ref('arms'), B: ref('curl') }, 'spiral'),
					fst('clock', 'mul', { A: inp('time'), B: num(0.3) }, 'slow time'),
					fst('move', 'sub', { A: ref('shape'), B: ref('clock') }, 'turn'),
					fst('wave', 'fn:wave', { N: ref('move') }, 'soft arms'),
					fst('sharp', 'pow', { A: ref('wave'), B: num(2.4) }, 'sharp arms'),
					fst('colors', 'fn:rainbow', { N: ref('shape') }, 'colors'),
					fst('fade', 'sub', { A: num(1), B: ref('dist') }, 'fade tips'),
					fst('mask', 'mul', { A: ref('sharp'), B: ref('fade') }, 'mask'),
					fst('paint', 'mix', { A: col('#05010f'), B: ref('colors'), T: ref('mask') }, 'paint')
				],
				color: ref('paint')
			}
		}
	]
};

const textureCourse = {
	name: 'Texture',
	dim: 'noise',
	section: 'learn',
	phase: 'Fields',
	tagline: 'Sample randomness, animate it, then use noise to bend noise.',
	tiers: [
		{
			label: 'grain',
			newIdea: 'noise',
			teaches: 'Scale x and y before sampling noise to choose the size of the texture.',
			program: {
				steps: [
					fst('sx', 'mul', { A: inp('x'), B: num(7) }, 'zoom x'),
					fst('sy', 'mul', { A: inp('y'), B: num(7) }, 'zoom y'),
					fst('grain', 'noisexy', { A: ref('sx'), B: ref('sy') }, 'grain'),
					fst('paint', 'mix', { A: col('#172554'), B: col('#93c5fd'), T: ref('grain') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'drift',
			newIdea: 'move coordinates',
			teaches: 'Move the sample point with time, then sharpen the cloudy field.',
			program: {
				steps: [
					fst('sx', 'mul', { A: inp('x'), B: num(5) }, 'zoom x'),
					fst('sy', 'mul', { A: inp('y'), B: num(5) }, 'zoom y'),
					fst('clock', 'mul', { A: inp('time'), B: num(0.25) }, 'drift'),
					fst('move', 'sub', { A: ref('sy'), B: ref('clock') }, 'move up'),
					fst('cloud', 'noisexy', { A: ref('sx'), B: ref('move') }, 'cloud'),
					fst('deep', 'pow', { A: ref('cloud'), B: num(1.8) }, 'deeper contrast'),
					fst('paint', 'mix', { A: col('#052e2b'), B: col('#5eead4'), T: ref('deep') }, 'paint')
				],
				color: ref('paint')
			}
		},
		{
			label: 'flow',
			newIdea: 'noise bends noise',
			teaches: 'Use one noise field to bend the coordinates of a second field.',
			program: {
				steps: [
					fst('sx', 'mul', { A: inp('x'), B: num(3) }, 'zoom x'),
					fst('sy', 'mul', { A: inp('y'), B: num(3) }, 'zoom y'),
					fst('clock', 'mul', { A: inp('time'), B: num(0.2) }, 'drift'),
					fst('move', 'sub', { A: ref('sy'), B: ref('clock') }, 'move up'),
					fst('warp', 'snoise', { A: ref('sx'), B: ref('move') }, 'first noise'),
					fst('bend', 'mul', { A: ref('warp'), B: num(1.4) }, 'bend'),
					fst('qx', 'add', { A: ref('sx'), B: ref('bend') }, 'bent x'),
					fst('qy', 'sub', { A: ref('move'), B: ref('bend') }, 'bent y'),
					fst('detail', 'snoise', { A: ref('qx'), B: ref('qy') }, 'second noise'),
					fst('lift', 'add', { A: ref('detail'), B: num(0.5) }, 'lift'),
					fst('paint', 'mix', { A: col('#10002b'), B: col('#fb7185'), T: ref('lift') }, 'paint')
				],
				color: ref('paint')
			}
		}
	]
};

const repeatCourse = {
	name: 'Repeat',
	dim: 'loops',
	section: 'learn',
	phase: 'Systems',
	tagline: 'Repeat the circular ideas you know, place a system of orbiters, then turn it into a comet.',
	tiers: [
		{
			label: 'rings',
			newIdea: 'loop + accumulator',
			teaches: 'Use lap as a growing radius and add each ring into an accumulator.',
			program: legacyProgram('Repeat', 'loop')
		},
		{
			label: 'orbiters',
			newIdea: 'lap → angle',
			teaches: 'Combine lap, sine, and cosine to place six glowing points around a circle.',
			program: legacyProgram('Loops', 'medium')
		},
		{
			label: 'comet',
			newIdea: 'color accumulator',
			teaches: 'Make the final leap: each lap looks farther back in time and carries its own color.',
			program: legacyProgram('Loops', 'big')
		}
	]
};

// ---- A continuous introduction to 3D -------------------------------------
// These six lessons deliberately share the same camera and scene. The list
// grows from visible ray directions, to an analytic plane, to a grid, then to
// progressively richer raymarched terrain. There are no unrelated resets or
// hundred-step jumps between lessons.

const terrain3DCamera = [
	fst('ox3', 'sub', { A: inp('x'), B: num(0.5) }, 'center x'),
	fst('sx3', 'mul', { A: ref('ox3'), B: num(2) }, 'screen x'),
	fst('oy3', 'sub', { A: inp('y'), B: num(0.5) }, 'center y'),
	fst('sy3', 'mul', { A: ref('oy3'), B: num(2) }, 'screen y'),
	fst('lx3', 'mul', { A: ref('sx3'), B: num(1.05) }, 'lens x'),
	fst('ly30', 'mul', { A: ref('sy3'), B: num(0.72) }, 'lens y'),
	fst('ly3', 'sub', { A: ref('ly30'), B: num(0.18) }, 'look down'),
	fst('lz3', 'just', { A: num(-1.3) }, 'lens depth'),
	fst('lxx3', 'mul', { A: ref('lx3'), B: ref('lx3') }),
	fst('lyy3', 'mul', { A: ref('ly3'), B: ref('ly3') }),
	fst('lzz3', 'mul', { A: ref('lz3'), B: ref('lz3') }),
	fst('ls13', 'add', { A: ref('lxx3'), B: ref('lyy3') }),
	fst('ls23', 'add', { A: ref('ls13'), B: ref('lzz3') }),
	fst('len3', 'sqrt', { A: ref('ls23') }, 'ray length'),
	fst('rdx3', 'div', { A: ref('lx3'), B: ref('len3') }, 'ray x'),
	fst('rdy3', 'div', { A: ref('ly3'), B: ref('len3') }, 'ray y'),
	fst('rdz3', 'div', { A: ref('lz3'), B: ref('len3') }, 'ray z'),
	fst('glide3', 'mul', { A: inp('time'), B: num(0.12) }, 'camera glide'),
	fst('rox3', 'just', { A: ref('glide3') }, 'eye x'),
	fst('roy3', 'just', { A: num(1.15) }, 'eye y'),
	fst('roz3', 'just', { A: num(2.6) }, 'eye z')
];

const rayViewProgram = {
	steps: [
		...terrain3DCamera,
		fst('rayr0', 'mul', { A: ref('rdx3'), B: num(0.5) }),
		fst('rayr', 'add', { A: ref('rayr0'), B: num(0.5) }, 'ray red'),
		fst('rayg0', 'mul', { A: ref('rdy3'), B: num(0.5) }),
		fst('rayg', 'add', { A: ref('rayg0'), B: num(0.5) }, 'ray green'),
		fst('rayb', 'abs', { A: ref('rdz3') }, 'ray blue'),
		fst('paint3', 'rgb', { R: ref('rayr'), G: ref('rayg'), B: ref('rayb') }, 'paint rays')
	],
	color: ref('paint3')
};

const terrainPlaneBase = [
	...terrain3DCamera,
	fst('down3', 'sub', { A: num(0), B: ref('rdy3') }, 'ray points down'),
	fst('safe3', 'max', { A: ref('down3'), B: num(0.02) }, 'safe direction'),
	fst('planet3', 'div', { A: ref('roy3'), B: ref('safe3') }, 'distance to ground'),
	fst('pmx3', 'mul', { A: ref('rdx3'), B: ref('planet3') }),
	fst('planex3', 'add', { A: ref('rox3'), B: ref('pmx3') }, 'ground x'),
	fst('pmz3', 'mul', { A: ref('rdz3'), B: ref('planet3') }),
	fst('planez3', 'add', { A: ref('roz3'), B: ref('pmz3') }, 'ground z'),
	fst('ground3', 'smoothstep', { A: num(0), B: num(0.08), T: ref('down3') }, 'below horizon'),
	fst('far30', 'mul', { A: ref('planet3'), B: num(0.07) }, 'distance haze'),
	fst('far31', 'add', { A: ref('far30'), B: num(1) }),
	fst('fade3', 'div', { A: num(1), B: ref('far31') }, 'near is bright'),
	fst('sky3', 'mix', { A: col('#fda4af'), B: col('#172554'), T: inp('y') }, 'sky'),
	fst('land3', 'mix', { A: col('#172033'), B: col('#0f766e'), T: ref('fade3') }, 'ground color')
];

const groundPlaneProgram = {
	steps: [
		...terrainPlaneBase,
		fst('paint3', 'mix', { A: ref('sky3'), B: ref('land3'), T: ref('ground3') }, 'paint ground')
	],
	color: ref('paint3')
};

const perspectiveGridProgram = {
	steps: [
		...terrainPlaneBase,
		fst('gridx3', 'mul', { A: ref('planex3'), B: num(1.5) }, 'grid x'),
		fst('gridz3', 'mul', { A: ref('planez3'), B: num(1.5) }, 'grid z'),
		fst('cellx3', 'floor', { A: ref('gridx3') }, 'column'),
		fst('cellz3', 'floor', { A: ref('gridz3') }, 'row'),
		fst('cell3', 'add', { A: ref('cellx3'), B: ref('cellz3') }, 'cell id'),
		fst('check3', 'mod', { A: ref('cell3'), B: num(2) }, 'checker'),
		fst('gridlit3', 'mul', { A: ref('check3'), B: ref('fade3') }, 'fading checks'),
		fst('tiles3', 'mix', { A: ref('land3'), B: col('#67e8f9'), T: ref('gridlit3') }, 'grid color'),
		fst('paint3', 'mix', { A: ref('sky3'), B: ref('tiles3'), T: ref('ground3') }, 'paint grid')
	],
	color: ref('paint3')
};

function terrain3DHeight(prefix, xId, zId, detailed) {
	const low = [
		fst(prefix + 'lowx', 'mul', { A: ref(xId), B: num(0.55) }),
		fst(prefix + 'lowz', 'mul', { A: ref(zId), B: num(0.55) }),
		fst(prefix + 'lown', 'snoise', { A: ref(prefix + 'lowx'), B: ref(prefix + 'lowz') }, prefix + ' broad hills'),
		fst(prefix + 'low', 'mul', { A: ref(prefix + 'lown'), B: num(0.34) })
	];
	if (!detailed) return [...low, fst(prefix + 'height', 'just', { A: ref(prefix + 'low') }, prefix + ' height')];
	return [
		...low,
		fst(prefix + 'midx', 'mul', { A: ref(xId), B: num(1.35) }),
		fst(prefix + 'midz', 'mul', { A: ref(zId), B: num(1.35) }),
		fst(prefix + 'midn', 'snoise', { A: ref(prefix + 'midx'), B: ref(prefix + 'midz') }, prefix + ' ridges'),
		fst(prefix + 'mid', 'mul', { A: ref(prefix + 'midn'), B: num(0.12) }),
		fst(prefix + 'finex', 'mul', { A: ref(xId), B: num(3.2) }),
		fst(prefix + 'finez', 'mul', { A: ref(zId), B: num(3.2) }),
		fst(prefix + 'finen', 'snoise', { A: ref(prefix + 'finex'), B: ref(prefix + 'finez') }, prefix + ' detail'),
		fst(prefix + 'fine', 'mul', { A: ref(prefix + 'finen'), B: num(0.035) }),
		fst(prefix + 'sum', 'add', { A: ref(prefix + 'low'), B: ref(prefix + 'mid') }),
		fst(prefix + 'height', 'add', { A: ref(prefix + 'sum'), B: ref(prefix + 'fine') }, prefix + ' height')
	];
}

function terrain3DMarchBody(detailed, lit) {
	const body = [
		fst('tmx3', 'mul', { A: ref('rdx3'), B: ref('march3') }),
		fst('px3', 'add', { A: ref('rox3'), B: ref('tmx3') }, 'point x'),
		fst('tmy3', 'mul', { A: ref('rdy3'), B: ref('march3') }),
		fst('py3', 'add', { A: ref('roy3'), B: ref('tmy3') }, 'point y'),
		fst('tmz3', 'mul', { A: ref('rdz3'), B: ref('march3') }),
		fst('pz3', 'add', { A: ref('roz3'), B: ref('tmz3') }, 'point z'),
		...terrain3DHeight('h3', 'px3', 'pz3', detailed),
		fst('distance3', 'sub', { A: ref('py3'), B: ref('h3height') }, 'distance to terrain'),
		fst('pace30', 'mul', { A: ref('distance3'), B: num(0.65) }, 'safe pace'),
		fst('pace3', 'max', { A: ref('pace30'), B: num(0.025) }, 'step forward'),
		fst('march3', 'add', { A: ref('march3'), B: ref('pace3') }, 'march'),
		fst('away3', 'abs', { A: ref('distance3') }),
		fst('edge3', 'smoothstep', { A: num(0), B: num(0.08), T: ref('away3') }, 'surface edge'),
		fst('near3', 'sub', { A: num(1), B: ref('edge3') }, 'near surface'),
		fst('hit3', 'max', { A: ref('hit3'), B: ref('near3') }, 'terrain hit'),
		fst('elevation3', 'mix', { A: ref('elevation3'), B: ref('h3height'), T: ref('near3') }, 'elevation'),
		fst('depth3', 'mix', { A: ref('depth3'), B: ref('march3'), T: ref('near3') }, 'depth')
	];
	if (!lit) return body;
	return [
		...body,
		fst('sunx3', 'add', { A: ref('px3'), B: num(0.07) }, 'toward sun x'),
		fst('sunz3', 'add', { A: ref('pz3'), B: num(0.04) }, 'toward sun z'),
		...terrain3DHeight('sunh3', 'sunx3', 'sunz3', true),
		fst('slope3', 'sub', { A: ref('sunh3height'), B: ref('h3height') }, 'sunward slope'),
		fst('slopegain3', 'mul', { A: ref('slope3'), B: num(7) }, 'slope strength'),
		fst('shade30', 'sub', { A: num(0.72), B: ref('slopegain3') }, 'sun light'),
		fst('shade3', 'clamp', { A: ref('shade30'), LO: num(0.18), HI: num(1) }, 'light and shadow'),
		fst('light3', 'mix', { A: ref('light3'), B: ref('shade3'), T: ref('near3') }, 'remember light')
	];
}

function terrain3DPaint(detailed, lit, atmosphere) {
	const skyId = atmosphere ? 'sunsky3' : 'sky3';
	const steps = [
		fst('sky3', 'mix', { A: col('#fda4af'), B: col('#172554'), T: inp('y') }, 'sunset sky')
	];
	if (atmosphere) {
		steps.push(
			fst('backz3', 'sub', { A: num(0), B: ref('rdz3') }),
			fst('sunr3', 'mul', { A: ref('rdx3'), B: num(0.35) }),
			fst('suny3', 'mul', { A: ref('rdy3'), B: num(0.7) }),
			fst('sunz3p', 'mul', { A: ref('backz3'), B: num(0.55) }),
			fst('sunxy3', 'add', { A: ref('sunr3'), B: ref('suny3') }),
			fst('sunaim3', 'add', { A: ref('sunxy3'), B: ref('sunz3p') }, 'look toward sun'),
			fst('suncut3', 'sub', { A: ref('sunaim3'), B: num(0.82) }),
			fst('sungain3', 'mul', { A: ref('suncut3'), B: num(6) }),
			fst('sundisc3', 'clamp', { A: ref('sungain3'), LO: num(0), HI: num(1) }, 'sun disc'),
			fst('sunsoft3', 'pow', { A: ref('sundisc3'), B: num(5) }, 'soft sun'),
			fst('sunsky3', 'mix', { A: ref('sky3'), B: col('#fde68a'), T: ref('sunsoft3') }, 'sky and sun')
		);
	}
	steps.push(
		fst('elevlift3', 'add', { A: ref('elevation3'), B: num(0.45) }, 'height color'),
		fst('grass3', 'mix', { A: col('#123524'), B: col('#84cc16'), T: ref('elevlift3') }, 'grass')
	);
	if (detailed) {
		steps.push(
			fst('rockmask3', 'smoothstep', { A: num(0.12), B: num(0.36), T: ref('elevation3') }, 'rock line'),
			fst('rock3', 'mix', { A: ref('grass3'), B: col('#64748b'), T: ref('rockmask3') }, 'rock'),
			fst('snowmask3', 'smoothstep', { A: num(0.34), B: num(0.5), T: ref('elevation3') }, 'snow line'),
			fst('material3', 'mix', { A: ref('rock3'), B: col('#f8fafc'), T: ref('snowmask3') }, 'snow')
		);
	} else {
		steps.push(fst('material3', 'just', { A: ref('grass3') }, 'terrain material'));
	}
	if (lit) steps.push(fst('litland3', 'mul', { A: ref('material3'), B: ref('light3') }, 'sunlit land'));
	else steps.push(fst('litland3', 'just', { A: ref('material3') }, 'land'));
	if (atmosphere) {
		steps.push(
			fst('fograw3', 'mul', { A: ref('depth3'), B: num(0.055) }, 'distance fog'),
			fst('fog3', 'clamp', { A: ref('fograw3'), LO: num(0), HI: num(1) }, 'fog'),
			fst('hazed3', 'mix', { A: ref('litland3'), B: ref(skyId), T: ref('fog3') }, 'hazed land')
		);
	} else {
		steps.push(fst('hazed3', 'just', { A: ref('litland3') }, 'land'));
	}
	steps.push(fst('paint3', 'mix', { A: ref(skyId), B: ref('hazed3'), T: ref('hit3') }, 'paint world'));
	return steps;
}

function terrain3DProgram(detailed, lit, atmosphere) {
	return {
		steps: [
			...terrain3DCamera,
			loop('terrainmarch3', atmosphere ? 48 : 36, terrain3DMarchBody(detailed, lit)),
			...terrain3DPaint(detailed, lit, atmosphere)
		],
		color: ref('paint3')
	};
}

// First raymarch project: one readable height field, presented as a
// graphic dune scene rather than a stripped-down version of the alpine
// finale. The sun is a screen-space accent; the dunes themselves are the
// real 3D hit positions produced by the march.
const dune3DPaint = [
	fst('dunesky3', 'mix', { A: col('#2e1065'), B: col('#fb7185'), T: inp('y') }, 'desert sky'),
	fst('sundx3', 'sub', { A: inp('x'), B: num(0.73) }, 'sun x'),
	fst('sundy3', 'sub', { A: inp('y'), B: num(0.72) }, 'sun y'),
	fst('sundxx3', 'mul', { A: ref('sundx3'), B: ref('sundx3') }),
	fst('sundyy3', 'mul', { A: ref('sundy3'), B: ref('sundy3') }),
	fst('sundsum3', 'add', { A: ref('sundxx3'), B: ref('sundyy3') }),
	fst('sundist3', 'sqrt', { A: ref('sundsum3') }, 'sun distance'),
	fst('sunedge3', 'smoothstep', { A: num(0.065), B: num(0.08), T: ref('sundist3') }, 'sun edge'),
	fst('sunfill3', 'sub', { A: num(1), B: ref('sunedge3') }, 'sun'),
	fst('dunesunsky3', 'mix', { A: ref('dunesky3'), B: col('#fef3c7'), T: ref('sunfill3') }, 'sky and sun'),
	fst('duneheight3', 'add', { A: ref('elevation3'), B: num(0.42) }, 'warm by height'),
	fst('dunesand3', 'mix', { A: col('#7c2d12'), B: col('#fbbf24'), T: ref('duneheight3') }, 'sand'),
	fst('dunebands3', 'mul', { A: ref('elevation3'), B: num(11) }, 'sand bands'),
	fst('dunewave3', 'fn:wave', { N: ref('dunebands3') }, 'strata'),
	fst('dunesoft3', 'mul', { A: ref('dunewave3'), B: num(0.22) }, 'soft strata'),
	fst('dunelit3', 'mix', { A: ref('dunesand3'), B: col('#fde68a'), T: ref('dunesoft3') }, 'sunlit ridges'),
	fst('dunefograw3', 'mul', { A: ref('depth3'), B: num(0.05) }, 'distance haze'),
	fst('dunefog3', 'clamp', { A: ref('dunefograw3'), LO: num(0), HI: num(1) }, 'haze'),
	fst('dunehazed3', 'mix', { A: ref('dunelit3'), B: ref('dunesunsky3'), T: ref('dunefog3') }, 'distant dunes'),
	fst('dunepaint3', 'mix', { A: ref('dunesunsky3'), B: ref('dunehazed3'), T: ref('hit3') }, 'paint dunes')
];

const dune3DProgram = {
	steps: [
		...terrain3DCamera,
		loop('dunemarch3', 36, terrain3DMarchBody(false, false)),
		...dune3DPaint
	],
	color: ref('dunepaint3')
};

// Second project: a completely different distance field. Space repeats
// into cells; each cell grows a differently sized octahedral crystal and
// min() joins those crystals to a ground plane. The loop remembers which
// surface it hit so the paint pass can give the floor and facets different
// materials.
const crystalMarchBody = [
	fst('cmx3', 'mul', { A: ref('rdx3'), B: ref('crystalmarch3') }),
	fst('cpx3', 'add', { A: ref('rox3'), B: ref('cmx3') }, 'point x'),
	fst('cmy3', 'mul', { A: ref('rdy3'), B: ref('crystalmarch3') }),
	fst('cpy3', 'add', { A: ref('roy3'), B: ref('cmy3') }, 'point y'),
	fst('cmz3', 'mul', { A: ref('rdz3'), B: ref('crystalmarch3') }),
	fst('cpz3', 'add', { A: ref('roz3'), B: ref('cmz3') }, 'point z'),
	fst('cxshift3', 'add', { A: ref('cpx3'), B: num(0.725) }),
	fst('cxcellraw3', 'div', { A: ref('cxshift3'), B: num(1.45) }),
	fst('cxcell3', 'floor', { A: ref('cxcellraw3') }, 'crystal column'),
	fst('cqxwrap3', 'mod', { A: ref('cxshift3'), B: num(1.45) }),
	fst('cqx3', 'sub', { A: ref('cqxwrap3'), B: num(0.725) }, 'repeat x'),
	fst('czshift3', 'add', { A: ref('cpz3'), B: num(0.725) }),
	fst('czcellraw3', 'div', { A: ref('czshift3'), B: num(1.45) }),
	fst('czcell3', 'floor', { A: ref('czcellraw3') }, 'crystal row'),
	fst('cqzwrap3', 'mod', { A: ref('czshift3'), B: num(1.45) }),
	fst('cqz3', 'sub', { A: ref('cqzwrap3'), B: num(0.725) }, 'repeat z'),
	fst('cseed3', 'noisexy', { A: ref('cxcell3'), B: ref('czcell3') }, 'cell variation'),
	fst('csizespan3', 'mul', { A: ref('cseed3'), B: num(0.18) }),
	fst('csize3', 'add', { A: ref('csizespan3'), B: num(0.28) }, 'crystal size'),
	fst('ccenter3', 'div', { A: ref('csize3'), B: num(0.75) }, 'sit on ground'),
	fst('cqy3', 'sub', { A: ref('cpy3'), B: ref('ccenter3') }, 'crystal y'),
	fst('cax3', 'abs', { A: ref('cqx3') }),
	fst('cay3', 'abs', { A: ref('cqy3') }),
	fst('caz3', 'abs', { A: ref('cqz3') }),
	fst('cxz3', 'add', { A: ref('cax3'), B: ref('caz3') }, 'four sides'),
	fst('cxzshape3', 'mul', { A: ref('cxz3'), B: num(0.85) }),
	fst('cyshape3', 'mul', { A: ref('cay3'), B: num(0.75) }),
	fst('cdiamond3', 'add', { A: ref('cxzshape3'), B: ref('cyshape3') }, 'octahedron'),
	fst('ccrystal3', 'sub', { A: ref('cdiamond3'), B: ref('csize3') }, 'crystal distance'),
	fst('cground3', 'just', { A: ref('cpy3') }, 'ground distance'),
	fst('cscene3', 'min', { A: ref('ccrystal3'), B: ref('cground3') }, 'nearest surface'),
	fst('cpace03', 'mul', { A: ref('cscene3'), B: num(0.5) }, 'safe pace'),
	fst('cpace3', 'max', { A: ref('cpace03'), B: num(0.02) }, 'step forward'),
	fst('crystalmarch3', 'add', { A: ref('crystalmarch3'), B: ref('cpace3') }, 'march'),
	fst('caway3', 'abs', { A: ref('cscene3') }),
	fst('cedge3', 'smoothstep', { A: num(0), B: num(0.065), T: ref('caway3') }, 'surface edge'),
	fst('cnear3', 'sub', { A: num(1), B: ref('cedge3') }, 'near surface'),
	fst('cpickraw3', 'sub', { A: ref('cground3'), B: ref('ccrystal3') }),
	fst('cpick3', 'smoothstep', { A: num(-0.04), B: num(0.04), T: ref('cpickraw3') }, 'crystal or floor'),
	fst('crystalhit3', 'max', { A: ref('crystalhit3'), B: ref('cnear3') }, 'scene hit'),
	fst('crystalkind3', 'mix', { A: ref('crystalkind3'), B: ref('cpick3'), T: ref('cnear3') }, 'remember material'),
	fst('crystaldepth3', 'mix', { A: ref('crystaldepth3'), B: ref('crystalmarch3'), T: ref('cnear3') }, 'remember depth'),
	fst('cfacetbias3', 'sub', { A: ref('cax3'), B: ref('caz3') }, 'facet direction'),
	fst('cfacet3', 'smoothstep', { A: num(-0.18), B: num(0.18), T: ref('cfacetbias3') }, 'facet light'),
	fst('crystalfacet3', 'mix', { A: ref('crystalfacet3'), B: ref('cfacet3'), T: ref('cnear3') }, 'remember facet')
];

const crystal3DPaint = [
	fst('csky3', 'mix', { A: col('#020617'), B: col('#4c1d95'), T: inp('y') }, 'violet night'),
	fst('cfloor3', 'just', { A: col('#0f0a2a') }, 'velvet floor'),
	fst('ccolor3', 'mix', { A: col('#22d3ee'), B: col('#f472b6'), T: ref('crystalfacet3') }, 'crystal facets'),
	fst('clight3', 'mix', { A: num(0.48), B: num(1), T: ref('crystalfacet3') }, 'facet light'),
	fst('clit3', 'mul', { A: ref('ccolor3'), B: ref('clight3') }, 'lit crystal'),
	fst('csurface3', 'mix', { A: ref('cfloor3'), B: ref('clit3'), T: ref('crystalkind3') }, 'surface material'),
	fst('cfograw3', 'mul', { A: ref('crystaldepth3'), B: num(0.055) }, 'distance fog'),
	fst('cfog3', 'clamp', { A: ref('cfograw3'), LO: num(0), HI: num(1) }, 'fog'),
	fst('chazed3', 'mix', { A: ref('csurface3'), B: ref('csky3'), T: ref('cfog3') }, 'hazed scene'),
	fst('cworld3', 'mix', { A: ref('csky3'), B: ref('chazed3'), T: ref('crystalhit3') }, 'paint scene'),
	fst('ccore03', 'mul', { A: ref('crystalhit3'), B: ref('crystalkind3') }, 'crystal surface'),
	fst('ccore3', 'pow', { A: ref('ccore03'), B: num(4) }, 'hot core'),
	fst('crystalpaint3', 'mix', { A: ref('cworld3'), B: col('#ffffff'), T: ref('ccore3') }, 'paint crystals')
];

const crystal3DProgram = {
	steps: [
		...terrain3DCamera,
		loop('crystalfield3', 48, crystalMarchBody),
		...crystal3DPaint
	],
	color: ref('crystalpaint3')
};

const advancedCourses = [
	{
		name: '3D Camera',
		dim: '3D',
		section: 'learn',
		phase: '3D Worlds',
		tagline: 'Aim one ray through each pixel, meet a ground plane, then reveal perspective.',
		tiers: [
			{
				label: 'rays',
				newIdea: 'camera rays',
				teaches: 'Center the screen and normalize x, y, and depth into a 3D camera ray.',
				program: rayViewProgram
			},
			{
				label: 'ground',
				newIdea: 'ray meets plane',
				teaches: 'Follow each ray until it reaches a flat plane and fade that plane into the horizon.',
				program: groundPlaneProgram
			},
			{
				label: 'perspective',
				newIdea: 'world-space grid',
				teaches: 'Use the 3D hit position to draw a checker grid that shrinks naturally with distance.',
				program: perspectiveGridProgram
			}
		]
	},
	{
		name: 'Raymarch',
		dim: '3D scenes',
		section: 'learn',
		phase: '3D Worlds',
		tagline: 'March through three different worlds: dunes, repeated crystal geometry, then an alpine landscape.',
		tiers: [
			{
				label: 'dunes',
				newIdea: 'height-field march',
				teaches: 'Raise the flat plane into a smooth noise height field, then march it into a sunset dune scene.',
				program: dune3DProgram
			},
			{
				label: 'crystals',
				newIdea: 'repeated SDF scene',
				teaches: 'Build one faceted distance field, repeat it across x and z, then join it to the floor with min.',
				program: crystal3DProgram
			},
			{
				label: 'alpine',
				newIdea: 'light + atmosphere',
				teaches: 'Finish with three terrain octaves, elevation materials, slope lighting, a sun, fog, and a gliding camera.',
				program: terrain3DProgram(true, true, true)
			}
		]
	}
];

const showcase = [
	['Neon', 'glow', 'A full four-layer luminous weave with shifting geometry and color.', legacyProgram('Neon', 'big')],
	['Warp', 'space', 'A complete warp-speed star tunnel with depth, color separation, and gamma correction.', legacyProgram('Warp', 'big')],
	['Metaballs', 'fields', 'Two moving energy fields that merge into one electric surface.', legacyProgram('Metaballs', 'big')],
	['Heart', 'design', 'A beating heart with directional color, edge light, and a moving highlight.', legacyProgram('Heart', 'big')],
	['Clouds', 'weather', 'A complete turbulent cloud system assembled from five layered fields.', legacyProgram('Clouds', 'big')],
	['Flame', '3D', 'A fully raymarched flame shaped by rising 3D noise and accumulated glow.', legacyProgram('Flame', 'big')],
	['Fractal', '3D', 'A fully raymarched repeated fractal world.', legacyProgram('Fractal', 'big')],
	['Clock', 'time', 'A complete working clock with minute marks, three hands, ticking seconds, and a shaded center.', legacyProgram('Clock', 'big')]
].map(([name, dim, tagline, program]) => ({
	name,
	dim,
	section: 'showcase',
	tagline,
	tiers: [
		{
			label: 'remix',
			teaches: 'A finished piece to open, trace, and make your own.',
			program
		}
	]
}));

export const families = [
	colorCourse,
	patternCourse,
	textureCourse,
	shapeCourse,
	motionCourse,
	polarCourse,
	repeatCourse,
	...advancedCourses,
	...showcase
];

/** "Start fresh": return to the smallest possible recipe. */
export const freshProgram = {
	steps: [],
	color: col('#312e81')
};

export const potionSlug = (s) => s.toLowerCase().replace(/\s+/g, '-');

export function potionPath(familyName, tierLabel) {
	return `/p/${potionSlug(familyName)}/${potionSlug(tierLabel)}`;
}

export function findPotion(familySlug, tierSlug) {
	for (const family of families) {
		if (potionSlug(family.name) !== familySlug) continue;
		const tier = family.tiers.find((t) => potionSlug(t.label) === tierSlug);
		if (tier) return { family, tier };
	}
	return null;
}

/** Every family/tier pair — used to prerender potion routes. */
export function potionEntries() {
	return families.flatMap((family) =>
		family.tiers.map((tier) => ({
			family: potionSlug(family.name),
			tier: potionSlug(tier.label)
		}))
	);
}
