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
import Table from '../components/Table';
import { createCustomerTable, createVeplTable, getAllBinLabels, getCustomerByPartNo, getPartNameByPartNo, insertCustomer, insertVepl } from '../services/database';

const STORAGE_KEY = 'VEPLFormData';

const CustomerVeplVerificationScreen = ({ navigation }) => {
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceQR, setInvoiceQR] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [binNumber, setBinNumber] = useState('');
  const [scannedbinLabel, setScannedBinLabel] = useState('');

  const [veplQR, setVeplQR] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [veplPartNo, setVeplPartNo] = useState('');
  const [quantityVepl, setQuantityVepl] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [formLocked, setFormLocked] = useState(false);

  const binInputRef = useRef(null);
  const VeplInputRef = useRef(null);

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'C-Bin Label', key: 'binLabel' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Qty', key: 'scannedQty' },
    { label: 'Status', key: 'status' },
  ];

  const [tableData, setTableData] = useState([
    // { binLabel: '1234', partNo: '94013K6530', scannedQty: 10, status: 'pending' },
  ]);

  const fetchTableData = async () => {
    getAllBinLabels((data) => {
      const updated = data.map((item, index) => ({
        ...item,
      }));

      console.log(updated)
      setTableData(updated);
    });
  }

  useEffect(() => {
    const init = async () => {
      createCustomerTable();
      createVeplTable();
      fetchTableData();

    };
    init();
  }, []);

  const parseStringData = (qrText) => {
    try {
      const hashSplit = qrText.split('#');
      const invoiceNo = hashSplit[1];
      const partSegment = hashSplit[0].trim();

      const qty = partSegment.slice(10, 15); // "00003"
      const partNo = partSegment.slice(16, 26).trim(); // "94013K6530"
      const binLbl = partSegment.slice(5, 9).trim(); // "BIN1"
      const binNo = 1;

      return {
        qty: parseInt(qty, 10),
        partNo,
        invoiceNo,
        binLbl,
        binNo
      };
    } catch (err) {
      console.log('QR Parse error:', err.message);
      return null;
    }
  };

  const handleBinLabelScan = (e = null) => {
    // const sampleQR = 'TDAS BIN1 00003 94013K6530 CLUSTER ASSY-INSTRUMENT#25001195';

    setInvoiceQR(e)

    const parsed = parseStringData(e);
    if (!parsed) {
      Alert.alert('Scan Failed', 'Invalid QR format.');
      return;
    }

    const { qty, partNo, invoiceNo, binLbl, binNo } = parsed;

    getPartNameByPartNo(partNo, (partNameResult) => {

      if (!partNameResult) {
        Alert.alert('Part Not Found', `No part name for ${partNo}`);
        return;
      }

      const invoiceObj = {
        invoiceNo,
        partNo: partNameResult.partNo,
        partName: partNameResult.partName,
        totalQty: qty,
        binlabel: binLbl,
        binNo

      };

      console.log(invoiceObj)


      insertCustomer(invoiceObj, (success) => {
        if (success) {
          getCustomerByPartNo(invoiceNo, invoiceObj.partNo, (invoiceData) => {
            if (invoiceData) {
              console.log(invoiceData)
              setInvoiceQR(e);
              setInvoiceNumber(invoiceData.invoiceNo);
              setPartNumber(invoiceData.partNo);
              setPartName(invoiceData.partName);
              setBinNumber(`${invoiceData.binNo}`);
              setScannedBinLabel(`${invoiceData.binlabel}`)
              setTotalQuantity(`${invoiceData.totalQty}`)
              Toast.show({
                type: 'success',
                text1: 'Scan Success',
                text2: 'Customer data loaded from DB.',
                position: 'bottom',
              });

              VeplInputRef.current?.focus();
            } else {
              Alert.alert('Error', 'Failed to retrieve invoice after insert.');
            }
          });
        } else {
          Alert.alert('Insert Failed', 'Invoice insert failed.');
        }
      });
    });
  };


  const handleScanVeplQR = (e = null) => {

    const sampQr = e;

    const serialNumber = sampQr.slice(0, 5);
    const quantityVepl = parseInt(sampQr.slice(5, 9), 10);
    const partNumber = sampQr.slice(9);

    // console.log(serialNumber, partNumber, quantityVepl, scannedbinLabel)

    if (!serialNumber || !partNumber || !quantityVepl || !scannedbinLabel) {
      Alert.alert('Missing Data', 'Please fill all VEPL fields before submitting.');
      return;
    }

    const veplData = {
      serialNo: serialNumber,
      partNo: partNumber,
      qty: parseInt(quantityVepl, 10),
      binLabel: scannedbinLabel,
    };

    insertVepl(veplData, (success, errorMessage) => {
      if (success) {
        Alert.alert('Success', 'VEPL data inserted and BinLabel updated.');
        setSerialNumber(veplData.serialNo)
        setQuantityVepl(`${veplData.qty}`)
        setVeplPartNo(veplData.partNo)
        fetchTableData();
      } else {
        Alert.alert('Failed', errorMessage || 'Error inserting VEPL data.');
      }
    });
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
        {/* <TouchableOpacity style={styles.scanButton} onPress={handleBinLabelScan}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Customer's Bin Label</Text>
        </TouchableOpacity> */}
        <StyledInput
          placeholder="Scanned Bin Label Data"
          value={invoiceQR}
          ref={binInputRef}
          onChangeText={handleBinLabelScan}
          editable={true}
          autoFocus
        />
        <StyledInput label="Part Number" placeholder="Enter Part Number" value={partNumber} />
        <StyledInput label="Part Name" placeholder="Enter Part Name" value={partName} />
        <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} />
        <StyledInput label="Quantity" placeholder="Enter Quantity" value={totalQuantity} keyboardType="numeric" />
        <StyledInput label="Bin Number" placeholder="Enter Bin Number" value={binNumber} keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanVeplQR}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan VEPL QR</Text>
        </TouchableOpacity> */}
        <StyledInput placeholder="Scanned VEPL QR Data" value={veplQR} onChangeText={handleScanVeplQR} ref={VeplInputRef} editable={true} />
        <StyledInput label="Serial Number" placeholder="Enter Serial Number" value={serialNumber} />
        <StyledInput label="Part Number" placeholder="Enter Part Number" value={veplPartNo} />
        <StyledInput label="Quantity" placeholder="Enter Quantity" value={quantityVepl} keyboardType="numeric" />
      </View>

      <Table data={tableData} columns={columns} />

      <StyledButton title="Submit Verification" onPress={handleSubmitVerification} style={{ marginTop: 10 }} />


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGrayBackground,
  },
  contentContainer: {
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
