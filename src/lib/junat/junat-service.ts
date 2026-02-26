import { formatDate } from 'date-fns';
import type { Departure, ResponseTimeTableRow, Train } from './junat-types';
import { determineDestination, isLegitDeparture } from './junat-util';

const trainNumberToCommuterLineId: Array<Train> = [];

const MAX_DEPARTURES = 15;

const TRAIN_API = 'https://rata.digitraffic.fi/api/v1/trains';
const DEPARTURES_API =
	'https://rata.digitraffic.fi/api/v1/live-trains?station=JP&arrived_trains=1&arriving_trains=50&departing_trains=50&departing_trains=5';

async function fetchTrain(trainNumber: number, dateNow: string): Promise<Train> {
	const res = await fetch(`${TRAIN_API}/${dateNow}/${trainNumber}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
	const data = await res.json();
	return data[0];
}

export async function fetchDeparturesForStop(): Promise<Array<Departure>> {
	const res = await fetch(DEPARTURES_API, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!res.ok) throw new Error(`stop departures error ${res.status}`);
	const data: Array<{ trainNumber: number; timeTableRows: Array<ResponseTimeTableRow> }> =
		await res.json();
	const departureData = data
		.filter((train) => !!train.timeTableRows.find(isLegitDeparture))
		.map((train) => {
			const sortedRows = train.timeTableRows.sort(
				(a, b) => new Date(a.scheduledTime).valueOf() - new Date(b.scheduledTime).valueOf()
			);
			const rows = train.timeTableRows.filter(isLegitDeparture);
			const last = sortedRows[sortedRows.length - 1];
			return { ...train, timeTableRows: rows.concat(last) };
		});
	const departures: Departure[] = departureData.map((dd) => {
		const firstTime = dd.timeTableRows[0];
		const destination = determineDestination(dd.timeTableRows[1]);
		return {
			liveEstimateTime: new Date(firstTime.liveEstimateTime),
			scheduledTime: new Date(firstTime.scheduledTime),
			destination,
			train: { trainNumber: dd.trainNumber } as Train
		};
	});
	const sortedDepartures = departures
		.sort((a, b) => a.scheduledTime.valueOf() - b.scheduledTime.valueOf())
		.slice(0, MAX_DEPARTURES);
	const dateNow = formatDate(new Date(), 'yyyy-MM-dd');
	return await Promise.all(
		sortedDepartures.map(async (dd) => {
			let train: Train | undefined = trainNumberToCommuterLineId.find(
				(t) => t.trainNumber === dd.train.trainNumber
			);
			if (!train) {
				train = await fetchTrain(dd.train.trainNumber, dateNow);
				trainNumberToCommuterLineId.push(train);
			}
			return { ...dd, train };
		})
	);
}
