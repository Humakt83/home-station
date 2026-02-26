import type { CityLocation, Weather } from './weather-types';

export async function fetchWeather(location: CityLocation): Promise<Weather> {
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
				if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { emoji: '❄️', label: 'Snowing' };
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
	return { location, temperature, feelsLike, conditionEmoji, conditionLabel };
}
