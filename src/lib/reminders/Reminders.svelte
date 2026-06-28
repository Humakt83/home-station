<script lang="ts">
	import { onMount } from 'svelte';
	import type { Reminder } from './reminder-types';
	import { subscribeToReminders } from './reminder-service';

	let reminders: Reminder[] = [];

	function close(id: string) {
		reminders = reminders.filter((r) => r.id !== id);
	}

	onMount(() => {
		return subscribeToReminders((r) => (reminders = r));
	});
</script>

<div class="reminder-container">
	{#each reminders as r (r.id)}
		<div class="reminder">
			<p>{r.message}</p>
			<button class="close" on:click={() => close(r.id)} aria-label="Close reminder">×</button>
		</div>
	{/each}
</div>

<style>
	.reminder-container {
		display: flex;
		justify-content: start;
		column-gap: 1rem;
		align-items: center;
		grid-area: reminder;
		height: 25vh;
		padding-left: 1rem;
		background-color: lightseagreen;
		overflow: hidden;
		overflow-x: auto;
	}

	.reminder {
		border: 1px solid #ccc;
		padding: 0.5rem 0.75rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: row;
		column-gap: 0.15rem;
		background-color: white;
	}

	@media only screen and (max-width: 800px) {
	}

	.close {
		background: transparent;
		border: none;
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
	}
</style>
