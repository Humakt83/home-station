export interface Reminder {
	id: string;
	message: string;
	occurs: 'YEARLY' | 'MONTHLY';
	when: number;
}
