import type { Metadata } from 'next';
import '../styles/global.css';
import '../styles/admin.css';

export const metadata: Metadata = {
  title: 'MANGESH MAHADEV | Haute Couture & Heritage Menswear',
  description:
    'Discover handcrafted royal Sherwanis, Imperial Bandhgalas, Heritage Kurta Sets, and Bespoke Groomswear from the atelier of Mangesh Mahadev.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth bg-[#FAF8F5]">
      <body
        className="bg-[#FAF8F5] text-[#333333] antialiased selection:bg-[#4A0E17] selection:text-white"
        style={{ fontFamily: "'Franklin Gothic', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
