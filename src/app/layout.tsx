import "./globals.css";

export const metadata = {
  title: "Balon",
  description: "Lineups and stats for our soccer games",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-cream text-pitch-900">{children}</body>
    </html>
  );
}
