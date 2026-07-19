# Monetization Plan — PDF to Editable Layers

Canva offers two officially supported ways to make money from an app, and they
can be combined. This plan uses both, in sequence.

## The two revenue channels

### 1. Canva Premium Apps Program (primary, medium-term)

Canva's [Premium Apps Program](https://www.canva.com/developers/premium-apps-program/)
bundles selected apps with Canva's paid plans and pays the developer a
recurring, usage-based payout each month (per individual program agreement —
Canva doesn't publish a fixed revenue share).

Eligibility requirements that shape our launch strategy:

- App must be **publicly listed** on the Canva Apps Marketplace and built with
  the Apps SDK (this app is).
- App should offer **high-value functionality that doesn't exist in Canva** —
  our differentiator: Canva's native PDF import exists, but this app gives
  users *control over the separation* (background / images / text as discrete
  layers, per-page, with color-matched editable text) directly inside the
  editor panel.
- A **clear premium offering** (gated, freemium, or credit-based) — implemented
  as the free 3-page limit in `src/premium.ts`.
- **Consistent monthly-active-user growth** — see the growth plan below.

### 2. External payments (immediate, from day one)

Canva doesn't support in-app purchases, but explicitly allows
[linking out to your own payment page](https://www.canva.dev/docs/apps/accepting-payments/),
and **takes no cut**. The lowest-lift stack:

- **Stripe Payment Link** for a Pro subscription (the `UPGRADE_URL` in
  `src/premium.ts` points at this page).
- **User linking**: verify the Canva user in our backend with
  `getCanvaUserToken()` (JWT from `@canva/user`), associate it with the Stripe
  customer at checkout, and expose a `GET /entitlement` endpoint.
- The app replaces the `isPro()` localStorage stub with a call to that
  endpoint; paying users get unlimited pages, free users keep the 3-page gate.

## Free vs. Pro split

| Feature | Free | Pro |
| --- | --- | --- |
| Pages imported per PDF | first 3 | unlimited |
| Background / image / text layers | ✓ | ✓ |
| Batch import (multiple PDFs) | — | ✓ |
| OCR for scanned PDFs (roadmap) | — | ✓ |
| Font matching to Canva fonts (roadmap) | — | ✓ |

Pricing to test: **$4.99/mo or $29/yr**, plus a one-time **$49 lifetime** offer
at launch. A credit-based variant (e.g. 30 free pages/month) is worth A/B
testing later — Canva explicitly lists credit-based apps as an accepted
premium model.

## Launch & growth plan

1. **Ship v1 free** with the 3-page gate visible (users should *see* the
   upgrade path even before the backend exists — the CTA is already in the UI).
2. **Marketplace listing optimization**: name and description targeting the
   searches people actually type in Canva — "import PDF", "PDF to design",
   "edit PDF", "PDF to editable text". Screenshots showing a before
   (flat PDF) / after (layers panel with separated elements).
3. **Stand up the Stripe + entitlement backend** (a small serverless function
   is enough) and flip `isPro()` to the real check.
4. **Grow MAU**: content marketing ("how to edit a PDF in Canva"), a demo
   video, and cross-promotion. MAU growth is an explicit Premium Apps
   criterion, so instrument conversion and retention from day one.
5. **Apply to the Premium Apps Program** once the app shows steady MAU growth
   and a working premium offering. Bundled distribution + monthly payouts then
   compound on top of (not instead of) external Stripe revenue.
6. Watch Canva's **Innovation Fund** and **App Adoption Awards** — both are
   extra payout programs for marketplace apps that hit adoption milestones.

## Compliance notes

- External payment links must follow Canva's
  [external links design guidelines](https://www.canva.dev/docs/apps/design-guidelines/external-links/)
  (open via `requestOpenExternalUrl`, as `premium.ts` does; no dark patterns).
- Payout details for Canva-side programs are configured in the Developer
  Portal ("Set up payout details").
- All PDF processing stays client-side, which keeps the privacy section of the
  app review simple and is a selling point in the listing.
