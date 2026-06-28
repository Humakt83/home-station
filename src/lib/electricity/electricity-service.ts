import type { ElectricityPrice } from './electricity-types';

const LATEST_PRICES_ENDPOINT = 'http://localhost:5173/station/api/electricity';

export async function fetchLatestPriceData(): Promise<Array<ElectricityPrice>> {
	const response = await fetch(LATEST_PRICES_ENDPOINT);
	const data: Array<ElectricityPrice> = await response.json();
	return data;
}
