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
import { clearInvoiceTable, createBinLabelTable, createInvoiceTable, getAllBinLabels, getInvoiceByInvoiceNoAndPartNo, getPartNameByPartNo, insertBinLabel, insertInvoice } from '../services/database';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('screen')

const InvoiceBinVerificationScreen = ({ navigation }) => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'C-Bin Label', key: 'binLabel' },
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

  useEffect(() => {
    const init = async () => {
      createInvoiceTable();
      createBinLabelTable();
    };
    init();
  }, []);



  const parseInvoiceQR = (qrText = '') => {
    try {

      console.log("qrText", qrText)
      const hashSplit = qrText.split('\n');
      console.log("hashSplit", hashSplit)
      const value = hashSplit[1].slice('\t');
      console.log("va", value)
      const invoiceNo = value[0];
      console.log("invoice", invoiceNo)
      const partSegment = hashSplit[0].trim();
      console.log("partSegment", partSegment);

      const qty = value[1].slice(9, hashSplit[2].length); // "00003"
      const partNo = hashSplit[0].slice(13, partSegment.length).trim(); // "94013K6530"

      const resp = {
        qty: parseInt(qty, 10),
        partNo,
        invoiceNo
      };
      console.log("resp", resp);
      return resp
    } catch (err) {
      console.log('❌ QR Parse error:', err.message);
      return null;
    }
  };


  const handleScanInvoiceQR = (e = null) => {

    try {
      // const sampleQR = 'TDASR250604080000394013k6530#25001195';
      console.log("eeeee", e)

      setInvoiceQR(e)

      const parsed = parseInvoiceQR(e);
      if (!parsed) {
        Alert.alert('Scan Failed', 'Invalid QR format.');
        return;
      }

      const { qty, partNo, invoiceNo } = parsed;

      getPartNameByPartNo(partNo, (partNameResult) => {
        console.log("paaaaaaarrrr", partNameResult)
        if (!partNameResult) {
          Alert.alert('Part Not Found', `No part name for ${partNo}`);
          return;
        }

        const invoiceObj = {
          invoiceNo,
          partNo: partNameResult.partNo,
          partName: partNameResult.partName,
          totalQty: qty,
        };

        console.log("first", invoiceObj)


        insertInvoice(invoiceObj, (success) => {
          if (success) {
            getInvoiceByInvoiceNoAndPartNo(invoiceNo, invoiceObj.partNo, (invoiceData) => {
              if (invoiceData) {
                setInvoiceQR(e);
                setInvoiceNumber(invoiceData.invoiceNo);
                setPartNumber(invoiceData.partNo);
                setPartName(invoiceData.partName);
                setTotalQuantity(`${invoiceData.totalQty}`)
                setScannedQuantity(0);
                setRemainingQuantity(invoiceData.totalQty);
                // Alert.alert('Scan Success', 'Invoice data loaded from DB.');
                Toast.show({
                  type: 'success',
                  text1: 'Scan Success',
                  text2: 'Invoice data loaded from DB.',
                  position: 'bottom',
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

  const loadBinLabels = () => {
    getAllBinLabels((data) => {
      const updated = data.map((item, index) => ({
        ...item,
      }));

      console.log(updated)
      setTableData(updated);
    });
  };

  const handleScanBinLabels = (e = null) => {
    const total = parseInt(totalQuantity, 10) || 0;

    if (scannedQuantity >= total) {
      Alert.alert('Bin is empty', 'All quantity scanned.');
      return;
    }

    const sampQr = e

    const scannedQty = parseInt(sampQr.slice(0, 4), 10);
    const binLabel = sampQr.slice(4);

    insertBinLabel(
      {
        invoiceNo: invoiceNumber,
        partNo: partNumber,
        binLabel,
        scannedQty
      },
      () => {
        const newScanned = scannedQuantity + scannedQty;

        setScannedQuantity(newScanned);
        setRemainingQuantity(total - newScanned);
        setBinLabelQR(binLabel);
        setBinCount(prev => prev + 1);
        loadBinLabels();

        if (newScanned >= total) {
          Alert.alert('✅ Completed', 'All quantity scanned.');
        } else {
          Alert.alert('Scan Success', `1 item scanned. Remaining: ${total - newScanned}`);
        }
      }
    );

  };


  const handleNext = () => {
    if (remainingQuantity <= 0) {
      Alert.alert('Print Label', 'All done');
      navigation.navigate('CustomerVeplVerification');
    } else {
      Alert.alert('Print Label', 'You show complete the all the remaining scans');
    }

  };


  const progress = totalQuantity > 0 ? (scannedQuantity / (parseInt(totalQuantity, 10) || 1)) * 100 : 0;


  const invoiceInputRef = useRef(null);
  const binLabelInputRef = useRef(null);

  useEffect(() => {
    // loadBinLabels();
    invoiceInputRef.current?.focus();
    // Keyboard.dismiss();
  }, []);



  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        {/* <Button title="Clear Table" onPress={clearInvoiceTable} /> */}

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanInvoiceQR}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan Invoice QR</Text>
          </TouchableOpacity> */}
          <StyledInput ref={invoiceInputRef} placeholder="Invoice QR Data" value={invoiceQR} onChangeText={handleScanInvoiceQR} editable={true} autoFocus />
          <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} editable={false} />
          <StyledInput label="Part Number" placeholder="Enter Part Number" value={partNumber} editable={false} />
          <StyledInput label="Part Name" placeholder="Enter Part Name" value={partName} editable={false} />
          <StyledInput label="Total Quantity" placeholder="Enter Total Quantity" value={totalQuantity} editable={false} />
        </View>

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanBinLabels}>
            <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
            <Text style={styles.scanButtonText}>Scan Bin Labels</Text>
          </TouchableOpacity> */}
          <StyledInput ref={binLabelInputRef} placeholder="Scanned Bin Label Data" value={binLabelQR} onChangeText={handleScanBinLabels} />

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

        <Table data={tableData} columns={columns} />
      </ScrollView>
      <View style={styles.printButtonContainer}>
        <StyledButton
          title="Next"
          onPress={handleNext}
          style={styles.printButton}
          disabled={remainingQuantity != 0}
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
  }
});

export default InvoiceBinVerificationScreen;


