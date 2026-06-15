import express from "express";
import { stringify } from "node:querystring";
const app = express();
const port = "3000";

const STATION_API = "/station/api"

app.get(STATION_API, (req, res) => {
  res.send("Alive!");
  console.log("Response sent");
});

app.get(STATION_API + '/electricity', async (req, res) => {
  console.log("Fetching electricity");
  const response = await fetch('https://api.porssisahko.net/v2/latest-prices.json');
  const data = await response.json();
  console.log("Electricity response", data);
  res.json(data.prices);
});

app.listen(port, () => {
  console.log(`Station app listening on port ${port}`);
});