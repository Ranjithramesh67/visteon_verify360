// VisteonApp/src/screens/CustomerVeplVerificationScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useState, useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCustomerVepl, updateCustomerVepl } from '../services/Api';

const STORAGE_KEY = 'VEPLFormData';

const CustomerVeplVerificationScreen = ({ navigation }) => {
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceQR, setInvoiceQR] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [binNumber, setBinNumber] = useState('');
  
  const [veplQR, setVeplQR] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantityVepl, setQuantityVepl] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [formLocked, setFormLocked] = useState(false);

  const binInputRef = useRef(null);
  const VeplInputRef = useRef(null);

  useEffect(()=>{
    AsyncStorage.removeItem(STORAGE_KEY);
    const loadSavedForm = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const {
        veplQR,
        invoiceNumber,
        partNumber,
        partName,
        totalQuantity,
        binNumber
      } = JSON.parse(data);
      setInvoiceQR(veplQR);
      setInvoiceNumber(invoiceNumber);
      setPartNumber(partNumber);
      setPartName(partName);
      setTotalQuantity(totalQuantity);
      setRemainingQuantity(parseInt(totalQuantity, 10));
      setBinNumber(binNumber)
      setFormLocked(true);
    }
  };
  loadSavedForm();
  },[]);

  useEffect(() => {
    if (formLocked) {
      const totalQty = parseInt(totalQuantity, 10) || 0;
      setRemainingQuantity(totalQty - scannedQuantity);
    }
}, [scannedQuantity]);

  const handleBinLabelScan= () => {
    if (!formLocked) {
      binInputRef.current?.focus();
    } else {
      Alert.alert('Bin Locked', 'Complete current bin before scanning a new one.');
    }
  };

  const handleBinLabelChange = async (text) => {
    setInvoiceQR(text);
  
    const parts = text.trim().split('|');
    if (parts.length === 7) {
      const [, , qty, partNo, partName, invoiceNo, binNo] = parts;
      setInvoiceNumber(invoiceNo);
      setPartNumber(partNo);
      setPartName(partName);
      setTotalQuantity(qty);
      setRemainingQuantity(parseInt(qty, 10));
      setBinNumber(binNo);
      setFormLocked(true);
      const VeplData = {
        invoice_number: invoiceNo,
        part_number: partNo,
        part_name: partName,
        total_qty: parseInt(qty, 10),
        bin_number: binNo,
        scanned: {serial_number: serialNumber,
          vepl_qty: quantityVepl,},
        status: false,
      };
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          invoiceQR: text,
          invoiceNumber: invoiceNo,
          partNumber: partNo,
          partName: partName,
          totalQuantity: qty,
          binNumber: binNo
        })
      );
      try {
        const saved = await createCustomerVepl(VeplData);
        console.log(saved);
        await AsyncStorage.setItem('activeVEPL', JSON.stringify(saved));
        setInvoiceId(saved[0].id);
        setInvoiceNumber(invoiceNo);
        setPartNumber(partNo);
        setPartName(partName);
        setTotalQuantity(qty);
        setBinNumber(binNo);
        setFormLocked(true);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'VEPL save failed' });
      }
    } else {
      Toast.show({ type: 'error', text1: 'VEPL QR format' });
    }
  };
  
  
  

  const handleScanVeplQR = () => {
    setVeplQR('');
    setSerialNumber('');
    setQuantityVepl('');
    VeplInputRef.current?.focus();
    // Alert.alert('Scan VEPL QR', 'QR Scanner would open. Data populated.');
  };
  
  
  const handleVeplQrChange = async (text) => {
    setVeplQR(text);
  
    const parts = text.split('|').map(part => part.trim());
    if (parts.length !== 2) {
      Toast.show({ type: 'error', text1: 'Invalid bin format (expected: Label | Count)' });
      return;
    }
  
    const [serialNo, veplQty] = parts;
    const totalVeplQty = parseInt(veplQty, 10) || 0;
  
    
    // setVeplQR(''); 
    const updated = await updateCustomerVepl(invoiceId, serialNo, totalVeplQty);
    
    Alert.alert('Vepl Scanned', `${totalVeplQty} items scanned.`);
  
    if (updated.status){
      Toast.show({ type: 'success', text1: 'All bins scanned. Status updated!' });
      await AsyncStorage.removeItem('activeVepl');
    }
  };

  const handleSubmitVerification = () => {
      // Add logic to submit or verify the data
      Toast.show({ type: 'info', text1: 'Data submitted for verification!' })
      // Potentially navigate back or to a success screen
      navigation.replace('MainApp'); 
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleBinLabelScan}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan Customer's Bin Label</Text>
        </TouchableOpacity>
        <StyledInput
          placeholder="Scanned Bin Label Data"
          value={invoiceQR}
          onChangeText={handleBinLabelChange}
          ref={binInputRef}
          editable={!formLocked}
        />
        <StyledInput label="Part Number" placeholder="Enter Part Number" value={partNumber} onChangeText={setPartNumber} />
        <StyledInput label="Part Name" placeholder="Enter Part Name" value={partName} onChangeText={setPartName} />
        <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} />
        <StyledInput label="Quantity" placeholder="Enter Quantity" value={totalQuantity} onChangeText={setTotalQuantity} keyboardType="numeric" />
        <StyledInput label="Bin Number" placeholder="Enter Bin Number" value={binNumber} onChangeText={setBinNumber} keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanVeplQR}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan VEPL QR</Text>
        </TouchableOpacity>
        <StyledInput placeholder="Scanned VEPL QR Data" value={veplQR} onChangeText={handleVeplQrChange} ref={VeplInputRef} editable={true} />
        <StyledInput label="Serial Number" placeholder="Enter Serial Number" value={serialNumber} onChangeText={setSerialNumber} />
        <StyledInput label="Quantity" placeholder="Enter Quantity" value={quantityVepl} onChangeText={setQuantityVepl} keyboardType="numeric" />
      </View>
      
      <StyledButton title="Submit Verification" onPress={handleSubmitVerification} style={{marginTop: 10}}/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGrayBackground,
  },
  contentContainer:{
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primaryOrange,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  scanButtonText: {
    marginLeft: 10,
    color: COLORS.primaryOrange,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerVeplVerificationScreen;
