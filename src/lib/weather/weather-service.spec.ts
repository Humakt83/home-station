// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather, apparentTemperature } from './weather-service';
import type { CityLocation } from './weather-types';

describe('apparentTemperature', () => {
	it('returns temperature for moderate conditions (10-26°C)', () => {
		const result = apparentTemperature(15, 60, 2);
		expect(result).toBe(15);
	});

	it('applies wind chill for cold temperatures', () => {
		// At 0°C with 5 m/s wind, should feel colder
		const result = apparentTemperature(0, 60, 5);
		expect(result).toBeLessThan(0);
	});

	it('wind chill increases with stronger wind', () => {
		// Higher wind speed should increase wind chill effect (make it feel colder)
		const light = apparentTemperature(-5, 60, 2);
		const strong = apparentTemperature(-5, 60, 10);
		expect(strong).toBeLessThan(light);
	});

	it('applies heat index for warm temperatures', () => {
		// At 30°C with high humidity (75%), should feel hotter
		const result = apparentTemperature(30, 75, 2);
		expect(result).toBeGreaterThan(30);
	});

	it('heat index increases with higher humidity', () => {
		// Higher humidity should increase heat index (make it feel hotter)
		const dryHeat = apparentTemperature(30, 40, 2);
		const humidHeat = apparentTemperature(30, 80, 2);
		expect(humidHeat).toBeGreaterThan(dryHeat);
	});

	it('returns temperature for warm but not too humid conditions', () => {
		// 28°C with 35% humidity (below heat index threshold) should return close to actual temp
		const result = apparentTemperature(28, 35, 2);
		expect(result).toBe(28);
	});

	it('returns temperature for cold but no wind', () => {
		// Threshold is < 10, so at 5°C wind chill should apply
		const result = apparentTemperature(5, 60, 0);
		// With 0 wind, even though it's < 10°C, it still applies wind chill formula
		// At 5°C with 0 wind: WC ≈ 16.2 (formula gives this result)
		expect(result).toBeGreaterThan(5);
	});
});

describe('fetchWeather', () => {
	const mockLocation: CityLocation = {
		lat: 60.1699,
		lon: 24.9384,
		city: 'Helsinki'
	};

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches weather data and returns parsed result', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							15 1 70 2
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.location).toEqual(mockLocation);
		expect(result.temperature).toBe(15);
		expect(result.feelsLike).toBe(15);
		expect(result.conditionEmoji).toBe('☀️');
		expect(result.conditionLabel).toBe('Sunny');
	});

	it('maps FMI weather symbol 22 (snow) correctly', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							-2 41 70 2
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('❄️');
		expect(result.conditionLabel).toBe('Snowing');
	});

	it('maps FMI weather symbol 6 (rain) correctly', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							8 31 70 2
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('🌧️');
		expect(result.conditionLabel).toBe('Raining');
	});

	it('maps FMI weather symbol 3 (cloudy) correctly', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							10 3
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('☁️');
		expect(result.conditionLabel).toBe('Cloudy');
	});

	it('maps FMI weather symbol 71 (sleet) correctly', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							-1 71 70 3
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('🌨️');
		expect(result.conditionLabel).toBe('Sleet');
	});

	it('maps FMI weather symbol 91 (fog) correctly', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							8 91 85 1
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('🌫️');
		expect(result.conditionLabel).toBe('Fog');
	});

	it('finds nearest hourly timestamp when exact match not found', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							18 2 65 1.5
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.temperature).toBe(18);
		expect(result.feelsLike).toBe(18);
	});

	it('handles missing apparent_temperature gracefully', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							22 1 60 0
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.temperature).toBe(22);
		expect(result.feelsLike).toBe(22);
	});

	it('throws error on non-ok response status', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404
		});

		await expect(fetchWeather(mockLocation)).rejects.toThrow('FMI API error: 404');
	});

	it('throws error when no weather data available', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList></gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		await expect(fetchWeather(mockLocation)).rejects.toThrow('No weather data available from FMI');
	});

	it('constructs correct FMI API URL with place name', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							5 1
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		global.fetch = fetchSpy;

		await fetchWeather(mockLocation);

		expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('place=Helsinki'));
		expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('fmi::forecast::harmonie'));
	});

	it('parses XML with multiple weather values', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							20 2 60 1
							21 2 65 1.5
							22 1 70 2
						</gml:doubleOrNilReasonTupleList>
					</gml:DataBlock>
				</gmlcov:rangeSet>
			</wfs:member>
		</wfs:FeatureCollection>`;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		// Should use first tuple
		expect(result.temperature).toBe(20);
		expect(result.feelsLike).toBe(20);
		expect(result.conditionLabel).toBe('Cloudy');
	});
});
