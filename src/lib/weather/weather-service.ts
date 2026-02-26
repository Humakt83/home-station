import type { CityLocation, Weather } from './weather-types';

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
	const valueElement = xmlDoc.querySelector('[*|doubleOrNilReasonTupleList]') || 
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

		// Map weather symbol to emoji and label
		// FMI weather symbols: 1=clear, 2=partly cloudy, 3=cloudy, 4=drizzle, 5=light rain, 6=rain, 7=heavy rain
		// 21=light snow, 22=snow, 23=heavy snow, 31=thunder, etc.
		function mapWeatherSymbol(symbol: number) {
			if (symbol === 1) return { emoji: '☀️', label: 'Sunny' };
			if (symbol === 2 || symbol === 3) return { emoji: '☁️', label: 'Cloudy' };
			if (symbol >= 31 && symbol <= 33) return { emoji: '🌧️', label: 'Raining' };
			if (symbol >= 41 && symbol <= 53) return { emoji: '❄️', label: 'Snowing' };
			if (symbol >= 61 && symbol <= 64) return { emoji: '⛈️', label: 'Thunderstorm' };
			return { emoji: '☁️', label: 'Cloudy' };
		}

		const result = mapWeatherSymbol(weatherSymbol);
		conditionEmoji = result.emoji;
		conditionLabel = result.label;
	}

	// FMI doesn't provide "feels like" directly, use temperature as proxy
	feelsLike = temperature;

	return { location, temperature, feelsLike, conditionEmoji, conditionLabel };
}
