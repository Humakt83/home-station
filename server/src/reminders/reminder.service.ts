import { REMINDERS, type Reminder } from './reminder-types.js';

export function getActiveReminders(): Array<Reminder> {
	const now = new Date();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	return REMINDERS.filter((reminder) => {
		if (reminder.occurs === 'YEARLY') return reminder.when === month;
		if (reminder.occurs === 'MONTHLY') return reminder.when === day;
		return false;
	});
}
