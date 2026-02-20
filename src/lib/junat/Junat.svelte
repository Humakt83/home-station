<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDate } from 'date-fns';
	import type { Departure } from './junat-types';
	import { fetchDeparturesForStop } from './junat-service';

	let loading = true;
	let error: string | null = null;
	let stationName: string | null = null;
	let departures: Departure[] = [];

	onMount(async () => {
		try {
			departures = await fetchDeparturesForStop();
		} catch (e) {
			console.error(e);
			error = (e as Error).message || String(e);
		} finally {
			loading = false;
		}
	});
</script>

<div class="junat">
	<div class="title">Lähtevät Junat</div>
	{#if loading}
		<div>Loading departures…</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<h3>{stationName}</h3>
		{#if departures.length === 0}
			<div>No upcoming departures found.</div>
		{:else}
			<ul>
				{#each departures as d (d.scheduledTime)}
					<li>
						<span class="time">{formatDate(d.scheduledTime, 'HH:mm')}</span>
						<span class="train">{d.train.commuterLineID ?? ''}</span>
						<span class="destination">{d.destination ?? ''}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.junat {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			Arial;
		background: darkgreen;
		color: white;
		padding: 1rem 0.5rem;
	}
	.title {
		font-size: 1.5rem;
		font-weight: bold;
	}
	.time {
		font-weight: 600;
	}
	.train {
		background-color: white;
		color: darkgreen;
		font-weight: bold;
		padding: 0 0.5rem;
	}
	li {
		display: flex;
		flex-direction: row;
		column-gap: 1rem;
		margin: 0.25rem 0;
		font-size: 1.3rem;
		margin-bottom: 0.5rem;
	}
	li:nth-child(even) {
		background-color: rgba(255, 255, 255, 25%);
	}
	.error {
		color: #b00020;
	}
</style>
