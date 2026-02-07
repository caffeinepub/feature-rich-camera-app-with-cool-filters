export type FilterType = 
  | 'original'
  | 'blackwhite'
  | 'sepia'
  | 'vintage'
  | 'neon'
  | 'cinematic'
  | 'blur'
  | 'sharpen'
  | 'edge';

export function applyFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterType: FilterType,
  intensity: number
): void {
  if (filterType === 'original') return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (filterType) {
    case 'blackwhite':
      applyBlackWhite(data, intensity);
      break;
    case 'sepia':
      applySepia(data, intensity);
      break;
    case 'vintage':
      applyVintage(data, intensity);
      break;
    case 'neon':
      applyNeon(data, intensity);
      break;
    case 'cinematic':
      applyCinematic(data, intensity);
      break;
    case 'blur':
      applyBlur(ctx, width, height, intensity);
      return; // Blur handles its own putImageData
    case 'sharpen':
      applySharpen(ctx, width, height, intensity);
      return; // Sharpen handles its own putImageData
    case 'edge':
      applyEdge(ctx, width, height, intensity);
      return; // Edge handles its own putImageData
  }

  ctx.putImageData(imageData, 0, 0);
}

export function applyBeauty(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  smoothing: number,
  whitening: number
): void {
  if (smoothing === 0 && whitening === 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply whitening first
  if (whitening > 0) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Brighten and even out skin tones
      const brightness = (r + g + b) / 3;
      const boost = whitening * 0.3;

      data[i] = Math.min(255, r + boost);
      data[i + 1] = Math.min(255, g + boost);
      data[i + 2] = Math.min(255, b + boost);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply smoothing (blur) for skin softening
  if (smoothing > 0) {
    const radius = Math.floor(smoothing * 3);
    if (radius >= 1) {
      const blurredData = ctx.getImageData(0, 0, width, height);
      const blurData = blurredData.data;
      const output = new Uint8ClampedArray(blurData);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = (ny * width + nx) * 4;
                r += blurData[idx];
                g += blurData[idx + 1];
                b += blurData[idx + 2];
                count++;
              }
            }
          }

          const idx = (y * width + x) * 4;
          output[idx] = r / count;
          output[idx + 1] = g / count;
          output[idx + 2] = b / count;
        }
      }

      blurredData.data.set(output);
      ctx.putImageData(blurredData, 0, 0);
    }
  }
}

function applyBlackWhite(data: Uint8ClampedArray, intensity: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i] + (gray - data[i]) * intensity;
    data[i + 1] = data[i + 1] + (gray - data[i + 1]) * intensity;
    data[i + 2] = data[i + 2] + (gray - data[i + 2]) * intensity;
  }
}

function applySepia(data: Uint8ClampedArray, intensity: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;

    data[i] = r + (tr - r) * intensity;
    data[i + 1] = g + (tg - g) * intensity;
    data[i + 2] = b + (tb - b) * intensity;
  }
}

function applyVintage(data: Uint8ClampedArray, intensity: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia + reduced contrast + vignette effect
    const tr = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b + 20);
    const tg = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b + 10);
    const tb = Math.max(0, 0.272 * r + 0.534 * g + 0.131 * b - 20);

    data[i] = r + (tr - r) * intensity;
    data[i + 1] = g + (tg - g) * intensity;
    data[i + 2] = b + (tb - b) * intensity;
  }
}

function applyNeon(data: Uint8ClampedArray, intensity: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Boost saturation and add glow
    const max = Math.max(r, g, b);
    const boost = 1.5;

    const tr = Math.min(255, r * boost + (max - r) * 0.3);
    const tg = Math.min(255, g * boost + (max - g) * 0.3);
    const tb = Math.min(255, b * boost + (max - b) * 0.3);

    data[i] = r + (tr - r) * intensity;
    data[i + 1] = g + (tg - g) * intensity;
    data[i + 2] = b + (tb - b) * intensity;
  }
}

function applyCinematic(data: Uint8ClampedArray, intensity: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Teal and orange look
    const tr = Math.min(255, r * 1.1 + 20);
    const tg = g;
    const tb = Math.min(255, b * 1.2 + 10);

    data[i] = r + (tr - r) * intensity;
    data[i + 1] = g + (tg - g) * intensity;
    data[i + 2] = b + (tb - b) * intensity;
  }
}

function applyBlur(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
  const radius = Math.floor(intensity * 5);
  if (radius < 1) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = r / count;
      output[idx + 1] = g / count;
      output[idx + 2] = b / count;
    }
  }

  imageData.data.set(output);
  ctx.putImageData(imageData, 0, 0);
}

function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  applyConvolution(ctx, width, height, kernel, intensity);
}

function applyEdge(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
  const kernel = [
    -1, -1, -1,
    -1, 8, -1,
    -1, -1, -1
  ];

  applyConvolution(ctx, width, height, kernel, intensity);
}

function applyConvolution(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kernel: number[],
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;

          if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
            const srcIdx = (scy * width + scx) * 4;
            const wt = kernel[cy * side + cx];
            r += data[srcIdx] * wt;
            g += data[srcIdx + 1] * wt;
            b += data[srcIdx + 2] * wt;
          }
        }
      }

      const dstIdx = (y * width + x) * 4;
      const origR = data[dstIdx];
      const origG = data[dstIdx + 1];
      const origB = data[dstIdx + 2];

      output[dstIdx] = origR + (Math.max(0, Math.min(255, r)) - origR) * intensity;
      output[dstIdx + 1] = origG + (Math.max(0, Math.min(255, g)) - origG) * intensity;
      output[dstIdx + 2] = origB + (Math.max(0, Math.min(255, b)) - origB) * intensity;
    }
  }

  imageData.data.set(output);
  ctx.putImageData(imageData, 0, 0);
}
