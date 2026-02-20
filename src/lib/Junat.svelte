<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDate } from 'date-fns';

	type Train = {
		trainNumber: number;
		commuterLineID?: string;
	};

	type Departure = {
		liveEstimateTime: Date;
		scheduledTime: Date;
		train: Train;
		destination: string;
	};

	const STATION_TO_CITY = {
		HKI: 'Helsinki',
		RI: 'Riihimäki',
		TPE: 'Tampere',
		TL: 'Toijala'
	};

	type ResponseTimeTableRow = {
		trainStopping: boolean;
		stationShortCode: string;
		type: string;
		scheduledTime: string;
		liveEstimateTime: string;
	};

	let loading = true;
	let error: string | null = null;
	let stationName: string | null = null;
	let departures: Departure[] = [];

	let trainNumberToCommuterLineId: Array<Train> = [];

	const JUNAT =
		'https://rata.digitraffic.fi/api/v1/live-trains?station=JP&arrived_trains=1&arriving_trains=50&departing_trains=50&departing_trains=5';
	const JUNA = 'https://rata.digitraffic.fi/api/v1/trains';

	function isLegitDeparture(tr: ResponseTimeTableRow): boolean {
		return (
			tr.trainStopping &&
			tr.stationShortCode === 'JP' &&
			tr.type === 'DEPARTURE' &&
			new Date().valueOf() <= new Date(tr.scheduledTime).valueOf()
		);
	}

	function determineDestination(tr: ResponseTimeTableRow): string {
		return STATION_TO_CITY[tr.stationShortCode as keyof typeof STATION_TO_CITY] ?? '';
	}

	async function fetchTrain(trainNumber: number, dateNow: string): Promise<Train> {
		const res = await fetch(`${JUNA}/${dateNow}/${trainNumber}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const data = await res.json();
		return data[0];
	}

	async function fetchDeparturesForStop(): Promise<Array<Departure>> {
		const res = await fetch(JUNAT, {
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
			.slice(0, 10);
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

	onMount(async () => {
		try {
			departures = await fetchDeparturesForStop();
		} catch (e) {
			console.error(e);
			error = (e as Error).message || String(e);
		} finally {
			loading = false;
		}
	});
</script>

<div class="junat">
	<div class="title">Lähtevät Junat</div>
	{#if loading}
		<div>Loading departures…</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<h3>{stationName}</h3>
		{#if departures.length === 0}
			<div>No upcoming departures found.</div>
		{:else}
			<ul>
				{#each departures as d (d.scheduledTime)}
					<li>
						<span class="time">{formatDate(d.scheduledTime, 'HH:mm')}</span>
						<span class="train">{d.train.commuterLineID ?? ''}</span>
						<span class="destination">{d.destination ?? ''}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.junat {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			Arial;
		background: darkgreen;
		color: white;
		padding: 1rem 0.5rem;
	}
	.title {
		font-size: 1.5rem;
		font-weight: bold;
	}
	.time {
		font-weight: 600;
	}
	.train {
		background-color: white;
		color: darkgreen;
		font-weight: bold;
		padding: 0 0.5rem;
	}
	li {
		display: flex;
		flex-direction: row;
		column-gap: 1rem;
		margin: 0.25rem 0;
		font-size: 1.3rem;
		margin-bottom: 0.5rem;
	}
	li:nth-child(even) {
		background-color: rgba(255, 255, 255, 25%);
	}
	.error {
		color: #b00020;
	}
</style>
