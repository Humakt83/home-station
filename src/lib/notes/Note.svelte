<script lang="ts">
	import { onMount } from 'svelte';
	import type { DrawingColors } from './note-types';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let drawing = false;
	let currentColor: DrawingColors = 'black';
	const STORAGE_KEY = 'drawing_canvas';

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
		ctx.strokeStyle = currentColor;
		ctx.stroke();
	}

	function stopDrawing() {
		drawing = false;
		ctx.closePath();
		console.debug('Stopped drawing');
		saveDrawing();
	}

	function saveDrawing() {
		const imageData = canvas.toDataURL('image/png');
		localStorage.setItem(STORAGE_KEY, imageData);
		console.debug('Drawing saved to localStorage');
	}

	function loadDrawing() {
		const imageData = localStorage.getItem(STORAGE_KEY);
		if (imageData) {
			const img = new Image();
			img.onload = () => {
				ctx.drawImage(img, 0, 0);
				console.debug('Drawing loaded from localStorage');
			};
			img.src = imageData;
		}
	}

	function clearDrawing() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		saveDrawing();
	}

	function setColor(color: DrawingColors) {
		currentColor = color;
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
			loadDrawing();
			window.addEventListener('resize', resizeCanvas);
		}
	});
</script>

<div class="note">
	<div class="controls">
		<button on:click={clearDrawing}>🗑️</button>
		<button on:click={() => setColor('black')} class:active={currentColor === 'black'}>⚫</button>
		<button on:click={() => setColor('red')} class:active={currentColor === 'red'}>🔴</button>
		<button on:click={() => setColor('blue')} class:active={currentColor === 'blue'}>🔵</button>
		<button on:click={() => setColor('green')} class:active={currentColor === 'green'}>🟢</button>
	</div>
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
		display: flex;
		flex-direction: column;
	}
	.controls {
		display: flex;
		gap: 8px;
		padding: 8px;
		background: #f5f5f5;
		border-bottom: 1px solid #ddd;
	}
	button {
		padding: 6px 12px;
		border: 2px solid #ccc;
		background: white;
		cursor: pointer;
		border-radius: 4px;
		font-size: 16px;
		transition: all 0.2s;
	}
	button:hover {
		background: #f0f0f0;
	}
	button.active {
		border-color: #333;
		background: #e0e0e0;
	}
	canvas {
		touch-action: none;
		flex: 1;
	}
</style>
