import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConsentBanner from "../components/ConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SNL Alumni Universe",
  description:
    "Explore Saturday Night Live alumni, characters, films, shows, and creative connections.",
  verification: {
    google: "S3TJp5OcNO1_IcflO0zqjELpP8aPwjWNqXOnmLG7QG4",
  },
  openGraph: {
    title: "SNL Alumni Universe",
    description:
      "Explore Saturday Night Live alumni, characters, films, shows, and creative connections.",
    url: "https://snl-alumni-universe.vercel.app",
    siteName: "SNL Alumni Universe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SNL Alumni Universe",
    description:
      "Explore Saturday Night Live alumni, characters, films, shows, and creative connections.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Consent Mode v2: default everything to denied before gtag.js runs */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                wait_for_update: 500
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto py-6 text-center text-xs text-gray-500">
          <p className="mx-auto mb-2 max-w-2xl px-4">
            Unofficial fan site. Not affiliated with, endorsed by, or sponsored by NBCUniversal or
            Broadway Video. All trademarks belong to their respective owners.
          </p>
          <a href="/privacy" className="underline">Privacy Policy</a>
        </footer>
        <ConsentBanner />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-33W8GG195N"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-33W8GG195N');
          `}
        </Script>
      </body>
    </html>
  );
}
