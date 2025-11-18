import axios from "axios";
import Config from "./config";
import Toast from "react-native-toast-message";

const API_URL = Config.API_URL;

const api = axios.create({
    baseURL: API_URL,
});


// ===================== Users ==========================

export const loginUser = async (credential) => {
    try {
        const { data } = await api.post(`/users/login`, credential);
        if (data.status) {
            return data;
        }
    }
    catch (error) {
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            
            console.log("Error while login user:", error.response.data.message);
        }
        else {
            console.log("Error while login user:", error);
        }
        return error;
    }
}


export const getUser = async (userId) => {
    try {
        const { data } = await api.get(`/users/get-user?userId=${userId}`);
        if (data.status) {
            return data;
        }
    }
    catch (error) {
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            console.log("Error while fetch user:", error.response.data.message);
        }
        else {
            console.log("Error while fetch user:", error);
        }
        return error;
    }
}

export const updateUser = async (formData) => {
    try {
        const { data } = await api.put(`/users/update-user`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (data.status) {
            return data;
        }

        console.log(formData)
    }
    catch (error) {
        if (error.response) {
            console.log("Full error response:", error.response.data)
            console.log("Error while updating user:", error.response.data.message);
        }
        else {
            console.log("Error while updating user:", error);
        }
        return error;
    }
}

// ===================== Invoice ==========================

export const createInvoice = async (invoiceData) => {
    try {
        const response = await api.post(`/invoice/create`, invoiceData);
        return response.data;
    } catch (error) {
        console.log(error)
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            console.log("Error while save invoice:", error.response.data.message);
        }
        else {
            console.log("Error while save invoice:", error);
        }
        return error;
    }
};

export const updateScannedBin = async (invoiceId, scannedBinLabel, remainingQuantity) => {
    try {
        const response = await api.put(`/invoice/scan/${invoiceId}`, {
            binLabel: scannedBinLabel,
            remQty: remainingQuantity
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            console.log("Error while update scanned invoice:", error.response.data.message);
        }
        else {
            console.log("Error while update scanned sinvoice:", error);
        }
        return error;
    }
};

// ===================== Customer VEPL ==========================

export const createCustomerVepl = async (data) => {
    try {
        const response = await api.post(`/customer_vepl/create`, data);
        console.log(response)
        return response.data;
    } catch (error) {
        console.log(error)
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            console.log("Error while save vepl:", error.response.data.message);
        }
        else {
            console.log("Error while save vepl:", error);
        }
        return error;
    }
    };

export const updateCustomerVepl = async (invoiceId, serial_number, vepl_qty) => {
    try {
        const response = await api.put(`/customer_vepl/update/${invoiceId}`, {
            serial_number: serial_number,
            vepl_qty: vepl_qty
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            Toast.show({
                type: 'error',
                text1: 'Alert',
                text2: error.response.data.message,
                position: 'top'
            })
            console.log("Error while update scanned invoice:", error.response.data.message);
        }
        else {
            console.log("Error while update scanned sinvoice:", error);
        }
        return error;
    }
};