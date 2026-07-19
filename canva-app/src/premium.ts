import { requestOpenExternalUrl } from "@canva/platform";

/**
 * Freemium gate. Free users can import this many pages per PDF; the full
 * document requires Pro.
 *
 * The Pro flag is a local stub: in production, replace `isPro` with a check
 * against your backend after linking the Canva user (see MONETIZATION.md) —
 * e.g. fetch(`${API}/entitlement`, { headers: { Authorization: canvaUserToken } }).
 */
export const FREE_PAGE_LIMIT = 3;

const UPGRADE_URL = "https://example.com/pdf-layers/upgrade";

export function isPro(): boolean {
  try {
    return window.localStorage.getItem("pdf_layers_pro") === "true";
  } catch {
    return false;
  }
}

export async function openUpgradePage(): Promise<void> {
  await requestOpenExternalUrl({ url: UPGRADE_URL });
}
