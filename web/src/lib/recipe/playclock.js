// The one clock every preview reads. Pausing freezes u_time everywhere
// at once; resuming continues from the same moment with no jump.

let paused = false;
let origin = 0;
let frozen = 0;

export function shaderTime() {
	return (paused ? frozen : performance.now() - origin) / 1000;
}

export function setPaused(p) {
	if (p === paused) return;
	if (p) frozen = performance.now() - origin;
	else origin = performance.now() - frozen;
	paused = p;
}
