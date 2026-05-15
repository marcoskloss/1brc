const { Worker } = require("node:worker_threads");
const readInChunks = require("./reader");

const file = "../measurements.txt";
const NUM_THREADS = 12;
const CHUNK_SIZE = 128 * 1024 * 1024;

async function threads() {
  const chunks = readInChunks(file, CHUNK_SIZE);

  const results = [];
  let hasMoreChunks = true;

  while (hasMoreChunks) {
    const workerPromises = [];

    for (let i = 0; i < NUM_THREADS; i++) {
      const { value: chunk, done } = await chunks.next();

      if (done) {
        hasMoreChunks = false;
        break;
      }

      const workerPromise = new Promise((resolve, reject) => {
        const worker = new Worker("./thread_worker.js", {
          workerData: chunk,
          transferList: [chunk.buffer],
        });
        worker.on("message", (result) => resolve(result));
        worker.on("error", reject);
        worker.once("exit", (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });

      workerPromises.push(workerPromise);
    }

    const workersResults = await Promise.all(workerPromises);
    results.push(...workersResults);
  }

  const data = new Map();

  // aggregate results
  for (const result of results) {
    for (const [station, value] of result.entries()) {
      const { max, min, avg, counter } = value;

      if (data.has(station)) {
        const stationData = data.get(station);

        stationData.counter += counter;
        stationData.max = Math.max(stationData.max, max);
        stationData.min = Math.min(stationData.min, min);
        stationData.avg =
          stationData.avg + (avg - stationData.avg) / stationData.counter;
      } else {
        data.set(station, { max, min, avg, counter });
      }
    }
  }

  Array.from(data.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([station, data]) => {
      process.stdout.write(`${station};${data.min};${data.avg};${data.max}\n`);
    });
}

threads();
