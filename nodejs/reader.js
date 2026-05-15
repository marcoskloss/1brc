const fs = require("node:fs");
const { Buffer } = require("node:buffer");

async function* readInChunks(file, chunkSize) {
  const stream = fs.createReadStream(file, {
    highWaterMark: chunkSize,
  });

  let acc = Buffer.alloc(0);

  for await (const chunk of stream) {
    acc = Buffer.concat([acc, chunk]);

    const cutoff = acc.lastIndexOf("\n");
    if (cutoff == -1) continue;

    const lines = acc.subarray(0, cutoff);
    yield Buffer.from(lines);

    acc = acc.subarray(cutoff + 1);
  }

  if (acc.length > 0) {
    yield acc;
  }
}

module.exports = readInChunks;
