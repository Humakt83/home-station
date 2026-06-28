import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getActiveReminders, getUnsentReminders, removeClient } from './reminder.service.js';

describe('getActiveReminders', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('returns monthly reminders when the day matches', () => {
		vi.setSystemTime(new Date(2024, 0, 10)); // Jan 10 — aquarium day
		expect(getActiveReminders().some((r) => r.id === 'aquarium-maintenance')).toBe(true);
	});

	it('returns yearly reminders when the month matches', () => {
		vi.setSystemTime(new Date(2024, 8, 1)); // September — nuohooja month
		expect(getActiveReminders().some((r) => r.id === 'nuohooja')).toBe(true);
	});

	it('does not return yearly reminders when the month does not match', () => {
		vi.setSystemTime(new Date(2024, 0, 1)); // January — not nuohooja month
		expect(getActiveReminders().some((r) => r.id === 'nuohooja')).toBe(false);
	});

	it('does not return monthly reminders when the day does not match', () => {
		vi.setSystemTime(new Date(2024, 0, 11)); // Jan 11 — not aquarium day
		expect(getActiveReminders().some((r) => r.id === 'aquarium-maintenance')).toBe(false);
	});

	it('returns multiple reminders when several match on the same date', () => {
		vi.setSystemTime(new Date(2024, 9, 2)); // October 2 — rannit (month 10) + heating (day 2)
		expect(getActiveReminders().some((r) => r.id === 'rannit')).toBe(true);
		expect(getActiveReminders().some((r) => r.id === 'heating')).toBe(true);
	});

	it('returns empty array when nothing matches', () => {
		vi.setSystemTime(new Date(2024, 5, 15)); // June 15 — no reminders
		expect(getActiveReminders()).toHaveLength(0);
	});

	it('returns all reminders with the correct shape', () => {
		vi.setSystemTime(new Date(2024, 3, 2)); // April 2 — taxes (month 4) + heating (day 2)
		for (const reminder of getActiveReminders()) {
			expect(reminder).toHaveProperty('id');
			expect(reminder).toHaveProperty('message');
			expect(reminder).toHaveProperty('occurs');
			expect(reminder).toHaveProperty('when');
		}
	});
});

describe('getUnsentReminders', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('returns active reminders on first call for a client', () => {
		vi.setSystemTime(new Date(2024, 0, 10)); // Jan 10 — aquarium day
		const client = {};
		const result = getUnsentReminders(client);
		expect(result.some((r) => r.id === 'aquarium-maintenance')).toBe(true);
		removeClient(client);
	});

	it('returns nothing on a second call within the same period', () => {
		vi.setSystemTime(new Date(2024, 0, 10));
		const client = {};
		getUnsentReminders(client);
		expect(getUnsentReminders(client)).toHaveLength(0);
		removeClient(client);
	});

	it('resends a monthly reminder when the day advances to the next occurrence', () => {
		const client = {};
		vi.setSystemTime(new Date(2024, 0, 10)); // first occurrence
		expect(getUnsentReminders(client).some((r) => r.id === 'aquarium-maintenance')).toBe(true);

		vi.setSystemTime(new Date(2024, 1, 10)); // next month, same day
		const result = getUnsentReminders(client);
		expect(result.some((r) => r.id === 'aquarium-maintenance')).toBe(true);
		removeClient(client);
	});

	it('resends a yearly reminder when the month advances to the next occurrence', () => {
		const client = {};
		vi.setSystemTime(new Date(2024, 8, 1)); // September 2024
		getUnsentReminders(client);

		vi.setSystemTime(new Date(2025, 8, 1)); // September 2025
		const result = getUnsentReminders(client);
		expect(result.some((r) => r.id === 'nuohooja')).toBe(true);
		removeClient(client);
	});

	it('resends reminders to a client after removeClient is called', () => {
		vi.setSystemTime(new Date(2024, 0, 10));
		const client = {};
		getUnsentReminders(client);
		removeClient(client);

		const result = getUnsentReminders(client);
		expect(result.some((r) => r.id === 'aquarium-maintenance')).toBe(true);
		removeClient(client);
	});

	it('tracks state independently per client', () => {
		vi.setSystemTime(new Date(2024, 0, 10));
		const clientA = {};
		const clientB = {};
		getUnsentReminders(clientA);

		// clientB has not been seen yet — should still get the reminder
		const result = getUnsentReminders(clientB);
		expect(result.some((r) => r.id === 'aquarium-maintenance')).toBe(true);

		removeClient(clientA);
		removeClient(clientB);
	});
});
