import React, { createContext, useState } from "react";

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
    const [invoiceData, setInvoiceData] = useState([{
        invoiceNo: "",
        partNo: "",
        partName: "",
        totalQty: "",
    }]);

    const [customerData, setCustomerData] = useState([{
        binLabel: "",
    }]);

    return (
        <InvoiceContext.Provider value={{ invoiceData, setInvoiceData, customerData, setCustomerData }}>
            {children}
        </InvoiceContext.Provider>
    );
};
