import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Geist_Mono } from "next/font/google"
import "./globals.css"

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "SIGIL",
  description: "Transform your name into a unique constellation signature",
  metadataBase: new URL("https://sigil.laks.sh/"),
  openGraph: {
    title: "SIGIL",
    description: "Transform your name into a unique constellation signature",
    type: "website",
    siteName: "SIGIL",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIGIL",
    description: "Transform your name into a unique constellation signature",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
