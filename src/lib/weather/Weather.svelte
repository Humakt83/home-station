<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { LOCATIONS, type Weather } from './weather-types';
	import { fetchWeather } from './weather-service';

	let weathers: Array<Weather> = [];
	let loading = true;
	let refreshTimer: number | null = null;

	onMount(async () => {
		weathers = await Promise.all(LOCATIONS.map((loc) => fetchWeather(loc)));
		loading = false;

		// Refresh weather data every hour
		refreshTimer = window.setInterval(
			async () => {
				try {
					weathers = await Promise.all(LOCATIONS.map((loc) => fetchWeather(loc)));
				} catch (e) {
					console.error('Hourly refresh failed', e);
				}
			},
			60 * 60 * 1000
		);
	});

	onDestroy(() => {
		if (refreshTimer !== null) window.clearInterval(refreshTimer);
	});
</script>

<div class="weather">
	{#if loading}
		<div>Ladataan säätietoja…</div>
	{:else}
		{#each weathers as weather (weather.location.city)}
			<div class="city">
				<div class="loc">{weather.location.city}</div>
				{#if weather.temperature}
					<div class="temp">{Math.round(weather.temperature)} °C</div>
				{/if}
				{#if typeof weather.feelsLike === 'number'}
					<div class="feels">Tuntuu kuin {Math.round(weather.feelsLike)} °C</div>
				{/if}
				{#if weather.conditionEmoji}
					<div class="cond">{weather.conditionEmoji} <span class="cond-label">{weather.conditionLabel}</span></div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	.weather {
		grid-area: weather;
		display: flex;
		flex-direction: row;
		column-gap: 2rem;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			Arial;
		padding: 0.5rem 1rem;
		background: lightskyblue;
		height: 20vh;
	}

	.temp {
		font-size: 1.5rem;
		font-weight: 600;
	}
	.feels {
		font-size: 0.85rem;
	}
	.cond {
		font-size: 2rem;
		margin-top: 0.25rem;
		.cond-label {
			vertical-align: middle;
			font-size: 0.85rem;	
		}
	}
	.loc {
		font-size: 1.5rem;
	}
</style>
