import React, { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, Modal, FlatList, PermissionsAndroid,
  Button,
  ActivityIndicator
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';
import Table from '../components/Table';

const PrintedQRStickersScreen = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Date', key: 'date' },
    { label: 'Invoice No', key: 'invoiceNo' },
    { label: 'Quantity', key: 'qty' },
    { label: 'Action', key: 'print' },
  ];

  const [tableData, setTableData] = useState([
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },
    { date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 },

  ]);

  const [devices, setDevices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [printLoad, setPrintLoad] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(val => val === PermissionsAndroid.RESULTS.GRANTED);
      if (!allGranted) {
        alert('Bluetooth and Location permissions are required!');
        throw new Error('Permissions not granted');
      }
    }
  };


  const scanDevices = async () => {
    setPrintLoad(true);
    try {
      await requestPermissions();

      const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        alert('Please enable Bluetooth from system settings');
        return;
      }

      const paired = await BluetoothManager.scanDevices();
      const pairedDevices = paired.found ? JSON.parse(paired.found) : [];

      setDevices(pairedDevices);
      setModalVisible(true);
    } catch (error) {
      console.error('Scan Error:', error);
      // alert('Scan failed: ' + (error.message || error));
      alert('Make Sure Bluetooth and Location Enabled..');
    } finally {
      setPrintLoad(false);
    }
  };


  const connectPrinter = async (device) => {
    try {
      await BluetoothManager.connect(device.address);
      setModalVisible(false);
      alert(`Connected to ${device.name}`);
    } catch (error) {
      alert('Connection failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>


          <TouchableOpacity
            style={[styles.scanButton, printLoad && styles.scanButtonDisabled]}
            onPress={scanDevices}
            disabled={printLoad}
          >
            {printLoad ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Scanning...</Text>
              </View>
            ) : (
              <Text style={styles.scanButtonText}>Scan Printer</Text>
            )}
          </TouchableOpacity>




          <View style={{ marginTop: 20, gap: 20 }}>
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Invoice/Date' />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Table */}
          <Table data={tableData} columns={columns} />

          <Modal visible={modalVisible} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select a Bluetooth Printer</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.address}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => connectPrinter(item)}
                      style={styles.deviceItem}
                    >
                      <Text style={styles.deviceText}>{item.name} - {item.address}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>


        </ScrollView>



      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGrayBackground,
    paddingHorizontal: 15,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    height: 50
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontFamily: theme.fonts.dmMedium,
    fontSize: 13,
    paddingTop: 15,
  },
  tiles: {
    backgroundColor: 'rgba(244, 142, 22, 0.28)',
    borderRadius: 50,
    padding: 10,
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  txtname: {
    fontFamily: theme.fonts.dmBold,
    fontSize: 13,
    color: '#804B0C'
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.dmBold,
  },
  closeButton: {
    fontSize: 17,
    fontFamily: theme.fonts.dmMedium,
    color: '#444',
  },
  deviceItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  deviceText: {
    fontSize: 14,
    color: '#333',
    fontFamily: theme.fonts.dmMedium,
  },
  scanButton: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: 12,
    width: 140,
    alignSelf: 'flex-end',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  scanButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: theme.fonts.dmMedium,

  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },


});

export default PrintedQRStickersScreen;
