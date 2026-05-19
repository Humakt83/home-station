import type { ElectricityPrice } from './electricity-types';

const LATEST_PRICES_ENDPOINT = 'https://api.porssisahko.net/v2/latest-prices.json';

export async function fetchLatestPriceData(): Promise<Array<ElectricityPrice>> {
	const response = await fetch(LATEST_PRICES_ENDPOINT, {mode: 'cors'});
	const data: Array<ElectricityPrice> = await response.json();
	return data;
}
