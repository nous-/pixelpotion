// One shared offscreen WebGL canvas renders every step's mini preview,
// so we never run into the browser's WebGL-context limit no matter how
// many steps a kid adds. Each render is immediately copied into that
// row's little 2d canvas.

import { clockFractions, adaptPrecision } from './uniforms.js';

const SIZE = 96;
const MAX_CACHED = 64;

let shared = null;

export function thumbRenderer() {
	if (!shared) shared = create();
	return shared;
}

function create() {
	const glCanvas = document.createElement('canvas');
	glCanvas.width = SIZE;
	glCanvas.height = SIZE;
	const gl = glCanvas.getContext('webgl', { antialias: false });
	if (!gl) return { render() {} };

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	gl.viewport(0, 0, SIZE, SIZE);

	const vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }');
	gl.compileShader(vs);

	const cache = new Map();

	function programFor(source) {
		let entry = cache.get(source);
		if (entry) return entry;

		const fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, adaptPrecision(gl, source));
		gl.compileShader(fs);
		const prog = gl.createProgram();
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		gl.deleteShader(fs);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			gl.deleteProgram(prog);
			entry = null;
		} else {
			entry = {
				prog,
				timeLoc: gl.getUniformLocation(prog, 'u_time'),
				resLoc: gl.getUniformLocation(prog, 'u_resolution'),
				clockLoc: gl.getUniformLocation(prog, 'u_clock'),
				posLoc: gl.getAttribLocation(prog, 'a_pos')
			};
		}

		if (cache.size >= MAX_CACHED) {
			const [oldKey, old] = cache.entries().next().value;
			if (old?.prog) gl.deleteProgram(old.prog);
			cache.delete(oldKey);
		}
		cache.set(source, entry);
		return entry;
	}

	return {
		render(source, destCanvas, time) {
			const entry = programFor(source);
			if (!entry || !destCanvas) return;
			gl.useProgram(entry.prog);
			gl.enableVertexAttribArray(entry.posLoc);
			gl.vertexAttribPointer(entry.posLoc, 2, gl.FLOAT, false, 0, 0);
			gl.uniform1f(entry.timeLoc, time);
			gl.uniform2f(entry.resLoc, SIZE, SIZE);
			if (entry.clockLoc) gl.uniform3f(entry.clockLoc, ...clockFractions());
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			// Must copy synchronously, before the drawing buffer is cleared.
			const ctx = destCanvas.getContext('2d');
			ctx.drawImage(glCanvas, 0, 0, destCanvas.width, destCanvas.height);
		}
	};
}
