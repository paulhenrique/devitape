import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://devitape.com.br"),
  title: "devitape | Comunidade Tech de Itapetininga e Região",
  description: "A maior comunidade de desenvolvedores de Itapetininga/SP. Encontros, networking, eventos e compartilhamento de conhecimento sobre tecnologia e engenharia de software.",
  keywords: ["devitape", "Itapetininga", "comunidade dev", "desenvolvedores", "tecnologia", "engenharia de software", "software engineering", "meetup", "programação"],
  openGraph: {
    title: "devitape | Comunidade Tech de Itapetininga",
    description: "Unindo desenvolvedores e entusiastas de tecnologia em Itapetininga e região.",
    url: "https://devitape.com.br",
    siteName: "devitape",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "devitape community",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "devitape",
              "url": "https://devitape.com.br",
              "logo": "https://devitape.com.br/logo.png",
              "sameAs": [
                "https://instagram.com/devitape",
                "https://linkedin.com/company/devitape",
                "https://github.com/devitape"
              ],
              "description": "Comunidade de desenvolvedores de Itapetininga e região."
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-black text-white min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
