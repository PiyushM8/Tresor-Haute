import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
});

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Tresor Haute - Luxury Fashion & Accessories',
  description: 'Discover our collection of luxury fashion and accessories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className={`${inter.className} min-h-screen flex flex-col bg-offwhite`}>
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
} 