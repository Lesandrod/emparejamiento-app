const fs = require('fs');
const sharp = require('sharp');

async function processGlove(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const outData = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    // Detect white/near white background
    const isWhiteBg = (r > 235 && g > 235 && b > 235) || 
                      (r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15);
    const alpha = isWhiteBg ? 0 : 255;

    outData[i * 4] = r;
    outData[i * 4 + 1] = g;
    outData[i * 4 + 2] = b;
    outData[i * 4 + 3] = alpha;
  }

  await sharp(outData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .resize(450, 450, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outputPath);

  console.log('Saved ' + outputPath);
}

async function main() {
  await processGlove(
    'C:/Users/lesan/.gemini/antigravity-cli/brain/f15f21d9-1831-43c4-bc18-2453cbe6672e/red_boxing_glove_1794363236456.jpg',
    'C:/Users/lesan/emparejamiento-app/public/red_glove.png'
  );

  await processGlove(
    'C:/Users/lesan/.gemini/antigravity-cli/brain/f15f21d9-1831-43c4-bc18-2453cbe6672e/blue_glove_1794363239356.jpg',
    'C:/Users/lesan/emparejamiento-app/public/blue_glove.png'
  );

  // Copy fight arena background
  fs.copyFileSync(
    'C:/Users/lesan/.gemini/antigravity-cli/brain/f15f21d9-1831-43c4-bc18-2453cbe6672e/fight_arena_1794363245895.jpg',
    'C:/Users/lesan/emparejamiento-app/public/fight_arena.jpg'
  );
  console.log('Copied fight_arena.jpg');
}

main().catch(console.error);
