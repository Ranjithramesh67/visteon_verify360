// VisteonApp/src/screens/CustomerVeplVerificationScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useState, useEffect, useRef } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCustomerVepl, updateCustomerVepl } from '../services/Api';
import Table from '../components/Table';
import { createCustomerTable, createVeplTable, getAllCustomerBinLabels, getCustomerByPartNo, getPartNameByPartNo, insertCustomer, insertVepl } from '../services/database';

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
  const [vistSerialNumber, setVistSerialNumber] = useState('');
  const [veplPartNo, setVeplPartNo] = useState('');
  const [quantityVepl, setQuantityVepl] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [formLocked, setFormLocked] = useState(false);

  const binInputRef = useRef(null);
  const VeplInputRef = useRef(null);
  const [disableKeyboard, setDisableKeyboard] = useState(true);

  const scrollViewRef = useRef(null);

  const setEmptyField = () => {
    setVeplQR('')
    setInvoiceQR('')
    setPartNumber('')
    setInvoiceNumber('');
    setPartName('');
    setScannedBinLabel('')
    setTotalQuantity('')
    setVistSerialNumber('')
    setQuantityVepl('')
    setVeplPartNo('')


  }

  const columns = [
    { label: 'S.No', key: 'serialNo' },
    // { label: 'C-Bin Label', key: 'binLabel' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Qty', key: 'scannedQty' },
    { label: 'V.S.No', key: 'vistSerialNo' },
    { label: 'Status', key: 'status' },
  ];

  const [tableData, setTableData] = useState([
    // { binLabel: '1234', partNo: '94013K6530', scannedQty: 10, status: 'pending' },
  ]);
  const [isNext, setIsNext] = useState(false);

  const fetchTableData = async () => {

    const invNum = await AsyncStorage.getItem('currInvNo')
    const partNum = await AsyncStorage.getItem('currPartNo')

    getAllCustomerBinLabels(partNum, invNum, (data) => {
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

  useEffect(() => {
    let timeout;
    const allComplete = tableData.length > 0 && tableData.every(item => item.status === 'complete');

    if (allComplete) {
      setIsNext(true);
      timeout = setTimeout(() => {
        binInputRef.current?.blur();
      }, 500);
      console.log('if')
    } else {
      setIsNext(false);
      console.log('else')
    }

    return () => clearTimeout(timeout);
  }, [tableData]);


  const parseStringData = (qrText) => {
    try {
      const hashSplit = qrText.split('#');
      const invoiceNo = hashSplit[1];
      const partSegment = hashSplit[0].trim();

      const qty = partSegment.slice(0, -10).slice(-4); // "0003"
      const partNo = partSegment.slice(-10); // "94013K6530"
      const binLbl = partSegment.slice(5, 13);
      const serialNo = partSegment.slice(11, 14);

      return {
        qty: parseInt(qty, 10),
        partNo,
        invoiceNo,
        binLbl,
        serialNo
      };
    } catch (err) {
      console.log('QR Parse error:', err.message);
      return null;
    }
  };

  const handleBinLabelScan = (e = null) => {
    // const sampleQR = 'TDASR250604068000394013K6530#25004672';

    // setInvoiceQR(sampleQR)
    const sampleQR = e?.nativeEvent?.text;
    setInvoiceQR(sampleQR)

    const parsed = parseStringData(sampleQR);
    if (!parsed) {
      Alert.alert('Scan Failed', 'Invalid QR format.');
      setInvoiceQR('')
      binInputRef.current?.focus();
      return;
    }

    const { qty, partNo, invoiceNo, binLbl, serialNo } = parsed;

    getPartNameByPartNo(partNo, (partNameResult) => {

      if (!partNameResult) {
        Alert.alert('Part Not Found', `No part name for ${partNo}`);
        setInvoiceQR('')
        binInputRef.current?.focus();
        return;
      }

      const invoiceObj = {
        invoiceNo,
        partNo: partNameResult.partNo,
        visteonPart: partNameResult.visteonPart,
        totalQty: qty,
        binlabel: binLbl,
        serialNo

      };

      console.log("customer screen: ", invoiceObj)


      insertCustomer(invoiceObj, (response) => {
        if (response.status === 'inserted') {
          // getCustomerByPartNo(invoiceNo, response.data.partNo, response.data.totalQty, (invoiceData) => {
          //   if (invoiceData) {
          //     console.log(invoiceData)
          //     // setInvoiceQR(e);
          //     setInvoiceNumber(invoiceData.invoiceNo);
          //     setPartNumber(invoiceData.partNo);
          //     setPartName(invoiceData.visteonPart);
          //     // setBinNumber(`${invoiceData.binNo}`);
          //     setSerialNumber(invoiceData.serialNo)
          //     setScannedBinLabel(`${invoiceData.binlabel}`)
          //     setTotalQuantity(`${invoiceData.totalQty}`)
          //     Toast.show({
          //       type: 'success',
          //       text1: 'Scan Success',
          //       text2: 'Customer data loaded from DB.',
          //       position: 'bottom',
          //       visibilityTime: 1300,
          //       topOffset: 5,
          //     });

          //     VeplInputRef.current?.focus();
          //   } else {
          //     Alert.alert('Error', 'Failed to retrieve invoice after insert.');
          //     setInvoiceQR('')
          //     binInputRef.current?.focus();
          //   }
          // });

          console.log(response.data)
          const { invoiceNo, partNo, visteonPart, serialNo, binlabel, scannedQty } = response.data;
          // setInvoiceQR(e);
          setInvoiceNumber(invoiceNo);
          setPartNumber(partNo);
          setPartName(visteonPart);
          // setBinNumber(`${binNo}`);
          setSerialNumber(serialNo)
          setScannedBinLabel(`${binlabel}`)
          setTotalQuantity(`${scannedQty}`)
          Toast.show({
            type: 'success',
            text1: 'Scan Success',
            text2: 'Customer data loaded from DB.',
            position: 'top',
            visibilityTime: 1300,
            topOffset: 5,
          });

          VeplInputRef.current?.focus();

        } else if (response.status === 'duplicate') {
          Toast.show({
            type: 'error',
            text1: 'Already Scanned',
            text2: 'Scan New Data...',
            position: 'top',
            visibilityTime: 1300,
            topOffset: 5,
          });
          setInvoiceQR('')
          binInputRef.current?.focus();

        }
        else {
          Alert.alert('Insertion Failed', `${invoiceObj.serialNo} Serial No Not Found.`);
          setInvoiceQR('')
          binInputRef.current?.focus();

        }
      });
    });
  };


  const handleScanVeplQR = (e = null) => {

    const sampQr = e?.nativeEvent?.text || veplQR;
    // const sampQr = '94013K6520 VPMHBF-10849-EPN C3630215 0003 04172025';
    // 94013K6500VPMHBF-10849-EMMC37968293
    

    setVeplQR(sampQr);

    // const serialNumber = sampQr.slice(26, 34);
    // const quantityVepl = parseInt(sampQr.slice(34, 38), 10);
    // const partNumber = sampQr.slice(0, 10);

    // const [partNumber, visteonNumber, vistSerialNumber, quantityVepl] = sampQr.split('/')

    const partNumber = sampQr.slice(0, 10);
    const visteonNumber = sampQr.slice(10, 26);
    const vistSerialNumber = sampQr.slice(26, 34);
    const quantityVepl = sampQr.slice(34);

    console.log(partNumber, visteonNumber, vistSerialNumber, quantityVepl)

    // console.log(quantityVepl, totalQuantity)

    if (!vistSerialNumber || !partNumber || !quantityVepl || !scannedbinLabel) {
      Alert.alert('Missing Data', 'Please fill all VEPL fields before submitting.');
      setVeplQR('')
      VeplInputRef.current?.focus();
      return;
    }

    if (quantityVepl != totalQuantity) {
      Toast.show({
        type: 'error',
        text1: 'Quantity Mismatch',
        text2: 'Scan valid qr',
        position: 'top',
        visibilityTime: 1300,
        topOffset: 5,
      });
      setVeplQR('');
      VeplInputRef.current?.focus();
      return
    }

    const veplData = {
      vistSerialNo: vistSerialNumber,
      partNo: partNumber,
      qty: parseInt(quantityVepl, 10),
      binLabel: scannedbinLabel,
      serialNo: serialNumber,
    };

    console.log(veplData)

    insertVepl(veplData, (success, errorMessage) => {
      if (success) {
        // Alert.alert('Success', 'VEPL data inserted and BinLabel updated.');
        Toast.show({
          type: 'success',
          text1: 'VEPL data inserted and updated!',
          visibilityTime: 1300,
          topOffset: 5,
          position: 'top'
        })
        setVistSerialNumber(veplData.vistSerialNo)
        setQuantityVepl(`${veplData.qty}`)
        setVeplPartNo(veplData.partNo)
        setEmptyField()
        fetchTableData();

        binInputRef.current?.focus();

      } else {
        Alert.alert('Failed', errorMessage || 'Error inserting VEPL data.');
        VeplInputRef.current?.focus();
      }
      setVeplQR('')
    });
  };


  const handleSubmitVerification = () => {
    // Add logic to submit or verify the data
    Toast.show({
      type: 'info',
      text1: 'Data submitted for verification!',
      visibilityTime: 1300,
      topOffset: 5,
      position: 'top'
    })
    // Potentially navigate back or to a success screen
    navigation.replace('BinLabelVerification');
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      binInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToVeplInput = () => {
    VeplInputRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true }); // -20 for slight offset above the input
      },
      error => {
        console.error('measureLayout error:', error);
      }
    );
  };

  const scrollToCustomerInput = () => {
    binInputRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true }); // -20 for slight offset above the input
      },
      error => {
        console.error('measureLayout error:', error);
      }
    );
  };


  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} ref={scrollViewRef}>
        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleBinLabelScan}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Customer's Bin Label</Text>
        </TouchableOpacity> */}
          <StyledInput
            placeholder="Scan Customer’s Bin Label"
            value={invoiceQR}
            ref={binInputRef}
            onChangeText={setInvoiceQR}
            onSubmitEditing={handleBinLabelScan}
            editable={!isNext}
            disableKeyboard={disableKeyboard}
            setDisableKeyboard={setDisableKeyboard}
            onFocus={scrollToCustomerInput}
          />
          <StyledInput label="Part Number" placeholder="Enter Part Number" value={(partNumber || '').replace(/([0-9]+)([A-Za-z]+)/, '$1-$2')} editable={false} />
          <StyledInput label="Visteon Part No" placeholder="Enter Visteon Part No" value={partName} editable={false} />
          <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} editable={false} />
          <StyledInput label="Quantity" placeholder="Enter Quantity" value={totalQuantity} editable={false} keyboardType="numeric" />
          {/* <StyledInput label="Bin Number" placeholder="Enter Bin Number" value={binNumber} keyboardType="numeric" /> */}
          {isNext && <View style={styles.disabledOverlay} pointerEvents="auto" />}

        </View>

        <View style={styles.card} >
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanVeplQR}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan VEPL QR</Text>
        </TouchableOpacity> */}
          <StyledInput onFocus={scrollToVeplInput} disableKeyboard={disableKeyboard} setDisableKeyboard={setDisableKeyboard} placeholder="Scanned VEPL QR Data" value={veplQR} onChangeText={setVeplQR} onSubmitEditing={handleScanVeplQR} ref={VeplInputRef} editable={!isNext} />
          <StyledInput label="Serial Number" placeholder="Enter Serial Number" value={vistSerialNumber} editable={false} />
          <StyledInput label="Part Number" placeholder="Enter Part Number" value={veplPartNo} editable={false} />
          <StyledInput label="Quantity" placeholder="Enter Quantity" value={quantityVepl} editable={false} keyboardType="numeric" />
          {isNext && <View style={styles.disabledOverlay} pointerEvents="auto" />}

        </View>

        <Table data={tableData} columns={columns} />

        <View style={{ marginTop: 50 }}></View>
      </ScrollView>

      <View style={styles.printButtonContainer}>
        <StyledButton title="Submit Verification" onPress={handleSubmitVerification} style={styles.printButton} disabled={!isNext} />
      </View>
    </>
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
  printButtonContainer: {
    marginTop: 10,
    width: '100%',
    position: 'absolute',
    bottom: 0
  },
  printButton: {
    // marginTop: 10,
    width: '80%',
    alignSelf: 'center',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15, // Match card borderRadius
    zIndex: 1,
  }
});

export default CustomerVeplVerificationScreen;
