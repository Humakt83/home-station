export type Train = {
	trainNumber: number;
	commuterLineID?: string;
};

export type Departure = {
	liveEstimateTime: Date;
	scheduledTime: Date;
	train: Train;
	destination: string;
};

export type ResponseTimeTableRow = {
	trainStopping: boolean;
	stationShortCode: string;
	type: string;
	scheduledTime: string;
	liveEstimateTime: string;
};
