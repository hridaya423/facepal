import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceFetch",
  description: "Face recognition website with next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
