import type { Reminder } from './reminder-types';

const WS_PATH = '/station/api/ws/reminders';

export function subscribeToReminders(onReminders: (reminders: Reminder[]) => void): () => void {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const ws = new WebSocket(`${protocol}//${window.location.host}${WS_PATH}`);

	ws.onmessage = (event: MessageEvent) => {
		onReminders(JSON.parse(event.data as string) as Reminder[]);
	};

	return () => ws.close();
}
