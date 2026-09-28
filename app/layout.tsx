import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import TelegramJoinButton from "@/components/layout/TelegramJoinButton";
import { Toaster } from "sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AcademiaOS | Academic LMS & Resource Portal",
  description: "Next-generation Academic Portal organized by Department → Semester → Subject → Module → Resource with similarity checks and automated deadline locks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}
      >
        <UserProvider>
          {children}
          <TelegramJoinButton />
          <Toaster position="top-right" richColors />
        </UserProvider>
      </body>
    </html>
  );
}
