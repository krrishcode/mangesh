import type { Metadata } from "next";
import "../styles/global.css";
import "../styles/admin.css";
import "../styles/admin-ecommerce.css";
import "../styles/admin-calendar.css";
import "@fullcalendar/react/skeleton.css";

export const metadata: Metadata = {
  title: "MANGESH MAHADEV | Haute Couture & Heritage Menswear",
  description:
    "Discover handcrafted royal Sherwanis, Imperial Bandhgalas, Heritage Kurta Sets, and Bespoke Groomswear from the atelier of Mangesh Mahadev.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="scroll-smooth bg-white"
    >
      <body
        className="bg-white text-[#333333] antialiased selection:bg-primary selection:text-primary-foreground"
        style={{ fontFamily: "'Franklin Gothic', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
