import { addPage } from "@canva/design";
import type { ElementAtPoint } from "@canva/design";
import { upload } from "@canva/asset";
import type { PageLayers } from "../pdf/extract";

export type ImportOptions = {
  includeBackground: boolean;
  includeImages: boolean;
  includeText: boolean;
};

// addPage page-size constraints.
const MIN_DIMENSION = 40;
const MAX_DIMENSION = 8000;
const MAX_AREA = 25_000_000;
// Canva caps text elements at fontSize 100.
const MAX_FONT_SIZE = 100;
// addPage is rate limited to roughly one call every few seconds.
const PAGE_INTERVAL_MS = 3500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function importPagesAsLayers(
  pages: PageLayers[],
  options: ImportOptions,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) await delay(PAGE_INTERVAL_MS);
    await importPage(pages[i], options);
    onProgress?.(i + 1, pages.length);
  }
}

async function importPage(page: PageLayers, options: ImportOptions): Promise<void> {
  // Scale the PDF page (in points) up to a comfortable pixel size while
  // respecting Canva's page-dimension limits.
  let scale = Math.min(2, MAX_DIMENSION / page.width, MAX_DIMENSION / page.height);
  if (page.width * page.height * scale * scale > MAX_AREA) {
    scale = Math.sqrt(MAX_AREA / (page.width * page.height));
  }
  const minSide = Math.min(page.width, page.height) * scale;
  if (minSide < MIN_DIMENSION) scale *= MIN_DIMENSION / minSide;

  const width = Math.round(page.width * scale);
  const height = Math.round(page.height * scale);
  const elements: ElementAtPoint[] = [];

  if (options.includeBackground) {
    const asset = await upload({
      type: "image",
      mimeType: "image/jpeg",
      url: page.backgroundDataUrl,
      thumbnailUrl: page.backgroundDataUrl,
      aiDisclosure: "none",
      name: `PDF page ${page.pageNumber} background`,
    });
    elements.push({
      type: "image",
      ref: asset.ref,
      altText: { text: `Page ${page.pageNumber} background`, decorative: false },
      top: 0,
      left: 0,
      width,
      height,
    });
  }

  if (options.includeImages) {
    for (const image of page.images) {
      const asset = await upload({
        type: "image",
        mimeType: "image/png",
        url: image.dataUrl,
        thumbnailUrl: image.dataUrl,
        aiDisclosure: "none",
        name: `PDF page ${page.pageNumber} image`,
      });
      elements.push({
        type: "image",
        ref: asset.ref,
        altText: { text: `Image from PDF page ${page.pageNumber}`, decorative: false },
        top: image.top * scale,
        left: image.left * scale,
        width: image.width * scale,
        height: image.height * scale,
      });
    }
  }

  if (options.includeText) {
    for (const text of page.texts) {
      elements.push({
        type: "text",
        children: [text.text],
        top: text.top * scale,
        left: text.left * scale,
        // Slack so re-typeset text doesn't wrap when Canva's font metrics
        // differ from the PDF's embedded font.
        width: Math.min(32767, text.width * scale * 1.2 + text.fontSize * scale),
        fontSize: clamp(text.fontSize * scale, 1, MAX_FONT_SIZE),
        color: text.color,
        textAlign: "start",
      });
    }
  }

  await withRetry(() =>
    addPage({
      title: `PDF page ${page.pageNumber}`,
      dimensions: { width, height },
      elements,
    })
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Most likely the addPage rate limit — back off and try again.
      await delay(PAGE_INTERVAL_MS * (attempt + 1));
    }
  }
  throw lastError;
}
