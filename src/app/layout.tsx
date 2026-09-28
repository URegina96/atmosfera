import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif" });
const sans = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Загородный дом «Атмосфера» — отдых недалеко от Уфы", template: "%s · «Атмосфера»" },
  description: "Два уютных дома с чанами в 20 км от Уфы. Тишина, природа и тёплые вечера. Онлайн-бронирование и подтверждение в Telegram.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Загородный дом «Атмосфера»",
    title: "Загородный дом «Атмосфера» — отдых недалеко от Уфы",
    description: "Два уютных дома с чанами в 20 км от Уфы.",
  },
};

export const viewport: Viewport = { themeColor: "#F7F3EC", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
