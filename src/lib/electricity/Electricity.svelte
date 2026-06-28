<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Line } from 'svelte-chartjs';
	import {
		Chart,
		LineElement,
		PointElement,
		LineController,
		CategoryScale,
		LinearScale,
		TimeScale,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { fetchLatestPriceData } from './electricity-service.ts';
	import type { ElectricityPrice } from './electricity-types.ts';
	import { format } from 'date-fns';

	Chart.register(
		LineElement,
		PointElement,
		LineController,
		CategoryScale,
		LinearScale,
		TimeScale,
		Tooltip,
		Legend,
		Filler
	);

	let refreshTimer: number | null = null;
	let prices: Array<ElectricityPrice> = [];

	$: chartData = {
		labels: prices.map((p) => format(new Date(p.startDate), 'H')),
		datasets: [
			{
				label: 'c/kWh',
				data: prices.map((p) => p.price),
				borderColor: 'blue',
				backgroundColor: 'rgba(96, 165, 250, 0.1)',
				fill: true,
				tension: 0.3,
				pointRadius: 2
			}
		]
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: { display: false }
		},
		scales: {
			x: {
				ticks: { maxTicksLimit: 12, color: 'black' },
				grid: { color: 'rgba(0,0,0,0.15)' }
			},
			y: {
				title: { display: true, text: 'c/kWh', color: 'black' },
				ticks: { color: 'black' },
				grid: { color: 'rgba(0,0,0,0.15)' }
			}
		}
	};

	onMount(async () => {
		prices = await fetchLatestPriceData();

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
	<div class="title">Sähkö {prices.length > 0 ? prices[0].price : '?'} c/kWh</div>
	{#if prices.length > 0}
		<div class="chart">
			<Line data={chartData} options={chartOptions} />
		</div>
	{/if}
</div>

<style>
	.title {
		font-weight: 700;
	}

	.electricity {
		grid-area: electricity;
		background-color: yellow;
		height: 25vh;
	}

	.chart {
		width: 100%;
		margin-top: 0.5rem;
	}
</style>
