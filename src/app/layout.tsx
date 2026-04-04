import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";

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
  description: "A comunidade de tecnologia de Itapetininga e região. Encontros, networking, eventos e compartilhamento de conhecimento sobre engenharia de software.",
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
    <html lang="pt-BR" suppressHydrationWarning>
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
                "https://instagram.com/dev.itape",
                "https://linkedin.com/company/devitape",
                "https://github.com/devitape"
              ],
              "description": "Comunidade de desenvolvedores de Itapetininga e região."
            }),
          }}
        />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "w6ja6qwlko");
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <ThemeProvider defaultTheme="dark">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
