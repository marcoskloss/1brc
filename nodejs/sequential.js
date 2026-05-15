const readInChunks = require("./reader");

const file = "../measurements.txt";
const CHUNK_SIZE = 128 * 1024 * 1024;

async function sequential() {
  const chunks = readInChunks(file, CHUNK_SIZE);
  const data = new Map();

  for await (const chunk of chunks) {
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
  }

  Array.from(data.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([station, data]) => {
      process.stdout.write(`${station};${data.min};${data.avg};${data.max}\n`);
    });
}

sequential();
