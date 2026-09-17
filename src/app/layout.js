import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
export const metadata = {
  title: "On This Day in Detroit History",
  description: "Different Years. A Different Detroit.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Analytics />
      <body>{children}</body>
    </html>
  );
}
