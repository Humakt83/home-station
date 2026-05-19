<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchLatestPriceData } from './electricity-service.ts';
	import type { ElectricityPrice } from './electricity-types.ts';

	let refreshTimer: number | null = null;
	let prices: Array<ElectricityPrice> = [];

	onMount(async () => {

		prices = await fetchLatestPriceData();
		console.log('PRICES', prices[0]);

		// Refresh electricity data every 20mins
		refreshTimer = window.setInterval(
			async () => {
				try {
					prices = await fetchLatestPriceData();
				} catch (e) {
					console.error('Hourly refresh failed for fetching electricity price', e);
				}
			},
			60 * 60 * 1000
		);
	});

	onDestroy(() => {
		if (refreshTimer !== null) window.clearInterval(refreshTimer);
	});
</script>

<div class="electricity">
	<div class="title">Sähkö</div>
	{#if prices.length > 0}
		<div class="priceNow">{prices[0].price} c/kWh</div>
	{/if}
</div>

<style>
	.electricity {
		grid-area: electricity;
	}
</style>
