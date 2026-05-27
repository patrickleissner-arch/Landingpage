import { Jimp } from 'jimp';
import { readFileSync, writeFileSync } from 'fs';

async function removeBg(inputPath, outputPath, tolerance = 40) {
  const image = await Jimp.read(inputPath);
  const { width, height } = image.bitmap;
  const data = image.bitmap.data;

  // Sample background color from top-left corner pixel
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  console.log(`${inputPath}: background sampled as rgb(${bgR},${bgG},${bgB})`);

  // Flood-fill from all four corners to mark background pixels
  const visited = new Uint8Array(width * height);
  const queue = [];

  function idx(x, y) { return (y * width + x) * 4; }
  function isBackground(x, y) {
    const i = idx(x, y);
    const dr = Math.abs(data[i]   - bgR);
    const dg = Math.abs(data[i+1] - bgG);
    const db = Math.abs(data[i+2] - bgB);
    return (dr + dg + db) / 3 <= tolerance;
  }

  const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
  for (const [cx, cy] of corners) {
    if (!visited[cy * width + cx] && isBackground(cx, cy)) {
      queue.push([cx, cy]);
      visited[cy * width + cx] = 1;
    }
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    // Set pixel transparent
    data[idx(x, y) + 3] = 0;

    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height
          && !visited[ny * width + nx] && isBackground(nx, ny)) {
        visited[ny * width + nx] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  await image.write(outputPath);
  console.log(`Saved: ${outputPath}`);
}

await removeBg(
  'assets/partner/neu_DWW.png',
  'assets/partner/neu_DWW.png',
  35
);

await removeBg(
  'assets/partner/neu_clover.png',
  'assets/partner/neu_clover.png',
  30
);

console.log('Done.');
