export type CityLocation = {
	lat: number;
	lon: number;
	city: string;
};

export type Weather = {
	location: CityLocation;
	temperature: number | null;
	feelsLike: number | null;
	conditionEmoji: string | null;
	conditionLabel: string | null;
};

export const LOCATIONS: Array<CityLocation> = [
	{ lat: 60.1699, lon: 24.9384, city: 'Järvenpää' },
	{ lat: 60.1708, lon: 24.9375, city: 'Helsinki' }
];
