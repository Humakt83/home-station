import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { getActiveReminders } from './reminders/reminder.service.js';

const app = express();
const port = '3000';
const STATION_API = '/station/api';

app.get(STATION_API, (_req, res) => {
	res.send('Alive!');
	console.log('Response sent');
});

app.get(STATION_API + '/electricity', async (_req, res) => {
	console.log('Fetching electricity');
	const response = await fetch('https://api.porssisahko.net/v2/latest-prices.json');
	const data = (await response.json()) as { prices: unknown };
	console.log('Electricity response', data);
	res.json(data.prices);
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
	ws.send(JSON.stringify(getActiveReminders()));
});

server.on('upgrade', (request, socket, head) => {
	if (request.url === `${STATION_API}/ws/reminders`) {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});

server.listen(port, () => {
	console.log(`Station app listening on port ${port}`);
});
