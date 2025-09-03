import type {Metadata} from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { CartProvider } from '@/hooks/use-cart';
import { NotificationProvider } from '@/hooks/use-notifications';
import { LocationProvider } from '@/hooks/use-location';
import { PrintProvider } from '@/hooks/use-print';
import { GroceryCartProvider } from '@/hooks/use-grocery-cart';

export const metadata: Metadata = {
  title: 'Village Eats',
  description: 'Your friendly neighborhood food delivery app.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossOrigin=""/>
      </head>
      <body className="font-body antialiased">
        <PrintProvider>
          <AuthProvider>
              <NotificationProvider>
                <LocationProvider>
                  <CartProvider>
                    <GroceryCartProvider>
                      {children}
                      <Toaster />
                    </GroceryCartProvider>
                  </CartProvider>
                </LocationProvider>
              </NotificationProvider>
          </AuthProvider>
        </PrintProvider>
      </body>
    </html>
  );
}
