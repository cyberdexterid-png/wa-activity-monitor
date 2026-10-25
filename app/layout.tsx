import type { Metadata } from "next";
import DemoBanner from "@/components/DemoBanner";
import Sidebar from "@/components/Sidebar";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "WA Activity Monitor",
  description:
    "Consent-based activity log with demo mode. No WhatsApp integration — demo data and manually logged observations only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink text-zinc-100 antialiased">
        <StoreProvider>
          <DemoBanner />
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
