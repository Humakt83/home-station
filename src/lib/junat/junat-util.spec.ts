import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ResponseTimeTableRow } from './junat-types';
import { isLegitDeparture, determineDestination } from './junat-util';

describe('junat-util', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('isLegitDeparture', () => {
		it('returns true for valid departure from JP station', () => {
			const futureTime = new Date(Date.now() + 3600000).toISOString();
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'JP',
				type: 'DEPARTURE',
				scheduledTime: futureTime,
				liveEstimateTime: futureTime
			};

			expect(isLegitDeparture(row)).toBe(true);
		});

		it('returns false when trainStopping is false', () => {
			const futureTime = new Date(Date.now() + 3600000).toISOString();
			const row: ResponseTimeTableRow = {
				trainStopping: false,
				stationShortCode: 'JP',
				type: 'DEPARTURE',
				scheduledTime: futureTime,
				liveEstimateTime: futureTime
			};

			expect(isLegitDeparture(row)).toBe(false);
		});

		it('returns false when station is not JP', () => {
			const futureTime = new Date(Date.now() + 3600000).toISOString();
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'HKI',
				type: 'DEPARTURE',
				scheduledTime: futureTime,
				liveEstimateTime: futureTime
			};

			expect(isLegitDeparture(row)).toBe(false);
		});

		it('returns false when type is not DEPARTURE', () => {
			const futureTime = new Date(Date.now() + 3600000).toISOString();
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'JP',
				type: 'ARRIVAL',
				scheduledTime: futureTime,
				liveEstimateTime: futureTime
			};

			expect(isLegitDeparture(row)).toBe(false);
		});

		it('returns false when scheduled time is in the past', () => {
			const pastTime = new Date(Date.now() - 3600000).toISOString();
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'JP',
				type: 'DEPARTURE',
				scheduledTime: pastTime,
				liveEstimateTime: pastTime
			};

			expect(isLegitDeparture(row)).toBe(false);
		});
	});

	describe('determineDestination', () => {
		it('returns Helsinki for HKI station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'HKI',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('Helsinki');
		});

		it('returns Riihimäki for RI station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'RI',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('Riihimäki');
		});

		it('returns Tampere for TPE station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'TPE',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('Tampere');
		});

		it('returns Toijala for TL station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'TL',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('Toijala');
		});

		it('returns empty string for unknown station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: 'UNKNOWN',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('');
		});

		it('returns empty string for empty station code', () => {
			const row: ResponseTimeTableRow = {
				trainStopping: true,
				stationShortCode: '',
				type: 'DEPARTURE',
				scheduledTime: new Date().toISOString(),
				liveEstimateTime: new Date().toISOString()
			};

			expect(determineDestination(row)).toBe('');
		});
	});
});
