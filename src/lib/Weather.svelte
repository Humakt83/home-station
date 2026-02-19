<script lang="ts">
	import { onMount } from 'svelte';

	let loading = true;
	let error = '';
	let temperature: number | null = null; // in °C
	let feelsLike: number | null = null; // apparent temperature in °C
	let locationLabel = '';

	async function fetchWeather(lat: number, lon: number) {
		try {
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=apparent_temperature&timezone=auto`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
			const data = await res.json();
			if (data && data.current_weather && typeof data.current_weather.temperature !== 'undefined') {
				temperature = data.current_weather.temperature;
				locationLabel = data.timezone || '';

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
			} else {
				throw new Error('No current weather available');
			}
		} catch (e) {
			error = e.message || String(e);
		} finally {
			loading = false;
		}
	}

	function useFallback() {
		// Fallback to Helsinki coordinates if geolocation is unavailable/denied
		const helsinki = { lat: 60.1699, lon: 24.9384 };
		locationLabel = 'Helsinki (fallback)';
		return fetchWeather(helsinki.lat, helsinki.lon);
	}

	onMount(() => {
		if (!navigator.geolocation) {
			error = 'Geolocation not supported by this browser.';
			return useFallback();
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				fetchWeather(latitude, longitude);
			},
			(err) => {
				console.error(err);
				// If user denies, fallback
				useFallback();
			},
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	});
</script>

<div class="weather">
	{#if loading}
		<div>Loading local weather…</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else if temperature}
		<div class="temp">{Math.round(temperature)} °C</div>
		{#if typeof feelsLike === 'number'}
			<div class="feels">Feels like {Math.round(feelsLike)} °C</div>
		{/if}
		{#if locationLabel}
			<div class="loc">{locationLabel}</div>
		{/if}
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
	.error {
		color: #b00020;
	}
	.loc {
		font-size: 0.85rem;
		color: #666;
	}
</style>
