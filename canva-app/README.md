# PDF to Editable Layers — Canva App

A [Canva app](https://www.canva.dev/docs/apps/) that lets users upload a PDF
and add each page to their design as **separately editable layers**:

- **Background layer** — a raster of the page with the extracted text and
  images erased out, so nothing shows through twice.
- **Image layers** — every embedded image, extracted at its exact position
  and size as its own Canva image element.
- **Text layers** — every line of text re-created as a *real, editable* Canva
  text element with matching position, font size, and sampled color.

Each PDF page becomes a new page in the design (sized to match the PDF page),
so users can restyle headlines, swap images, and recolor backgrounds natively
in Canva.

Everything runs client-side in the app iframe using [pdf.js](https://mozilla.github.io/pdf.js/) —
no PDF ever leaves the user's browser.

## Project structure

```
src/
  index.tsx        App entry — mounts the UI inside Canva's AppUiProvider
  app.tsx          Panel UI (upload, layer options, progress, freemium gate)
  premium.ts       Freemium gate stub + upgrade link (see MONETIZATION.md)
  pdf/extract.ts   pdf.js engine: text/image/background layer separation
  canva/insert.ts  Uploads assets and adds pages via @canva/design addPage
```

## How the layer separation works

1. The page is rendered to an offscreen canvas at 2× (the future background).
2. `getTextContent()` items are mapped through the viewport transform,
   merged into lines, and their color is sampled from the rendered pixels.
3. The operator list is walked with a CTM stack to find every
   `paintImageXObject`, giving each image's exact placement; pixels are
   recovered from pdf.js's object store.
4. Text and image regions are erased from the background raster (filled with
   the locally sampled background color) so layers don't double up.
5. `@canva/asset upload()` + `@canva/design addPage()` recreate the page with
   absolutely positioned elements.

## Development

```bash
npm install
npm start          # serves the bundle at http://localhost:8080
```

Then in the [Canva Developer Portal](https://www.canva.com/developers/apps):

1. Create an app and set the **Development URL** to `http://localhost:8080/app.js`.
2. Click **Preview** to open the app inside the Canva editor.
3. Upload a PDF and hit **Add pages to design**.

Other scripts:

```bash
npm run build      # production single-file bundle in dist/app.js
npm run typecheck  # strict TypeScript check
```

The pdf.js worker is inlined into the bundle (see `webpack.config.js`), so the
production build is a single `app.js` as required for Canva app submission.

## Known limitations

- Text is re-typeset in Canva's default font — the original PDF font is
  approximated (size/color match; exact typeface doesn't). Font mapping to
  Canva `fontRef`s is a good v2 feature.
- Scanned (image-only) PDFs produce a background layer but no text layers;
  OCR is a planned premium feature.
- Password-protected PDFs are rejected with an error message.
- `addPage` is rate limited by Canva, so multi-page imports pace themselves
  (~3.5s per page).

## Monetization

See [MONETIZATION.md](./MONETIZATION.md) for the full plan (Canva Premium
Apps Program + external Stripe payments) and how the in-app freemium gate in
`src/premium.ts` connects to it.
