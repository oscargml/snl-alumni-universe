import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SNL Alumni Universe",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-800">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: July 4, 2026</p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Who We Are</h2>
      <p>
        SNL Alumni Universe (snl-alumni-universe.vercel.app) is a free fan site operated by an
        individual developer, the data controller for the purposes of the EU General Data
        Protection Regulation. Contact:{" "}
        <a className="underline" href="mailto:oscargml@gmail.com">oscargml@gmail.com</a>.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Data We Collect</h2>
      <p>
        We do not require accounts and do not collect names, email addresses, or payment details.
        Your browsing of the encyclopedia happens without any profile being built about you by us.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Analytics</h2>
      <p>
        We use Google Analytics 4 for aggregate usage statistics (pages visited, approximate
        location, device type). Analytics cookies are only set after you accept our cookie banner;
        if you decline, only cookieless aggregated pings are sent (Google Consent Mode). You can
        also use the{" "}
        <a className="underline" href="https://tools.google.com/dlpage/gaoptout" rel="noopener">
          Google Analytics opt-out add-on
        </a>.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Your Rights (GDPR)</h2>
      <p>
        Where the GDPR applies, processing via analytics cookies is based on your consent, which
        you may withdraw at any time. You have the right to access, rectify, erase, restrict, or
        object to the processing of your personal data, and to lodge a complaint with your
        supervisory authority. Contact{" "}
        <a className="underline" href="mailto:oscargml@gmail.com">oscargml@gmail.com</a> to
        exercise these rights.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Fan Content Disclaimer</h2>
      <p>
        This is an unofficial, non-commercial fan encyclopedia about the television program
        &ldquo;Saturday Night Live&rdquo;. It is not affiliated with, endorsed by, or sponsored by
        NBCUniversal, Broadway Video, or any rights holder. All trademarks, names, and imagery
        referenced remain the property of their respective owners. Rights holders may contact{" "}
        <a className="underline" href="mailto:oscargml@gmail.com">oscargml@gmail.com</a> with any
        concerns.
      </p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Children</h2>
      <p>This site is not directed at children under 16 and we do not knowingly collect their data.</p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Changes</h2>
      <p>We may update this policy; the date above reflects the latest revision.</p>
    </main>
  );
}
