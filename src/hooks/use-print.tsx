
'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Order, Restaurant } from '@/lib/types';
import { KOT } from '@/components/owner/kot';


interface PrintContextType {
  print: (order: Order, restaurant: Restaurant) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [printContent, setPrintContent] = useState<React.ReactNode | null>(null);

  const print = useCallback((order: Order, restaurant: Restaurant) => {
    const componentToPrint = <KOT order={order} restaurant={restaurant} />;
    setPrintContent(componentToPrint);

    // The printing itself is triggered in a `useEffect` inside the IframePrintContent component
    // once the content has been rendered.
  }, []);
  
  const handlePrint = () => {
     const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
      }
      // After printing, we can clear the content.
      setPrintContent(null);
  }

  return (
    <PrintContext.Provider value={{ print }}>
      {children}
      <iframe
        ref={iframeRef}
        style={{ position: 'absolute', width: '0', height: '0', border: '0' }}
        title="Print Content"
        aria-hidden="true"
      >
        {iframeRef.current && iframeRef.current.contentDocument && (
            createPortal(
                <IframePrintContent onReady={handlePrint}>
                    {printContent}
                </IframePrintContent>,
                iframeRef.current.contentDocument.body
            )
        )}
      </iframe>
    </PrintContext.Provider>
  );
}

// A helper component to manage the "ready-to-print" state
function IframePrintContent({ children, onReady }: { children: React.ReactNode, onReady: () => void }) {
    React.useEffect(() => {
        if (children) {
            onReady();
        }
    }, [children, onReady]);

    return <>{children}</>;
}


export function usePrint() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
