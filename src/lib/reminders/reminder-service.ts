import { REMINDERS, type Reminder } from './reminder-types';

export function pollForRemindersToBeShown(): Array<Reminder> {
	const remindersToBeShown: Array<Reminder> = REMINDERS;
	return remindersToBeShown;
}
