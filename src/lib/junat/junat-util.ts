import type { ResponseTimeTableRow } from './junat-types';

const STATION_TO_CITY = {
	HKI: 'Helsinki',
	RI: 'Riihimäki',
	TPE: 'Tampere',
	TL: 'Toijala'
};

export function isLegitDeparture(tr: ResponseTimeTableRow): boolean {
	return (
		tr.trainStopping &&
		tr.stationShortCode === 'JP' &&
		tr.type === 'DEPARTURE' &&
		new Date().valueOf() <= new Date(tr.scheduledTime).valueOf()
	);
}

export function determineDestination(tr: ResponseTimeTableRow): string {
	return STATION_TO_CITY[tr.stationShortCode as keyof typeof STATION_TO_CITY] ?? '';
}
