<script>
	// Live WebGL preview: renders a fullscreen quad with the given fragment
	// shader source, recompiling whenever it changes. If a compile ever
	// fails (it shouldn't, by construction), the last good shader keeps
	// running.
	import { clockFractions, adaptPrecision } from './recipe/uniforms.js';
	import { shaderTime } from './recipe/playclock.js';

	let { source } = $props();

	let canvas;
	let gl = null;
	let program = null;
	let timeLoc = null;
	let resLoc = null;
	let clockLoc = null;

	const VERTEX_SRC = `attribute vec2 a_pos;
void main() {
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

	function compileShader(type, src) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const log = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(log ?? 'shader compile failed');
		}
		return shader;
	}

	function buildProgram(fragSrc) {
		const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SRC);
		const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
		const prog = gl.createProgram();
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			const log = gl.getProgramInfoLog(prog);
			gl.deleteProgram(prog);
			throw new Error(log ?? 'program link failed');
		}
		return prog;
	}

	function useShader(fragSrc) {
		if (!gl || !fragSrc) return;
		try {
			const next = buildProgram(adaptPrecision(gl, fragSrc));
			if (program) gl.deleteProgram(program);
			program = next;
			gl.useProgram(program);
			timeLoc = gl.getUniformLocation(program, 'u_time');
			resLoc = gl.getUniformLocation(program, 'u_resolution');
			clockLoc = gl.getUniformLocation(program, 'u_clock');
			const posLoc = gl.getAttribLocation(program, 'a_pos');
			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
		} catch (err) {
			console.warn('ShaderBox: shader compile failed, keeping previous one.\n', err, fragSrc);
		}
	}

	$effect(() => {
		gl = canvas.getContext('webgl', { antialias: false });
		if (!gl) return;

		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW
		);

		const resize = () => {
			const size = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
			if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
				canvas.width = size;
				canvas.height = size;
			}
		};
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		resize();

		let raf;
		const frame = () => {
			raf = requestAnimationFrame(frame);
			if (!program) return;
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform1f(timeLoc, shaderTime());
			gl.uniform2f(resLoc, canvas.width, canvas.height);
			if (clockLoc) gl.uniform3f(clockLoc, ...clockFractions());
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			observer.disconnect();
		};
	});

	$effect(() => {
		useShader(source);
	});
</script>

<canvas bind:this={canvas} class="block h-full w-full"></canvas>
