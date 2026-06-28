import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getActiveReminders } from './reminder.service.js';

describe('getActiveReminders', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns monthly reminders when the day matches', () => {
		vi.setSystemTime(new Date(2024, 0, 10)); // Jan 10 — aquarium day
		const reminders = getActiveReminders();
		expect(reminders.some((r) => r.id === 'aquarium-maintenance')).toBe(true);
	});

	it('returns yearly reminders when the month matches', () => {
		vi.setSystemTime(new Date(2024, 8, 1)); // September — nuohooja month
		const reminders = getActiveReminders();
		expect(reminders.some((r) => r.id === 'nuohooja')).toBe(true);
	});

	it('does not return yearly reminders when the month does not match', () => {
		vi.setSystemTime(new Date(2024, 0, 1)); // January — not nuohooja month
		const reminders = getActiveReminders();
		expect(reminders.some((r) => r.id === 'nuohooja')).toBe(false);
	});

	it('does not return monthly reminders when the day does not match', () => {
		vi.setSystemTime(new Date(2024, 0, 11)); // Jan 11 — not aquarium day
		const reminders = getActiveReminders();
		expect(reminders.some((r) => r.id === 'aquarium-maintenance')).toBe(false);
	});

	it('returns multiple reminders when several match on the same date', () => {
		vi.setSystemTime(new Date(2024, 9, 2)); // October 2 — rannit (month 10) + heating (day 2)
		const reminders = getActiveReminders();
		expect(reminders.some((r) => r.id === 'rannit')).toBe(true);
		expect(reminders.some((r) => r.id === 'heating')).toBe(true);
	});

	it('returns empty array when nothing matches', () => {
		vi.setSystemTime(new Date(2024, 5, 15)); // June 15 — no reminders
		const reminders = getActiveReminders();
		expect(reminders).toHaveLength(0);
	});

	it('returns all reminders with the correct shape', () => {
		vi.setSystemTime(new Date(2024, 3, 2)); // April 2 — taxes (month 4) + heating (day 2)
		const reminders = getActiveReminders();
		for (const reminder of reminders) {
			expect(reminder).toHaveProperty('id');
			expect(reminder).toHaveProperty('message');
			expect(reminder).toHaveProperty('occurs');
			expect(reminder).toHaveProperty('when');
		}
	});
});
