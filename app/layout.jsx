import "./globals.css";

export const metadata = {
  title: "Wished — Walt Disney World, the way you wished",
  description: "A tailored Disney World trip plan in thirteen questions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
