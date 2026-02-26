/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDeparturesForStop } from './junat-service';

describe('junat-service', () => {
	describe('fetchDeparturesForStop', () => {
		beforeEach(() => {
			// Mock fetch globally
			global.fetch = vi.fn();
			vi.clearAllMocks();
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-02-20T12:00:00Z'));
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('fetches departures and returns sorted list', async () => {
			const futureTime1 = new Date(Date.now() + 600000).toISOString(); // 10 min
			const futureTime2 = new Date(Date.now() + 1200000).toISOString(); // 20 min
			const lastRowTime = new Date(Date.now() + 2000000).toISOString();

			const mockResponse = [
				{
					trainNumber: 1,
					timeTableRows: [
						{
							trainStopping: true,
							stationShortCode: 'JP',
							type: 'DEPARTURE',
							scheduledTime: futureTime1,
							liveEstimateTime: futureTime1
						},
						{
							trainStopping: true,
							stationShortCode: 'HKI',
							type: 'ARRIVAL',
							scheduledTime: lastRowTime,
							liveEstimateTime: lastRowTime
						}
					]
				},
				{
					trainNumber: 2,
					timeTableRows: [
						{
							trainStopping: true,
							stationShortCode: 'JP',
							type: 'DEPARTURE',
							scheduledTime: futureTime2,
							liveEstimateTime: futureTime2
						},
						{
							trainStopping: true,
							stationShortCode: 'TPE',
							type: 'ARRIVAL',
							scheduledTime: lastRowTime,
							liveEstimateTime: lastRowTime
						}
					]
				}
			];

			const trainData = {
				trainNumber: 1,
				commuterLineID: 'L1'
			};

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => [trainData]
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => [{ trainNumber: 2, commuterLineID: 'L2' }]
				});

			const result = await fetchDeparturesForStop();

			expect(result).toHaveLength(2);
			expect(result[0].train.trainNumber).toBe(1);
			expect(result[1].train.trainNumber).toBe(2);
			expect(result[0].destination).toBe('Helsinki');
			expect(result[1].destination).toBe('Tampere');
		});

		it('filters out non-legitimate departures', async () => {
			const futureTime = new Date(Date.now() + 600000).toISOString();
			const pastTime = new Date(Date.now() - 600000).toISOString();

			const mockResponse = [
				{
					trainNumber: 1,
					timeTableRows: [
						{
							trainStopping: true,
							stationShortCode: 'JP',
							type: 'DEPARTURE',
							scheduledTime: futureTime,
							liveEstimateTime: futureTime
						},
						{
							trainStopping: true,
							stationShortCode: 'HKI',
							type: 'ARRIVAL',
							scheduledTime: futureTime,
							liveEstimateTime: futureTime
						}
					]
				},
				{
					trainNumber: 2,
					timeTableRows: [
						{
							trainStopping: false, // Not stopping
							stationShortCode: 'JP',
							type: 'DEPARTURE',
							scheduledTime: futureTime,
							liveEstimateTime: futureTime
						},
						{
							trainStopping: true,
							stationShortCode: 'HKI',
							type: 'ARRIVAL',
							scheduledTime: futureTime,
							liveEstimateTime: futureTime
						}
					]
				},
				{
					trainNumber: 3,
					timeTableRows: [
						{
							trainStopping: true,
							stationShortCode: 'JP',
							type: 'DEPARTURE',
							scheduledTime: pastTime, // Past time
							liveEstimateTime: pastTime
						},
						{
							trainStopping: true,
							stationShortCode: 'HKI',
							type: 'ARRIVAL',
							scheduledTime: pastTime,
							liveEstimateTime: pastTime
						}
					]
				}
			];

			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => [{ trainNumber: 1, commuterLineID: 'L1' }]
				});

			const result = await fetchDeparturesForStop();

			expect(result).toHaveLength(1);
			expect(result[0].train.trainNumber).toBe(1);
		});
	});
});
