<script lang="ts">
	import { onMount } from 'svelte';

	type Location = {
		lat: number, lon: number, location: string
	}

	type Weather = {
		location: Location,
		temperature: number | null,
		feelsLike: number | null,
		conditionEmoji: string | null,
		conditionLabel: string | null
	}

	const LOCATIONS: Array<Location> = [{lat: 60.1699, lon: 24.9384, location: 'Järvenpää'}, {lat: 60.1708, lon: 24.9375, location: 'Helsinki'}];
	
	const weathers: Array<Weather> = [];
	let loading = true;
	let error = '';

	async function fetchWeather(location: Location) {
		try {
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&hourly=apparent_temperature&timezone=auto`;
			const res = await fetch(url);
			let temperature: number | null = null;
			let feelsLike: number | null = null;
			let conditionEmoji: string = '';
			let conditionLabel: string = '';
			if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
			const data = await res.json();
			if (data && data.current_weather && typeof data.current_weather.temperature !== 'undefined') {
				temperature = data.current_weather.temperature;

				// Try to extract apparent temperature (feels like) from hourly data
				if (
					data.hourly &&
					Array.isArray(data.hourly.time) &&
					Array.isArray(data.hourly.apparent_temperature)
				) {
					const currentTime = data.current_weather.time;
					let idx = data.hourly.time.indexOf(currentTime);
					if (idx === -1) {
						// fallback: find nearest timestamp
						const times = data.hourly.time.map((t) => new Date(t).getTime());
						const target = new Date(currentTime).getTime();
						let best = 0;
						let bestDiff = Infinity;
						for (let i = 0; i < times.length; i++) {
							const diff = Math.abs(times[i] - target);
							if (diff < bestDiff) {
								bestDiff = diff;
								best = i;
							}
						}
						idx = best;
					}

					const apparent = data.hourly.apparent_temperature[idx];
					if (typeof apparent !== 'undefined') {
						feelsLike = apparent;
					}
				}

				// Map Open-Meteo weathercode to a simple condition emoji and label
				if (data.current_weather && typeof data.current_weather.weathercode !== 'undefined') {
					const code: number = data.current_weather.weathercode;
					function mapCode(c: number) {
						// Snow: 71-77, 85-86
						if ((c >= 71 && c <= 77) || c === 85 || c === 86)
							return { emoji: '❄️', label: 'Snowing' };
						// Rain/drizzle/showers/thunder: 51-67, 80-82, 95-99
						if (
							(c >= 51 && c <= 57) ||
							(c >= 61 && c <= 67) ||
							(c >= 80 && c <= 82) ||
							(c >= 95 && c <= 99)
						)
							return { emoji: '🌧️', label: 'Raining' };
						// Clear
						if (c === 0) return { emoji: '☀️', label: 'Sunny' };
						// Default to cloudy for other codes
						return { emoji: '☁️', label: 'Cloudy' };
					}

					const result = mapCode(code);
					conditionEmoji = result.emoji;
					conditionLabel = result.label;
				}
			} else {
				throw new Error('No current weather available');
			}
			weathers.push({location, temperature, feelsLike, conditionEmoji, conditionLabel});
			console.log(weathers);
		} catch (e) {
			error = e.message || String(e);
		}
	}

	onMount(async () => {
		await Promise.all(LOCATIONS.map(loc => fetchWeather(loc)));
		loading = false;
	});
</script>

<div class="weather">
	{#if loading}
		<div>Loading weather data…</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else }
		{#each weathers as weather}
			{#if weather.temperature}
			<div class="temp">{Math.round(weather.temperature)} °C</div>
			{/if}
			{#if typeof weather.feelsLike === 'number'}
				<div class="feels">Feels like {Math.round(weather.feelsLike)} °C</div>
			{/if}
			{#if weather.conditionEmoji}
				<div class="cond">{weather.conditionEmoji} {weather.conditionLabel}</div>
			{/if}
			<div class="loc">{weather.location.location}</div>
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
	.error {
		color: #b00020;
	}
	.loc {
		font-size: 0.85rem;
		color: #666;
	}
</style>
