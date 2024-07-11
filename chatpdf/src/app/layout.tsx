// src/app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
// import Providers from "@/components/Providers";
// import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultyComm ChatPDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
        <html lang="en">
          <body className={inter.className}>{children}
            {/* <Providers>{children}</Providers> */}
          </body>
        {/* <Toaster /> */}
        </html>
    </ClerkProvider>
  );
}
