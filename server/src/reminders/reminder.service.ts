import { REMINDERS, type Reminder } from './reminder-types.js';

const clientSentMap = new Map<object, Map<string, string>>();

function occurrenceKey(reminder: Reminder, now: Date): string {
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	if (reminder.occurs === 'YEARLY') return `${year}-${month}`;
	return `${year}-${month}-${now.getDate()}`;
}

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

export function getUnsentReminders(client: object): Array<Reminder> {
	const now = new Date();
	const active = getActiveReminders();

	if (!clientSentMap.has(client)) {
		clientSentMap.set(client, new Map());
	}
	const sent = clientSentMap.get(client)!;

	const unsent = active.filter((r) => sent.get(r.id) !== occurrenceKey(r, now));

	for (const r of unsent) {
		sent.set(r.id, occurrenceKey(r, now));
	}

	return unsent;
}

export function removeClient(client: object): void {
	clientSentMap.delete(client);
}
