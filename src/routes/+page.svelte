<script>
	import Clock from '$lib/Clock.svelte';
	import Weather from '$lib/weather/Weather.svelte';
	import Junat from '$lib/junat/Junat.svelte';
	import Note from '$lib/notes/Note.svelte';
</script>

<section>
	<div class="dashboard">
		<Clock />
		<Weather />
		<Junat />
		<Note />
	</div>
</section>

<style>

	.dashboard {
		max-width: 100%;
		display: grid;
		grid-template-areas: 
			"weather weather clock"
			"train note note"
			"train note note";
	}

</style>