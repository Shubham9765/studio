
'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Order, Restaurant } from '@/lib/types';
import { KOT } from '@/components/owner/kot';


interface PrintContextType {
  print: (order: Order, restaurant: Restaurant) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Create the iframe only on the client side
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // The local variable `iframe` is captured in the closure of the cleanup function.
    // This ensures that we always try to remove the exact iframe that was created
    // in this specific effect run, avoiding race conditions with Fast Refresh.
    return () => {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const print = useCallback((order: Order, restaurant: Restaurant) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Create a root for React to render into.
    const printRoot = iframeDoc.createElement('div');
    iframeDoc.body.innerHTML = ''; // Clear previous content
    iframeDoc.body.appendChild(printRoot);

    const componentToPrint = <KOT order={order} restaurant={restaurant} />;

    // Render the component into the iframe
    ReactDOM.render(componentToPrint, printRoot, () => {
      // Once rendered, call print
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    });

    // Clean up after printing
    const handleAfterPrint = () => {
        if (printRoot) {
            ReactDOM.unmountComponentAtNode(printRoot);
        }
    }
    iframe.contentWindow?.addEventListener('afterprint', handleAfterPrint, { once: true });


  }, []);

  return (
    <PrintContext.Provider value={{ print }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
