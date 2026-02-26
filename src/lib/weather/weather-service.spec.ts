// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from './weather-service';
import type { CityLocation } from './weather-types';

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
							5.2 1
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
		expect(result.temperature).toBe(5.2);
		expect(result.feelsLike).toBe(5.2);
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
							-2 22
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
							8 6
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

	it('finds nearest hourly timestamp when exact match not found', async () => {
		const fmiXml = `<?xml version="1.0" encoding="UTF-8"?>
		<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0">
			<wfs:member>
				<gmlcov:rangeSet>
					<gml:DataBlock>
						<gml:doubleOrNilReasonTupleList>
							3.5 2
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

		expect(result.temperature).toBe(3.5);
		expect(result.feelsLike).toBe(3.5);
	});

	it('handles missing apparent_temperature gracefully', async () => {
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

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => fmiXml
		});

		const result = await fetchWeather(mockLocation);

		expect(result.temperature).toBe(5);
		expect(result.feelsLike).toBe(5);
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
							3.5 2
							4.1 2
							5.0 1
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
		expect(result.temperature).toBe(3.5);
		expect(result.feelsLike).toBe(3.5);
		expect(result.conditionLabel).toBe('Cloudy');
	});
});
