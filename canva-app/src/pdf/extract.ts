import { getDocument, GlobalWorkerOptions, OPS, Util } from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";
import workerSource from "pdfjs-dist/build/pdf.worker.min.mjs";

// Canva apps ship as a single bundle, so the worker can't be a separate file.
// Spin it up from the inlined source instead.
GlobalWorkerOptions.workerSrc = URL.createObjectURL(
  new Blob([workerSource], { type: "text/javascript" })
);

const RASTER_SCALE = 2;

export type TextLayer = {
  text: string;
  left: number;
  top: number;
  width: number;
  fontSize: number;
  color: string;
};

export type ImageLayer = {
  dataUrl: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PageLayers = {
  pageNumber: number;
  width: number;
  height: number;
  backgroundDataUrl: string;
  texts: TextLayer[];
  images: ImageLayer[];
};

type Rect = { left: number; top: number; width: number; height: number };

export async function extractPdfLayers(
  data: ArrayBuffer,
  onProgress?: (done: number, total: number) => void
): Promise<PageLayers[]> {
  const doc = await getDocument({ data }).promise;
  const pages: PageLayers[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    pages.push(await extractPage(page));
    onProgress?.(i, doc.numPages);
  }
  await doc.destroy();
  return pages;
}

async function extractPage(page: PDFPageProxy): Promise<PageLayers> {
  const viewport = page.getViewport({ scale: 1 });
  const raster = document.createElement("canvas");
  raster.width = Math.ceil(viewport.width * RASTER_SCALE);
  raster.height = Math.ceil(viewport.height * RASTER_SCALE);
  const ctx = raster.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, raster.width, raster.height);
  await page.render({
    canvasContext: ctx,
    viewport: page.getViewport({ scale: RASTER_SCALE }),
  }).promise;

  const texts = await extractTextLayers(page, ctx);
  const images = await extractImageLayers(page);

  // Erase what became its own layer, so the flattened background doesn't
  // show a second copy underneath the editable elements.
  for (const img of images) {
    eraseRect(ctx, img);
  }
  for (const t of texts) {
    eraseRect(ctx, { left: t.left, top: t.top, width: t.width, height: t.fontSize * 1.25 });
  }

  return {
    pageNumber: page.pageNumber,
    width: viewport.width,
    height: viewport.height,
    backgroundDataUrl: raster.toDataURL("image/jpeg", 0.9),
    texts,
    images,
  };
}

/* ------------------------------- text ---------------------------------- */

type RawRun = {
  text: string;
  left: number;
  baseline: number;
  fontHeight: number;
  ascent: number;
  width: number;
};

async function extractTextLayers(
  page: PDFPageProxy,
  raster: CanvasRenderingContext2D
): Promise<TextLayer[]> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const runs: RawRun[] = [];

  for (const item of content.items as Array<Record<string, unknown>>) {
    const str = item.str as string | undefined;
    if (!str || !str.trim()) continue;
    const tx = Util.transform(viewport.transform, item.transform as number[]);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    if (fontHeight < 1) continue;
    const style = (content.styles as Record<string, { ascent?: number }>)[
      item.fontName as string
    ];
    runs.push({
      text: str,
      left: tx[4],
      baseline: tx[5],
      fontHeight,
      ascent: style?.ascent && style.ascent > 0 && style.ascent < 2 ? style.ascent : 0.8,
      width: (item.width as number) || str.length * fontHeight * 0.5,
    });
  }

  // Merge runs that sit on the same baseline into single editable lines.
  runs.sort((a, b) => (Math.abs(a.baseline - b.baseline) > 2 ? a.baseline - b.baseline : a.left - b.left));
  const lines: RawRun[] = [];
  for (const run of runs) {
    const prev = lines[lines.length - 1];
    if (
      prev &&
      Math.abs(prev.baseline - run.baseline) <= Math.min(prev.fontHeight, run.fontHeight) * 0.3 &&
      Math.abs(prev.fontHeight - run.fontHeight) <= Math.max(1.5, prev.fontHeight * 0.15) &&
      run.left - (prev.left + prev.width) < run.fontHeight * 1.2
    ) {
      const gap = run.left - (prev.left + prev.width);
      const needsSpace =
        gap > run.fontHeight * 0.12 && !prev.text.endsWith(" ") && !run.text.startsWith(" ");
      prev.text += (needsSpace ? " " : "") + run.text;
      prev.width = run.left + run.width - prev.left;
      prev.fontHeight = Math.max(prev.fontHeight, run.fontHeight);
    } else {
      lines.push({ ...run });
    }
  }

  return lines.map((line) => {
    const top = line.baseline - line.fontHeight * line.ascent;
    return {
      text: line.text.trim(),
      left: line.left,
      top,
      width: line.width,
      fontSize: line.fontHeight,
      color: sampleTextColor(raster, {
        left: line.left,
        top,
        width: line.width,
        height: line.fontHeight * 1.2,
      }),
    };
  });
}

/**
 * Guess the text color by finding the most common strongly-contrasting pixel
 * inside the rendered text's bounding box.
 */
function sampleTextColor(ctx: CanvasRenderingContext2D, rect: Rect): string {
  const bg = borderColor(ctx, rect);
  const r = toRaster(rect, ctx.canvas);
  if (r.width < 1 || r.height < 1) return "#000000";
  const data = ctx.getImageData(r.left, r.top, r.width, r.height).data;
  const counts = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const key =
      ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const dist =
      Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
    if (dist > 120) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = -1;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  if (best < 0) return "#000000";
  const to255 = (v: number) => (v << 4) | v;
  return (
    "#" +
    [to255((best >> 8) & 0xf), to255((best >> 4) & 0xf), to255(best & 0xf)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/* ------------------------------ images --------------------------------- */

async function extractImageLayers(page: PDFPageProxy): Promise<ImageLayer[]> {
  const viewport = page.getViewport({ scale: 1 });
  const opList = await page.getOperatorList();
  const layers: ImageLayer[] = [];

  // Walk the operator list tracking the current transformation matrix so we
  // know where each image lands on the page (images paint into a unit square
  // transformed by the CTM).
  let ctm: number[] = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];
    if (fn === OPS.save) {
      stack.push(ctm.slice());
    } else if (fn === OPS.restore) {
      ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    } else if (fn === OPS.transform) {
      ctm = Util.transform(ctm, args as number[]);
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
      const obj = await resolveObj(page, args[0] as string);
      const layer = await buildImageLayer(obj, ctm, viewport.transform);
      if (layer) layers.push(layer);
    } else if (fn === OPS.paintInlineImageXObject) {
      const layer = await buildImageLayer(args[0], ctm, viewport.transform);
      if (layer) layers.push(layer);
    }
  }
  return layers;
}

function resolveObj(page: PDFPageProxy, objId: string): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      const store = objId.startsWith("g_") ? page.commonObjs : page.objs;
      store.get(objId, (obj: unknown) => resolve(obj));
    } catch {
      resolve(null);
    }
  });
}

async function buildImageLayer(
  obj: unknown,
  ctm: number[],
  viewportTransform: number[]
): Promise<ImageLayer | null> {
  try {
    const canvas = imageObjectToCanvas(obj);
    if (!canvas) return null;

    const m = Util.transform(viewportTransform, ctm);
    const corners = [
      Util.applyTransform([0, 0], m),
      Util.applyTransform([1, 0], m),
      Util.applyTransform([0, 1], m),
      Util.applyTransform([1, 1], m),
    ];
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => p[1]);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const width = Math.max(...xs) - left;
    const height = Math.max(...ys) - top;
    if (width < 2 || height < 2) return null;

    return { dataUrl: canvas.toDataURL("image/png"), left, top, width, height };
  } catch {
    return null;
  }
}

function imageObjectToCanvas(obj: unknown): HTMLCanvasElement | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as {
    bitmap?: ImageBitmap;
    data?: Uint8ClampedArray | Uint8Array;
    width?: number;
    height?: number;
  };

  const bitmap =
    record.bitmap ?? (typeof ImageBitmap !== "undefined" && obj instanceof ImageBitmap ? obj : null);
  if (bitmap) {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    return canvas;
  }

  const { data, width, height } = record;
  if (!data || !width || !height) return null;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const channels = data.length / (width * height);
  if (channels >= 4) {
    rgba.set(data.subarray(0, rgba.length));
  } else if (channels >= 3) {
    for (let i = 0, j = 0; j < rgba.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (channels >= 1) {
    for (let i = 0, j = 0; j < rgba.length; i++, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = data[i];
      rgba[j + 3] = 255;
    }
  } else {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvas;
}

/* ---------------------------- background ------------------------------- */

function toRaster(rect: Rect, canvas: HTMLCanvasElement) {
  const left = Math.max(0, Math.floor(rect.left * RASTER_SCALE) - 2);
  const top = Math.max(0, Math.floor(rect.top * RASTER_SCALE) - 2);
  return {
    left,
    top,
    width: Math.min(canvas.width - left, Math.ceil(rect.width * RASTER_SCALE) + 4),
    height: Math.min(canvas.height - top, Math.ceil(rect.height * RASTER_SCALE) + 4),
  };
}

/** Average color just outside a rect — a good guess for the local background. */
function borderColor(ctx: CanvasRenderingContext2D, rect: Rect): [number, number, number] {
  const r = toRaster(rect, ctx.canvas);
  const samples: Array<[number, number]> = [
    [r.left - 4, r.top - 4],
    [r.left + r.width + 4, r.top - 4],
    [r.left - 4, r.top + r.height + 4],
    [r.left + r.width + 4, r.top + r.height + 4],
    [r.left + Math.floor(r.width / 2), r.top - 4],
    [r.left + Math.floor(r.width / 2), r.top + r.height + 4],
  ];
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  for (const [x, y] of samples) {
    if (x < 0 || y < 0 || x >= ctx.canvas.width || y >= ctx.canvas.height) continue;
    const px = ctx.getImageData(x, y, 1, 1).data;
    sr += px[0];
    sg += px[1];
    sb += px[2];
    n++;
  }
  if (!n) return [255, 255, 255];
  return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
}

function eraseRect(ctx: CanvasRenderingContext2D, rect: Rect) {
  const [r, g, b] = borderColor(ctx, rect);
  const area = toRaster(rect, ctx.canvas);
  if (area.width <= 0 || area.height <= 0) return;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(area.left, area.top, area.width, area.height);
}
