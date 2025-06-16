//  TDAS|P25041805|00003|94013K6530|CLUSTER ASSY-INSTRUMENT|25001195 
//                 qty |    partno  |                      | invoice no
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';

import Table from '../components/Table';
import { clearInvoiceTable, createCustomerBinLabelTable, checkDup, createInvoiceTable, getAllCustomerBinLabels, getInvoiceByInvoiceNoAndPartNo, getPartNameByPartNo, insertCustomerBinLabel, insertInvoice } from '../services/database';
import Toast from 'react-native-toast-message';
import theme from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('screen')

const InvoiceBinVerificationScreen = ({ navigation }) => {

  const columns = [
    { label: 'S.No', key: 'serialNo' },
    // { label: 'C-Bin Label', key: 'binLabel' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Quantity', key: 'scannedQty' }
  ];

  const [tableData, setTableData] = useState([
    // { binLabel: '1234', partNo: '94013K6530', scannedQty: 10 },
  ]);

  const [invoiceQR, setInvoiceQR] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('0');
  const [binLabelQR, setBinLabelQR] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState(parseInt(totalQuantity, 10));

  const [isDisabled, setIsDisabled] = useState(false);
  const [isFormDisable, setIsFormDisable] = useState(false);


  useEffect(() => {
    const init = async () => {
      createInvoiceTable();
      createCustomerBinLabelTable();
    };
    init();
  }, []);

  const parseInvoiceQR = (qrText) => {
    try {
      console.log("qrText", qrText)
      const hashSplit = qrText.split('\n');
      if (hashSplit.length < 2) throw new Error('Invalid QR: missing lines');

      const partSegment = hashSplit[0].trim();
      const value = hashSplit[1].trim().split(/\s+/); // <-- fix here

      if (value.length < 1) throw new Error('Invalid QR: missing qty');

      const invoiceNo = value[0];
      const qtyStr = value[1] || '0'; //1006202512

      const invDate = qtyStr.slice(0, 8)

      const qty = parseInt(qtyStr.slice(8), 10);

      console.log("qty", qty)

      const unFormatPartNo = partSegment.slice(12).trim();
      const partNo = unFormatPartNo;

      const resp = { qty, partNo, invoiceNo, invDate };
      console.log("resp", resp);

      setInvoiceNumber(invoiceNo)
      setTotalQuantity(qty)
      setRemainingQuantity(qty)
      setPartNumber(partNo)

      return resp;
    } catch (err) {
      console.log('❌ QR Parse error:', err.message);
      return null;
    }
  };




  const handleScanInvoiceQR = (e = null) => {

    try {
      //       const sampleQr = `00550000051794013K6520
      // 25005081 1006202512 73185.80 8708.99.004210TDAS 8004.70 0.00 0.00 4764.70 57176.40 8004.70 0.00 0.00 57176.40 0.00 0.00 0.00 33AAFCV3650H1ZF`

      const sampleQr = e?.nativeEvent?.text || invoiceQR;
      // const sampleQr = invoiceQR;
      setInvoiceQR(sampleQr)

      // console.log(sampleQr)

      const parsed = parseInvoiceQR(sampleQr);
      if (!parsed) {
        Alert.alert('Scan Failed', 'Invalid QR format.');
        setInvoiceQR('')
        invoiceInputRef.current?.focus();
        return;
      }

      const { qty, partNo, invoiceNo, invDate } = parsed;

      // console.log(qty, partNo, invoiceNo)

      getPartNameByPartNo(partNo, (partNameResult) => {
        console.log("paaaaaaarrrr", partNameResult)
        // if (!partNameResult) {
        //   Alert.alert('Part Not Found', `No part name for ${partNo}`);
        //   return;
        // }

        const invoiceObj = {
          invoiceNo,
          partNo,
          // partName: partNameResult.partName,
          totalQty: qty,
          invDate: invDate,
        };

        // console.log("first", invoiceObj)
        setPartName(partNameResult.visteonPart);


        insertInvoice(invoiceObj, (response) => {
          if (response.status === 'inserted' || response.status === 'duplicate') {

            getInvoiceByInvoiceNoAndPartNo(invoiceNo, response.data.partNo, async (invoiceData) => {
              if (invoiceData) {
                console.log("last :", invoiceData)
                // setInvoiceQR(e);
                setInvoiceNumber(invoiceData.invoiceNo);
                await AsyncStorage.setItem('currInvNo', invoiceData.invoiceNo)
                await AsyncStorage.setItem('currPartNo', invoiceData.partNo)
                await AsyncStorage.setItem('currPartName', partNameResult.visteonPart)
                setPartNumber(invoiceData.partNo);
                // setPartName(invoiceData.partName);
                setTotalQuantity(`${invoiceData.orgQty}`)
                setScannedQuantity(invoiceData.orgQty - invoiceData.totalQty);
                setRemainingQuantity(invoiceData.totalQty);
                // Alert.alert('Scan Success', 'Invoice data loaded from DB.');

                loadBinLabels(invoiceData.partNo, invoiceData.invoiceNo);

                Toast.show({
                  type: 'success',
                  text1: 'Scan Success',
                  text2: 'Invoice data loaded from DB.',
                  position: 'top',
                  visibilityTime: 1300,
                  topOffset: 5,
                });

                binLabelInputRef.current?.focus();
              } else {
                Alert.alert('Error', 'Failed to retrieve invoice after insert.');
              }
            });

          } else {
            Alert.alert('Insert Failed', 'Invoice insert failed.');
          }
        });
      });
    } catch (err) {
      console.error("Error in Invoice Scan", err)
    }
  };



  const [binCount, setBinCount] = useState(0);

  const loadBinLabels = (partNo, invoiceNo) => {
    getAllCustomerBinLabels(partNo, invoiceNo, (data) => {
      const updated = data.map((item, index) => ({
        ...item,
      }));

      console.log(updated)
      setTableData(updated);
    });
  };

  const handleScanBinLabels = (e = null) => {

    const total = parseInt(remainingQuantity, 10) || 0;

    if (0 >= total) {
      Alert.alert('Bin is empty', 'All quantity scanned.');
      setBinLabelQR('')
      return;
    }

    const sampQr = e?.nativeEvent?.text || binLabelQR; // e.g., 'TDASR250604068000394013K6530#25004672'
    setBinLabelQR(sampQr);

    const sannedcustomerQrData = sampQr.split('#');
    const qrLeft = sannedcustomerQrData[0]; // "TDASR250604068000394013K6530"
    const qrRight = sannedcustomerQrData[1];
    const scannedQty = parseInt(sampQr.slice(14, 18), 10);
    const invoiceNo = qrRight;
    const serialNo = sampQr.slice(11, 14);
    const partNo = qrLeft.slice(-10); // "94013K6530"
    const binLabel = qrLeft.slice(5, 13); // e.g., "25060406"

    const insertData = {
      invoiceNo,
      partNo,
      binLabel,
      serialNo,
      scannedQty,
      partName
    };

    // console.log("below:", insertData);

    if (invoiceNo != invoiceNumber) {
      Toast.show({
        type: 'error',
        text1: 'Invoice Data Mismatch',
        text2: 'Scan valid qr',
        position: 'top',
        visibilityTime: 1300,
        topOffset: 5,
      });
      setBinLabelQR('');
      binLabelInputRef.current?.focus();
      return
    }

    insertCustomerBinLabel(
      insertData,
      (success) => {
        if (success) {
          const newScanned = scannedQuantity + scannedQty;

          console.log(newScanned)


          setScannedQuantity(newScanned);
          setRemainingQuantity(total - scannedQty);
          setBinLabelQR('');
          setBinCount(prev => prev + 1);
          loadBinLabels(partNo, invoiceNo);

          if (total - scannedQty <= 0) {
            Alert.alert('✅ Completed', 'All quantity scanned.');
          } else {
            // Alert.alert('Scan Success', `1 item scanned. Remaining: ${total - scannedQty}`);
            Toast.show({
              type: 'success',
              text1: 'Scan Success',
              text2: 'Item scanned.',
              position: 'top',
              visibilityTime: 1300,
              topOffset: 5,
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Bin Data Mismatch',
            text2: 'Scan valid qr',
            position: 'top',
            visibilityTime: 1300,
            topOffset: 5,
          });
          setBinLabelQR('');
          binLabelInputRef.current?.focus();

        }

        setBinLabelQR('');
      }
    );

  };


  const handleNext = () => {
    if (remainingQuantity <= 0) {
      navigation.replace('CustomerVeplVerification');
    } else {
      Alert.alert('Print Label', 'You show complete the all the remaining scans');
    }

  };


  const progress = totalQuantity > 0 ? (scannedQuantity / (parseInt(totalQuantity, 10) || 1)) * 100 : 0;


  const invoiceInputRef = useRef(null);
  const binLabelInputRef = useRef(null);
  const [disableKeyboard, setDisableKeyboard] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      invoiceInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    if ((remainingQuantity === 0 && scannedQuantity === 0) || remainingQuantity !== 0) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
      invoiceInputRef.current?.blur();
      binLabelInputRef.current?.blur();
    }
  }, [remainingQuantity, scannedQuantity]);


  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        {/* <Button title="Clear Table" onPress={clearInvoiceTable} /> */}

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanInvoiceQR}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan Invoice QR</Text>
          </TouchableOpacity> */}
          <StyledInput ref={invoiceInputRef} disableKeyboard={disableKeyboard} editable={isDisabled} setDisableKeyboard={setDisableKeyboard} placeholder="Invoice QR Data" value={invoiceQR} onChangeText={setInvoiceQR} onSubmitEditing={handleScanInvoiceQR} returnKeyType="done" autoFocus />
          <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} editable={false} />
          <StyledInput label="Customer Part Number" placeholder="Enter Part Number" value={partNumber} editable={false} />
          {/* <StyledInput label="Part Name" placeholder="Enter Part Name" value={partName} editable={false} /> */}
          <StyledInput label="Total Quantity" placeholder="Enter Total Quantity" value={totalQuantity} editable={false} />

          {!isDisabled && <View style={styles.disabledOverlay} pointerEvents="auto" />}
        </View>

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanBinLabels}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan Bin Labels</Text>
          </TouchableOpacity> */}
          <StyledInput ref={binLabelInputRef} disableKeyboard={disableKeyboard} editable={isDisabled} setDisableKeyboard={setDisableKeyboard} placeholder="Scan Customer’s Bin Label" value={binLabelQR} onSubmitEditing={handleScanBinLabels} onChangeText={setBinLabelQR} />

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

          {!isDisabled && <View style={styles.disabledOverlay} pointerEvents="auto" />}

        </View>

        <Table data={tableData} columns={columns} />
      </ScrollView>
      <View style={styles.printButtonContainer}>
        <StyledButton
          title="Next"
          onPress={handleNext}
          style={styles.printButton}
          disabled={isDisabled}
        />
      </View>
    </>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrayBackground },
  contentContainer: { padding: 20, paddingBottom: 70 },
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
    fontFamily: theme.fonts.dmBold,
    color: COLORS.primaryOrange,
  },
  quantityLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 5,
    fontFamily: theme.fonts.dmMedium,
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
    // marginTop: 10,
    width: '80%',
    alignSelf: 'center',
  },
  printButtonContainer: {
    marginTop: 10,
    width: '100%',
    // backgroundColor: 'rgba(0,0,0,1)',
    // height: height,
    position: 'absolute',
    bottom: 0
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15, // Match card borderRadius
    zIndex: 1,
  }

});

export default InvoiceBinVerificationScreen;


