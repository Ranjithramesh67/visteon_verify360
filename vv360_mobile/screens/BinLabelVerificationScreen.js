// VisteonApp/src/screens/InvoiceBinVerificationScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const BinLabelVerificationScreen = ({ navigation }) => {
  const [invoiceQR, setInvoiceQR] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('150'); // Pre-filled as per UI
  const [binLabelQR, setBinLabelQR] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState(0); // Initial scanned quantity
  const [remainingQuantity, setRemainingQuantity] = useState(parseInt(totalQuantity, 10));

  useEffect(() => {
    const totalQty = parseInt(totalQuantity, 10) || 0;
    setRemainingQuantity(totalQty - scannedQuantity);
  }, [scannedQuantity, totalQuantity]);

  const handleScanInvoiceQR = () => {
    // Mock: In a real app, this would open the camera to scan QR
    // For now, let's simulate finding some data
    setInvoiceQR('INV_QR_12345');
    setInvoiceNumber('INV_NUM_67890');
    setPartNumber('PN_XYZ_001');
    setPartName('Engine Piston Assembly');
    Alert.alert('Scan Invoice QR', 'QR Scanner would open here. Data populated for demo.');
  };

  const handleScanBinLabels = () => {
    // Mock: Simulate scanning a bin label and updating quantity
    if (remainingQuantity <= 0) {
      Alert.alert('Scan Bin Labels', 'All items already scanned or total quantity not set.');
      return;
    }
    const newlyScanned = 10; // Simulate scanning 10 items
    setScannedQuantity(prev => {
      const newScanned = prev + newlyScanned;
      return newScanned > (parseInt(totalQuantity, 10) || 0) ? (parseInt(totalQuantity, 10) || 0) : newScanned;
    });
    setBinLabelQR(`BIN_LABEL_SCAN_${Date.now()}`); // Update with a new mock QR
    Alert.alert('Scan Bin Labels', `Scanned ${newlyScanned} items. QR Scanner would open here.`);
  };

  const handlePrintLabel = () => {
    Alert.alert('Print Label', 'Print functionality would be triggered here.');
  };

  const progress = totalQuantity > 0 ? (scannedQuantity / (parseInt(totalQuantity, 10) || 1)) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanInvoiceQR}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Invoice QR</Text>
        </TouchableOpacity>
        <StyledInput placeholder="Invoice QR Data" value={invoiceQR} onChangeText={setInvoiceQR} editable={false} />
        <StyledInput label="Invoice Number" placeholder="Enter Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} />
        <StyledInput label="Part Number" placeholder="Enter Part Number" value={partNumber} onChangeText={setPartNumber} />
        <StyledInput label="Part Name" placeholder="Enter Part Name" value={partName} onChangeText={setPartName} />
        <StyledInput label="Total Quantity" placeholder="Enter Total Quantity" value={totalQuantity} onChangeText={setTotalQuantity} keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanBinLabels}>
          <Ionicons name="qr-code-outline" size={20} color={COLORS.primaryOrange} />
          <Text style={styles.scanButtonText}>Scan Bin Labels</Text>
        </TouchableOpacity>
        <StyledInput placeholder="Scanned Bin Label Data" value={binLabelQR} onChangeText={setBinLabelQR} editable={false} />

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

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 20, alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnTxt}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qrbtn}>
          <Text style={styles.qrbtnTxt}>Print Verification QR</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.accentGreen, // As per the UI image
    borderRadius: 5,
  },
  btn: {
    paddingVertical: 10,
    backgroundColor: 'white',
    borderColor: theme.colors.primary,
    borderWidth:1,
    flex:1,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    paddingHorizontal:15,
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
  }
});

export default BinLabelVerificationScreen;
