import type { Metadata } from "next";
import "./globals.css";
import Providers from "./auth/providers";

export const metadata: Metadata = {
  title: "Wiz AI - Personal Learning Assistant",
  description: "An app that provides you with a 24/7 study buddy",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
