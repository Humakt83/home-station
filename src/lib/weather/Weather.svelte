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
			{#if weather.temperature}
				<div class="temp">{Math.round(weather.temperature)} °C</div>
			{/if}
			{#if typeof weather.feelsLike === 'number'}
				<div class="feels">Feels like {Math.round(weather.feelsLike)} °C</div>
			{/if}
			{#if weather.conditionEmoji}
				<div class="cond">{weather.conditionEmoji} {weather.conditionLabel}</div>
			{/if}
			<div class="loc">{weather.location.city}</div>
		{/each}
	{/if}
</div>

<style>
	.weather {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			Arial;
		padding: 0.5rem 1rem;
		background: lightskyblue;
	}
	.temp {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.feels {
		font-size: 1rem;
	}
	.cond {
		font-size: 1.25rem;
		margin-top: 0.25rem;
	}
	.loc {
		font-size: 0.85rem;
		color: #666;
	}
</style>
