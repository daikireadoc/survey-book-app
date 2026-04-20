
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import AuthGate from "./components/AuthGate";

export const metadata: Metadata = {
  title: "ReaDoc",
  description: "重要事項説明書生成AI",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}