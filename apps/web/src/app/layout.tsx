import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@web/components/providers";

export const metadata: Metadata = {
  title: "FlowManager",
  description: "Sistema de gerenciamento de tarefas colaborativo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
