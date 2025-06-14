// VisteonApp/src/screens/BinLabelVerificationScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';
import { clearInvoiceTable, createBinTable, getBinDataByPartNo, getInvoiceByInvoiceNoAndPartNo, getPartNameByPartNo, insertBinLabel, updateBinLabel } from '../services/database';
import HeaderBar from '../components/HeaderBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { printQr } from "../services/printConfig"
import Toast from 'react-native-toast-message';

const BinLabelVerificationScreen = ({ navigation }) => {
  const [invoiceQR, setInvoiceQR] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(0); // Pre-filled as per UI
  const [binLabelQR, setBinLabelQR] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0); // Initial scanned quantity
  const [remainingQuantity, setRemainingQuantity] = useState(parseInt(totalQuantity, 10));

  const [isSkipped, setIsSkipped] = useState(false)

  const binInputRef = useRef(null);
  const partLabelInputRef = useRef(null);
  const [disableKeyboard, setDisableKeyboard] = useState(true);


  useEffect(() => {
    const init = async () => {
      createBinTable();
    };
    init();
  }, []);

  useEffect(() => {
    if (remainingQuantity == 0 && scannedQuantity > 0) {
      setIsSkipped(true);
      binInputRef.current?.blur();
    } else {
      setIsSkipped(false);
    }
  }, [remainingQuantity])



  const handleScanInvoiceQR = (e = null) => {
    const sampQr = e?.nativeEvent?.text || invoiceQR;
    // const sampQr = '94013K6520VPMHBF-10849-EPNC3630215000304172025';

    setInvoiceQR(sampQr);

    const [partNo, visteonNumber, serialNumber, quantityBin] = sampQr.split('/')

    console.log(serialNumber, partNo, quantityBin)

    if (!serialNumber || !partNo || !quantityBin) {
      Alert.alert('Missing Data', 'Please fill all fields before submitting.');
      setInvoiceQR('')
      binInputRef.current?.focus();
      return;
    }

    getPartNameByPartNo(partNo, (partNameResult) => {
      if (!partNameResult) {
        Alert.alert('Part Not Found', `No part name for ${partNo}`);
        setInvoiceQR('')
        binInputRef.current?.focus();
        return;
      }

      const invoiceObj = {
        partNo: partNameResult.partNo,
        visteonPart: partNameResult.visteonPart,
        totalQty: quantityBin,
        serialNo: serialNumber

      };

      // console.log(invoiceObj)



      insertBinLabel(invoiceObj, (response) => {
        if (response.status === 'inserted' || response.status === 'duplicate') {
          getBinDataByPartNo(serialNumber, response.data.partNo, (binData) => {
            if (binData) {
              // console.log(binData)
              // setInvoiceQR(e);
              setSerialNumber(binData.serialNo);
              setPartNumber(binData.partNo);
              setPartName(binData.visteonPart);
              // setBinNumber(`${binData.binNo}`);
              setTotalQuantity(`${binData.orgQty}`)
              setScannedQuantity(binData.orgQty - binData.totalQty);
              setRemainingQuantity(binData.totalQty);

              console.log(partName, partNumber, serialNumber, totalQuantity)

              Toast.show({
                type: 'success',
                text1: 'Scan Success',
                text2: 'Customer data loaded from DB.',
                position: 'bottom',
                visibilityTime: 1300,
                topOffset: 5,
              });

              partLabelInputRef.current?.focus();
            } else {
              Alert.alert('Error', 'Failed to retrieve binlabel after insert.');
              setInvoiceQR('')
              binInputRef.current?.focus();
            }
          });
        } else {
          Alert.alert('Insert Failed', 'binlabel insert failed.');
          setInvoiceQR('')
          binInputRef.current?.focus();
        }
      });
    });




  };

  const handleScanBinLabels = (e = null) => {
    const sampQr = e?.nativeEvent?.text || binLabelQR;
    // const sampQr = '94013K6520';

    setBinLabelQR(sampQr);
    const partNumber = sampQr;
    const scanQty = 1;

    const total = parseInt(remainingQuantity, 10) || 0;

    if (total <= 0) {
      Alert.alert('Bin is empty', 'All quantity scanned.');
      setBinLabelQR('')
      partLabelInputRef.current?.focus();
      return;
    }


    if (!partNumber || !serialNumber) {
      Alert.alert('Missing Data', 'Please fill all fields before submitting.');
      setBinLabelQR('')
      partLabelInputRef.current?.focus();
      return;
    }

    const binData = {
      serialNo: serialNumber,
      partNo: partNumber,
      scannedQty: scanQty
    };

    console.log(binData)

    updateBinLabel(
      binData,
      (success) => {
        if (success) {
          const newScanned = scannedQuantity + scanQty;
          setScannedQuantity(newScanned);
          setRemainingQuantity(total - scanQty);
          setBinLabelQR('');
          setBinCount(prev => prev + 1);

          if (newScanned >= total) {
            Alert.alert('✅ Completed', 'All quantity scanned.');
          } else {
            Toast.show({
              type: 'success',
              text1: 'Scan Success',
              text2: 'Item scanned.',
              position: 'bottom',
              visibilityTime: 1300,
              topOffset: 5,
            });
          }
        } else {

          Toast.show({
            type: 'error',
            text1: 'Bin Data Mismatch',
            text2: 'Scan valid qr',
            position: 'bottom',
            visibilityTime: 1300,
            topOffset: 5,
          });
          setBinLabelQR('')
          partLabelInputRef.current?.focus();
        }
      }
    );

  };

  const handleNavigation = async () => {
    const storedStatus = await AsyncStorage.getItem('isBltConnected');
    console.log("storedStatus:", storedStatus);

    if (storedStatus != 'true') {
      Alert.alert("Connect Printer", "Please connect the printer...");
    } else {
      const invNo = await AsyncStorage.getItem('currInvNo');
      const partNo = await AsyncStorage.getItem('currPartNo');
      console.log(invNo, partNo)

      getInvoiceByInvoiceNoAndPartNo(invNo, partNo, async (invoiceData) => {
        if (invoiceData) {

          await printQr(invoiceData)

          Toast.show({
            type: 'success',
            text1: 'Scan Success',
            text2: 'Invoice data loaded from DB.',
            position: 'bottom',
            visibilityTime: 1300,
            topOffset: 5,
          });

          await AsyncStorage.setItem('isBltConnected', 'false');

          navigation.replace('PrintedQRStickers');


        } else {
          Alert.alert('Error', 'Failed to retrieve invoice after insert.');
        }
      });

      // console.log("Connected to Bluetooth");
      // navigation.replace('PrintedQRStickers');
    }

    console.log("Below Bluetooth check");
  };


  const progress = totalQuantity > 0 ? (scannedQuantity / (parseInt(totalQuantity, 10) || 1)) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      binInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeaderBar title="Bin / Part Label Verification" showBackButton={true} navigation={navigation} isPrintScreen={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanInvoiceQR}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Bin Label</Text>
        </TouchableOpacity> */}
          <StyledInput disableKeyboard={disableKeyboard} setDisableKeyboard={setDisableKeyboard} placeholder="Scan Bin Label" value={invoiceQR} onChangeText={setInvoiceQR} onSubmitEditing={handleScanInvoiceQR} editable={true} ref={binInputRef} autoFocus />
          {/* <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} /> */}
          <StyledInput label="Part Number" placeholder="Enter Part Number" value={partNumber} editable={false} />
          <StyledInput label="Vsiteon Part No" placeholder="Enter Visteon Part No" value={partName} editable={false} />
          <StyledInput label="Serial No" placeholder="Enter serial No" value={serialNumber} editable={false} />
          <StyledInput label="Quantity" placeholder="Enter Quantity" value={totalQuantity} keyboardType="numeric" editable={false} />
          {isSkipped && <View style={styles.disabledOverlay} pointerEvents="auto" />}

        </View>

        <View style={styles.card}>
          {/* <TouchableOpacity style={styles.scanButton} onPress={handleScanBinLabels}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Part Labels</Text>
        </TouchableOpacity> */}
          <StyledInput disableKeyboard={disableKeyboard} setDisableKeyboard={setDisableKeyboard} placeholder="Scan Part Label" ref={partLabelInputRef} value={binLabelQR} onChangeText={setBinLabelQR} onSubmitEditing={handleScanBinLabels} editable={true} />

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

          {isSkipped && <View style={styles.disabledOverlay} pointerEvents="auto" />}

        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 20, alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => {
            setIsSkipped(true)
            binInputRef.current?.blur();

          }} style={[styles.btn]}>
            <Text style={styles.btnTxt}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={!isSkipped} onPress={handleNavigation} style={[styles.qrbtn, { backgroundColor: isSkipped ? theme.colors.primary : COLORS.lightGray }]}>
            <Text style={styles.qrbtnTxt}>Print Verification QR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white, // Inner card for quantities
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightBorder, // A light border for the inner card
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
    backgroundColor: COLORS.accentGreen, // As per the UI image
    borderRadius: 5,
  },
  btn: {
    paddingVertical: 10,
    backgroundColor: 'white',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  btnTxt: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.dmMedium,
    fontSize: 14,
  },
  qrbtn: {
    paddingVertical: 10,
    borderRadius: 50,
    // backgroundColor:theme.colors.primary,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  qrbtnTxt: {
    color: 'white',
    fontFamily: theme.fonts.dmMedium,
    fontSize: 14,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15,
    zIndex: 1,
  }
});

export default BinLabelVerificationScreen;
