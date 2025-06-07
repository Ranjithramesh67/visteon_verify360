//  TDAS|P25041805|00003|94013K6530|CLUSTER ASSY-INSTRUMENT|25001195 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';

import { createInvoice, updateScannedBin } from '../services/Api';

const STORAGE_KEY = 'invoiceFormData';

const InvoiceBinVerificationScreen = ({ navigation }) => {
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceQR, setInvoiceQR] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [binLabelQR, setBinLabelQR] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [formLocked, setFormLocked] = useState(false);

  const qrInputRef = useRef(null);
  const binInputRef = useRef(null);

  useEffect(() => {
    // AsyncStorage.removeItem(STORAGE_KEY)
    // AsyncStorage.clear()
    const loadSavedForm = async () => {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const {
          invoiceQR,
          invoiceNumber,
          partNumber,
          partName,
          totalQuantity,
        } = JSON.parse(data);
        setInvoiceQR(invoiceQR);
        setInvoiceNumber(invoiceNumber);
        setPartNumber(partNumber);
        setPartName(partName);
        setTotalQuantity(totalQuantity);
        setRemainingQuantity(parseInt(totalQuantity, 10));
        setFormLocked(true);
      }
    };
    loadSavedForm();
  }, []);

  useEffect(() => {
      if (formLocked) {
        const totalQty = parseInt(totalQuantity, 10) || 0;
        setRemainingQuantity(totalQty - scannedQuantity);
      }
  }, [scannedQuantity]);

  // useEffect(() => {
  //   resetForm();
  // }, [remainingQuantity]);

  const resetForm = ()=>{
    if (remainingQuantity === 0 && formLocked) {
      setFormLocked(false);
      setInvoiceQR('');
      setInvoiceNumber('');
      setPartNumber('');
      setPartName('');
      setTotalQuantity('');
      setScannedQuantity(0);
      setBinLabelQR('');
      AsyncStorage.removeItem(STORAGE_KEY);
      Alert.alert('Completed', 'All bins scanned. Ready for new invoice.');
    }
  }

  const handleScanInvoiceQR = () => {
    if (!formLocked) {
      qrInputRef.current?.focus();
    } else {
      Alert.alert('Invoice Locked', 'Complete current invoice before scanning a new one.');
    }
  };

  const handleQRTextChange = async (text) => {
    setInvoiceQR(text);
    const parts = text.trim().split('|');
    if (parts.length === 6) {
      const [, , qty, partNo, partName, invoiceNo] = parts;
      setInvoiceNumber(invoiceNo);
      setPartNumber(partNo);
      setPartName(partName);
      setTotalQuantity(qty);
      setRemainingQuantity(parseInt(qty, 10));
      setFormLocked(true);
      const invoiceData = {
        invoice_number: invoiceNo,
        part_number: partNo,
        part_name: partName,
        total_qty: parseInt(qty, 10),
        scanned: [],
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
        })
      );
      try {
        const saved = await createInvoice(invoiceData);
        console.log(saved);
        await AsyncStorage.setItem('activeInvoice', JSON.stringify(saved));
        setInvoiceId(saved[0].id);
        setInvoiceNumber(invoiceNo);
        setPartNumber(partNo);
        setPartName(partName);
        setTotalQuantity(qty);
        setFormLocked(true);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Invoice save failed' });
      }
    } else {
      Toast.show({ type: 'error', text1: 'Invalid QR format' });
    }
  };

  const handleScanBinLabels = () => {
    if (remainingQuantity <= 0) {
      Alert.alert('Done', 'All bins have already been scanned.');
      return;
    }
    if (!invoiceId) {
      Alert.alert('Error', 'Invoice ID may be missing.');
      return;
    }
    setBinLabelQR('');
    binInputRef.current?.focus();
  };
  

  const handleBinLabelChange = async (text) => {
    setBinLabelQR(text);
  
    const parts = text.split('|').map(part => part.trim());
    if (parts.length !== 2 || isNaN(parts[1])) {
      Toast.show({ type: 'error', text1: 'Invalid bin format (expected: Label | Count)' });
      return;
    }
  
    const [label, countStr] = parts;
    const binCount = parseInt(countStr, 10);
    const totalQty = parseInt(totalQuantity, 10) || 0;
  
    
    const updatedScanned = await Math.min(scannedQuantity + binCount, totalQty);
    setScannedQuantity(updatedScanned);
    await setRemainingQuantity(totalQty - updatedScanned);
    setBinLabelQR(''); 
    const updated = await updateScannedBin(invoiceId, label, totalQty - updatedScanned);
    
    Alert.alert('Bin Scanned', `${binCount} items scanned.`);
  
    if (updated.status || (totalQty - updatedScanned) === 0) {
      Toast.show({ type: 'success', text1: 'All bins scanned. Status updated!' });
      await AsyncStorage.removeItem('activeInvoice');
    }
  };

  const handleNext = () => {
    if(remainingQuantity <= 0) {
      Alert.alert('Print Label', 'All done');
      navigation.navigate('CustomerVeplVerification');
    } else {
      Alert.alert('Print Label', 'You show complete the all the remaining scans');
    }
    
  };

  const progress =
    totalQuantity > 0
      ? (scannedQuantity / (parseInt(totalQuantity, 10) || 1)) * 100
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanInvoiceQR}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Invoice QR</Text>
        </TouchableOpacity>
        <TextInput
          ref={qrInputRef}
          style={[styles.qrInput, formLocked && { backgroundColor: '#eee' }]}
          placeholder="Scan QR here"
          onChangeText={handleQRTextChange}
          value={invoiceQR}
          editable={!formLocked}
        />
        <StyledInput label="Invoice Number" value={invoiceNumber} placeholder={'Invoice number'} editable={false} />
        <StyledInput label="Part Number" value={partNumber} placeholder={'Part number'} editable={false} />
        <StyledInput label="Part Name" value={partName} placeholder={'Part name'} editable={false} />
        <StyledInput
          label="Total Quantity"
          value={totalQuantity.toString()}
          editable={false}
        />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanBinLabels}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Bin Labels</Text>
        </TouchableOpacity>
        <StyledInput
          placeholder="Scanned Bin Label Data"
          value={binLabelQR}
          onChangeText={handleBinLabelChange}
          ref={binInputRef}
          editable={true}
        />

        <View style={styles.quantityContainer}>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityValue}>{scannedQuantity}</Text>
            <Text style={styles.quantityLabel}>Scanned Quantity</Text>
          </View>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityValue}>{remainingQuantity}</Text>
            <Text style={styles.quantityLabel}>Remaining Quantity</Text>
          </View>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarForeground, { width: `${progress}%` }]} />
        </View>
      </View>

      <StyledButton
        title="Next"
        onPress={handleNext}
        style={styles.printButton}
        disabled={remainingQuantity!=0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrayBackground },
  contentContainer: { padding: 20 },
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
    borderWidth: 1,
    borderColor: COLORS.primaryOrange,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  scanButtonText: {
    marginLeft: 10,
    color: COLORS.primaryOrange,
    fontSize: 16,
    fontWeight: '600',
  },
  qrInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
  },
  quantityBox: {
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primaryOrange,
  },
  quantityLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarForeground: {
    height: '100%',
    backgroundColor: COLORS.accentGreen,
    borderRadius: 5,
  },
  printButton: {
    marginTop: 10,
  },
});

export default InvoiceBinVerificationScreen;


