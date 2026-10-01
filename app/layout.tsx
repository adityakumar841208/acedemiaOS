import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import TelegramJoinButton from "@/components/layout/TelegramJoinButton";
import { Toaster } from "sonner";



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
      <body className="antialiased bg-[#f7f4ec] text-slate-900 min-h-screen flex flex-col">
        <UserProvider>
          {children}
          <TelegramJoinButton />
          <Toaster position="top-right" richColors />
        </UserProvider>
      </body>
    </html>
  );
}
