export interface Reminder {
	id: string;
	message: string;
	occurs: 'YEARLY' | 'MONTHLY';
	when: number;
}

const AQUARIUM_MAINTENANCE: Reminder = {
	id: 'aquarium-maintenance',
	message: 'Muista hoitaa akvaariota 🐠',
	occurs: 'MONTHLY',
	when: 10
};

const NUOHOOJA: Reminder = {
	id: 'nuohooja',
	message: 'Muista tilata nuohooja 🏠',
	occurs: 'YEARLY',
	when: 9
};

const TAXES: Reminder = {
	id: 'taxes',
	message: 'Muista veroilmoitus 💰',
	occurs: 'YEARLY',
	when: 4
};

const HEATING: Reminder = {
	id: 'heating',
	message: 'Muista lämmitys 🌡',
	occurs: 'MONTHLY',
	when: 2
};

const RANNIT: Reminder = {
	id: 'rannit',
	message: 'Muista putsata rännit 🍂',
	occurs: 'YEARLY',
	when: 10
};

export const REMINDERS: Array<Reminder> = [
	AQUARIUM_MAINTENANCE,
	NUOHOOJA,
	TAXES,
	HEATING,
	RANNIT,
];
