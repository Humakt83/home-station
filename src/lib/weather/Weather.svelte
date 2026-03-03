<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { LOCATIONS, type CityWeather } from './weather-types';
	import { fetchWeather } from './weather-service';
	import { addHours, formatDate } from 'date-fns';

	let weathers: Array<CityWeather> = [];
	let loading = true;
	let refreshTimer: number | null = null;
	let displaySingleWeather: CityWeather | null = null;

	onMount(async () => {
		weathers = await Promise.all(LOCATIONS.map((loc) => fetchWeather(loc)));
		loading = false;

		// Refresh weather data every hour
		refreshTimer = window.setInterval(
			async () => {
				try {
					weathers = await Promise.all(LOCATIONS.map((loc) => fetchWeather(loc)));
				} catch (e) {
					console.error('Hourly refresh failed', e);
				}
			},
			60 * 60 * 1000
		);
	});

	onDestroy(() => {
		if (refreshTimer !== null) window.clearInterval(refreshTimer);
	});
</script>

<div class="weather">
	{#if loading}
		<div>Ladataan säätietoja…</div>
	{:else if !displaySingleWeather}
		{#each weathers as cityWeather (cityWeather.location.city)}
			<div class="city">
				<div class="loc">
					<button on:click={() => (displaySingleWeather = cityWeather)}
						>{cityWeather.location.city}</button
					>
				</div>
				{#if cityWeather.weathers[0]?.temperature}
					<div class="temp">{Math.round(cityWeather.weathers[0]?.temperature)} °C</div>
				{/if}
				{#if typeof cityWeather.weathers[0]?.feelsLike === 'number'}
					<div class="feels">Tuntuu kuin {Math.round(cityWeather.weathers[0]?.feelsLike)} °C</div>
				{/if}
				{#if cityWeather.weathers[0]?.conditionEmoji}
					<div class="cond">
						{cityWeather.weathers[0]?.conditionEmoji}
						<span class="cond-label">{cityWeather.weathers[0]?.conditionLabel}</span>
					</div>
				{/if}
			</div>
		{/each}
	{:else}
		<div class="cityWeather">
			<div class="loc">
				<button on:click={() => (displaySingleWeather = null)}
					>{displaySingleWeather.location.city}</button
				>
			</div>
			<div class="weatherForecast">
				{#each displaySingleWeather.weathers as weather (weather.hourFromNow)}
					<div class="weatherTime">
						<div class="time">
							<time datetime={addHours(new Date(), weather.hourFromNow)}
								>{formatDate(addHours(new Date(), weather.hourFromNow), 'H')}</time
							>
						</div>
						{#if weather.conditionEmoji}
							<div class="cond">{weather.conditionEmoji}</div>
						{/if}
						{#if weather.temperature}
							<div class="temp">{Math.round(weather.temperature)} °C</div>
						{/if}
						{#if typeof weather.feelsLike === 'number'}
							<div class="feels">({Math.round(weather.feelsLike)})</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.weather {
		grid-area: weather;
		display: flex;
		flex-direction: row;
		column-gap: 2rem;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			Arial;
		padding: 1.5rem 1rem;
		background: lightseagreen;
		height: 20vh;
		overflow: hidden;
	}

	.city {
		text-align: center;
	}

	.temp {
		font-size: 1.5rem;
		font-weight: 600;
	}
	.feels {
		font-size: 0.85rem;
	}
	.cond {
		font-size: 2rem;
		margin-top: 0.25rem;
		.cond-label {
			vertical-align: middle;
			font-size: 0.85rem;
		}
	}
	.loc {
		font-size: 1.5rem;
		button {
			cursor: pointer;
			padding: 0.1rem 0.5rem;
			&:hover,
			&:focus {
				background-color: darkcyan;
			}
		}
	}

	.cityWeather {
		overflow-x: auto;
		.loc {
			text-align: center;
			margin-bottom: 1rem;
		}
		.weatherForecast {
			display: flex;
			flex-direction: row;
			column-gap: 2rem;

			.weatherTime {
				text-align: center;
			}

			.temp {
				font-size: 1rem;
				font-weight: normal;
			}
		}
	}
</style>
