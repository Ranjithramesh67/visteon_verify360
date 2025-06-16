import React, { createContext, useState } from 'react';


export const PrinterContext = createContext();


export const PrinterProvider = ({ children }) => {
  const [isPrinterConnect, setIsPrinterConnect ] = useState(false);

  return (
    <PrinterContext.Provider value={{ isPrinterConnect, setIsPrinterConnect }}>
      {children}
    </PrinterContext.Provider>
  );
};
