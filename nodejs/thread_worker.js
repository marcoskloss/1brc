const { parentPort, workerData } = require("node:worker_threads");

const chunk = Buffer.from(workerData); // Uint8Array -> Buffer
const data = new Map();

const content = chunk.toString("utf-8");
const lines = content.split("\n");

for (const line of lines) {
  let [station, temp] = line.split(";");
  temp = Number(temp);

  if (data.has(station)) {
    const stationData = data.get(station);
    stationData.counter += 1;
    stationData.max = Math.max(stationData.max, temp);
    stationData.min = Math.min(stationData.min, temp);
    stationData.avg =
      stationData.avg + (temp - stationData.avg) / stationData.counter;
  } else {
    data.set(station, {
      max: temp,
      min: temp,
      avg: temp,
      counter: 1,
    });
  }
}

parentPort.postMessage(data);
