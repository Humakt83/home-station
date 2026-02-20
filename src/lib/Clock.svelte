<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { formatDate } from 'date-fns';

	const time = writable(new Date());
	let timer: NodeJS.Timeout;

	onMount(() => {
		timer = setInterval(() => time.set(new Date()), 1000);
	});

	onDestroy(() => clearInterval(timer));
</script>

<div class="clock">
	{#if time}
		<time datetime={$time.toISOString()}>{formatDate($time, 'HH:mm:ss')}</time>
	{/if}
</div>

<style>
	.clock {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		font-size: 2.5rem;
		font-weight: 600;
		color: red;
		background: black;
		padding: 1rem 2rem;
		width: fit;
	}
</style>
