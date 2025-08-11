
'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface PrintContextType {
  print: (component: React.ReactElement) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const print = useCallback((component: React.ReactElement) => {
    if (!iframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Create a root for React to render into.
    const printRoot = iframeDoc.createElement('div');
    iframeDoc.body.appendChild(printRoot);

    // Render the component into the iframe
    ReactDOM.render(component, printRoot, () => {
      // Once rendered, call print
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    });

    // Clean up after printing
    const handleAfterPrint = () => {
        ReactDOM.unmountComponentAtNode(printRoot);
        printRoot.remove();
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
