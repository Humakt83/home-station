// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from './weather-service';
import type { CityLocation } from './weather-types';

describe('fetchWeather', () => {
	const mockLocation: CityLocation = {
		lat: 60.1699,
		lon: 24.9384,
		city: 'Järvenpää'
	};

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches weather data and returns parsed result', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 5.2,
				weathercode: 0,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [3.5]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.location).toEqual(mockLocation);
		expect(result.temperature).toBe(5.2);
		expect(result.feelsLike).toBe(3.5);
		expect(result.conditionEmoji).toBe('☀️');
		expect(result.conditionLabel).toBe('Sunny');
	});

	it('maps weathercode 71 (snow) correctly', async () => {
		const mockResponse = {
			current_weather: {
				temperature: -2,
				weathercode: 71,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [-5]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('❄️');
		expect(result.conditionLabel).toBe('Snowing');
	});

	it('maps weathercode 61 (rain) correctly', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 8,
				weathercode: 61,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [6]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('🌧️');
		expect(result.conditionLabel).toBe('Raining');
	});

	it('maps unknown weathercode to cloudy', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 10,
				weathercode: 2,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [9]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.conditionEmoji).toBe('☁️');
		expect(result.conditionLabel).toBe('Cloudy');
	});

	it('finds nearest hourly timestamp when exact match not found', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 5,
				weathercode: 0,
				time: '2026-02-26T12:30' // Not exact match
			},
			hourly: {
				time: ['2026-02-26T12:00', '2026-02-26T13:00'],
				apparent_temperature: [3, 4]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		// 12:30 is closer to 12:00, so should use index 0
		expect(result.feelsLike).toBe(3);
	});

	it('handles missing apparent_temperature gracefully', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 5,
				weathercode: 0,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [undefined]
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.temperature).toBe(5);
		expect(result.feelsLike).toBeNull();
	});

	it('throws error on non-ok response status', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404
		});

		await expect(fetchWeather(mockLocation)).rejects.toThrow('Weather API error: 404');
	});

	it('throws error when no current weather available', async () => {
		const mockResponse = {
			current_weather: null
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		await expect(fetchWeather(mockLocation)).rejects.toThrow('No current weather available');
	});

	it('constructs correct API URL with location coordinates', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 5,
				weathercode: 0,
				time: '2026-02-26T12:00'
			},
			hourly: {
				time: ['2026-02-26T12:00'],
				apparent_temperature: [3]
			}
		};

		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		global.fetch = fetchSpy;

		await fetchWeather(mockLocation);

		expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('latitude=60.1699'));
		expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('longitude=24.9384'));
	});

	it('handles missing hourly data', async () => {
		const mockResponse = {
			current_weather: {
				temperature: 5,
				weathercode: 0,
				time: '2026-02-26T12:00'
			}
		};

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mockResponse
		});

		const result = await fetchWeather(mockLocation);

		expect(result.temperature).toBe(5);
		expect(result.feelsLike).toBeNull();
	});
});
