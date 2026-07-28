/**
 * Where the real clock's hands point, each as 0..1 of a full turn.
 * Seconds include milliseconds so the hand sweeps smoothly.
 */
export function clockFractions() {
	const d = new Date();
	const s = d.getSeconds() + d.getMilliseconds() / 1000;
	const m = d.getMinutes() + s / 60;
	const h = (d.getHours() % 12) + m / 60;
	return [h / 12, m / 60, s / 60];
}

/**
 * Shaders are emitted with highp (thin clock hands need the precision),
 * but some older GPUs only do mediump in fragment shaders.
 */
export function adaptPrecision(gl, source) {
	const format = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
	if (format && format.precision > 0) return source;
	return source.replace('precision highp float;', 'precision mediump float;');
}
