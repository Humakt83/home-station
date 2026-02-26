<script lang="ts">
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let drawing = false;

	function startDrawing(event: MouseEvent | TouchEvent) {
		drawing = true;
		const pos = getPos(event);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
		console.debug('Start drawing');
	}

	function draw(event: MouseEvent | TouchEvent) {
		if (!drawing) return;
		const pos = getPos(event);
		ctx.lineWidth = 5;
		ctx.lineTo(pos.x, pos.y);
		ctx.strokeStyle = 'black';
		ctx.stroke();
	}

	function stopDrawing() {
		drawing = false;
		ctx.closePath();
		console.debug('Stopped drawing');
	}

	function getPos(e: MouseEvent | TouchEvent) {
		const rect = canvas.getBoundingClientRect();
		let x: number, y: number;
		if (e instanceof MouseEvent) {
			x = e.clientX - rect.left;
			y = e.clientY - rect.top;
		} else {
			const touch = e.touches[0] || e.changedTouches[0];
			x = touch.clientX - rect.left;
			y = touch.clientY - rect.top;
		}
		return { x, y };
	}

	function resizeCanvas() {
		// capture existing drawing
		const rect = canvas.getBoundingClientRect();
		const temp = document.createElement('canvas');
		temp.width = canvas.width;
		temp.height = canvas.height;
		const tmpCtx = temp.getContext('2d');
		if (tmpCtx) tmpCtx.drawImage(canvas, 0, 0);

		// resize to new display dimensions
		canvas.width = rect.width;
		canvas.height = rect.height;

		// restore previous drawing
		if (ctx) ctx.drawImage(temp, 0, 0);
	}

	onMount(() => {
		const canv = canvas.getContext('2d');
		if (canv) {
			ctx = canv;
			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);
		}
	});
</script>

<div class="note">
	<canvas
		bind:this={canvas}
		on:mousedown={startDrawing}
		on:mousemove={draw}
		on:mouseup={stopDrawing}
		on:mouseout={stopDrawing}
		on:blur={stopDrawing}
		on:touchstart|preventDefault={startDrawing}
		on:touchmove|preventDefault={draw}
		on:touchend|preventDefault={stopDrawing}
	></canvas>
</div>

<style>
	.note {
		border: 3px solid #ccc;
		width: 100%;
		height: 400px;
	}
	canvas {
		touch-action: none;
		width: 100%;
		height: 400px;
	}
</style>
