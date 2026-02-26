import type { CityLocation, Weather } from './weather-types';

/**
 * Calculate apparent temperature (feels like) in Celsius
 * Uses wind chill for cold temperatures (< 10°C) and heat index for warm temperatures (> 26°C)
 * @param temperature - Temperature in Celsius
 * @param humidity - Relative humidity as percentage (0-100)
 * @param windspeedms - Wind speed in m/s
 * @returns Apparent temperature in Celsius
 */
export function apparentTemperature(
	temperature: number,
	humidity: number,
	windspeedms: number
): number {
	// Wind chill formula (valid for T < 10°C)
	// WC = 13.12 + 0.6215*T - 11.37*(V^0.16) + 0.3965*T*(V^0.16)
	// where V is wind speed in km/h
	if (temperature < 10) {
		const windspeedkmh = windspeedms * 3.6;
		const windFactor = Math.pow(windspeedkmh, 0.16);
		return 13.12 + 0.6215 * temperature - 11.37 * windFactor + 0.3965 * temperature * windFactor;
	}

	// Heat index formula (valid for T > 26°C and RH > 40%)
	// HI = -42.379 + 2.04901523*T + 10.14333127*RH - 0.22475541*T*RH - 0.00683783*T^2 - 0.05481717*RH^2 + 0.00122874*T^2*RH + 0.00085282*T*RH^2 - 0.00000199*T^2*RH^2
	if (temperature > 26 && humidity > 40) {
		const T = temperature;
		const RH = humidity;
		const c1 = -42.379;
		const c2 = 2.04901523;
		const c3 = 10.14333127;
		const c4 = -0.22475541;
		const c5 = -0.00683783;
		const c6 = -0.05481717;
		const c7 = 0.00122874;
		const c8 = 0.00085282;
		const c9 = -0.00000199;

		return (
			c1 +
			c2 * T +
			c3 * RH +
			c4 * T * RH +
			c5 * T * T +
			c6 * RH * RH +
			c7 * T * T * RH +
			c8 * T * RH * RH +
			c9 * T * T * RH * RH
		);
	}

	// For moderate temperatures, return actual temperature
	return temperature;
}

export async function fetchWeather(location: CityLocation): Promise<Weather> {
	const url = `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::multipointcoverage&place=${location.city}&parameters=temperature,weathersymbol3,humidity,windspeedms`;
	const res = await fetch(url);
	let temperature: number | null = null;
	let feelsLike: number | null = null;
	let conditionEmoji: string = '';
	let conditionLabel: string = '';

	if (!res.ok) throw new Error(`FMI API error: ${res.status}`);

	const xmlText = await res.text();
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

	if (xmlDoc.documentElement.tagName === 'parsererror') {
		throw new Error('Failed to parse FMI response');
	}

	// Extract temperature from the first data tuple
	// The selector needs to handle namespaces
	const valueElement =
		xmlDoc.querySelector('[*|doubleOrNilReasonTupleList]') ||
		xmlDoc.querySelector('doubleOrNilReasonTupleList');
	const values = valueElement?.textContent || '';
	const tuples = values.trim().split('\n').filter(Boolean);

	if (tuples.length === 0) {
		throw new Error('No weather data available from FMI');
	}

	// FMI returns multiple parameters per timestamp. The order is defined in parameters.
	// With temperature,weathersymbol3 the tuple order is: temperature weathersymbol3
	console.log(tuples[0]);
	const firstTuple = tuples[0].trim().split(/\s+/);
	if (firstTuple.length >= 2) {
		temperature = parseFloat(firstTuple[0]);
		const weatherSymbol = parseInt(firstTuple[1], 10);
		const humidity = parseFloat(firstTuple[2]);
		const windspeedms = parseFloat(firstTuple[3]);
		feelsLike = apparentTemperature(temperature, humidity, windspeedms);

		// Map weather symbol to emoji and label
		// FMI weather symbols: 1=clear, 2=partly cloudy, 3=cloudy
		// 31-33=rain, 41-53=snow, 61-64=thunderstorm, 71-83=sleet, 91-92=fog
		function mapWeatherSymbol(symbol: number) {
			if (symbol === 1) return { emoji: '☀️', label: 'Sunny' };
			if (symbol === 2 || symbol === 3) return { emoji: '☁️', label: 'Cloudy' };
			if (symbol >= 31 && symbol <= 33) return { emoji: '🌧️', label: 'Raining' };
			if (symbol >= 41 && symbol <= 53) return { emoji: '❄️', label: 'Snowing' };
			if (symbol >= 61 && symbol <= 64) return { emoji: '⛈️', label: 'Thunderstorm' };
			if (symbol >= 71 && symbol <= 83) return { emoji: '🌨️', label: 'Sleet' };
			if (symbol >= 91 && symbol <= 92) return { emoji: '🌫️', label: 'Fog' };
			return { emoji: '☁️', label: 'Cloudy' };
		}

		const result = mapWeatherSymbol(weatherSymbol);
		conditionEmoji = result.emoji;
		conditionLabel = result.label;
	}

	return { location, temperature, feelsLike, conditionEmoji, conditionLabel };
}
