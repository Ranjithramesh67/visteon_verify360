import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform, ScrollView, Modal, FlatList,
  PermissionsAndroid, ActivityIndicator, Alert, DeviceEventEmitter, ToastAndroid,
  Button
} from 'react-native';
import { BluetoothManager, BluetoothEscposPrinter, BluetoothTscPrinter } from 'react-native-bluetooth-escpos-printer';
import Table from '../components/Table';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';
import { getLatestPrintQr, getPendingCustomerBinLabels, getPrintQr } from '../services/database';
import { getFormattedDateTime } from '../services/helper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from '../components/HeaderBar';
import Toast from 'react-native-toast-message';
import { PrinterContext } from '../contexts/PrinterContext';

const PrintedQRStickersScreen = ({ navigation }) => {
  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Date', key: 'createdAt' },
    { label: 'Invoice No', key: 'invoiceNo' },
    { label: 'Quantity', key: 'orgQty' },
    { label: 'Action', key: 'print' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [allReports, setAllReports] = useState([]);
  const [tableData, setTableData] = useState([]);

  const { isPrinterConnect, setIsPrinterConnect } = useContext(PrinterContext);

  async function fetchPrintQr() {
    try {
      getLatestPrintQr(data => {
        if (data) {
          setAllReports(data)
          setTableData(data)
          console.log(data)
        } else {
          console.log('No records found or an error occurred.');
        }
      });
    }
    catch (error) {
      console.log("Server error: ", error)
    }
  }

  useEffect(() => {
    fetchPrintQr()
  }, [])

  const [pairedDevices, setPairedDevices] = useState([]);
  const [foundDevices, setFoundDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [printLoad, setPrintLoad] = useState(false);
  const [connectingDeviceAddress, setConnectingDeviceAddress] = useState(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredReports = allReports.filter(item =>
      item.invDate?.includes(query) ||
      item.invoiceNo?.includes(query)
    );
    setTableData(filteredReports);
  }

  useEffect(() => {
    BluetoothManager.isBluetoothEnabled().then(enabled => {
      if (!enabled) {
        BluetoothManager.enableBluetooth().then(() => {
          console.log("Bluetooth is now enabled");
        }).catch(err => {
          console.log("Failed to enable Bluetooth", err);
        });
      }
    });

    DeviceEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp) => {
      let paired = parseDevices(rsp.devices);
      setPairedDevices(paired);
    });

    DeviceEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => {
      let found = parseDevice(rsp.device);
      if (found && !foundDevices.some(d => d.address === found.address)) {
        setFoundDevices(prev => [...prev, found]);
      }
    });

    DeviceEventEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
      setConnectedDevice(null);
      setIsPrinterConnect(null);
    });

    return () => {
      DeviceEventEmitter.removeAllListeners();
    };
  }, []);

  const parseDevices = (devices) => {
    try {
      return typeof devices === 'string' ? JSON.parse(devices) : devices;
    } catch {
      return [];
    }
  };

  const parseDevice = (device) => {
    try {
      return typeof device === 'string' ? JSON.parse(device) : device;
    } catch {
      return null;
    }
  };

  // const scanBluetooth = async () => {
  //   try {
  //     setPrintLoad(true);
  //     const granted = await PermissionsAndroid.requestMultiple([
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //     ]);

  //     const allGranted = Object.values(granted).every(status => status === PermissionsAndroid.RESULTS.GRANTED);
  //     if (!allGranted) {
  //       Alert.alert("Permission denied", "Bluetooth permissions are required.");
  //       return;
  //     }

  //     setFoundDevices([]);
  //     BluetoothManager.scanDevices();
  //     setModalVisible(true);
  //   } catch (error) {
  //     Alert.alert("Error", "Bluetooth scan failed.");
  //   } finally {
  //     setPrintLoad(false);
  //   }
  // };

  const connectDevice = async (device) => {
    setPrintLoad(true);
    setConnectingDeviceAddress(device.address);
    try {
      await BluetoothManager.connect(device.address);
      setConnectedDevice(device);
      setIsPrinterConnect(device);
      setModalVisible(false);
      ToastAndroid.show(`Connected to ${device.name}`, ToastAndroid.SHORT);
    } catch (e) {
      Alert.alert("Failed to connect", e.message || "Try another device.");
    } finally {
      setPrintLoad(false);
      setConnectingDeviceAddress(null);
    }
  };


  // Sample QR Printer

  const printQr = async (invData) => {
    Alert.alert(
      "Confirm Print",
      `Are you sure you want to print this invoice ${invData.invoiceNo}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            // Call separate async handler
            handleConfirmedPrint(invData);
          }
        }
      ]
    );
  };

  const handleConfirmedPrint = async (invData) => {
    // const b2dInv = `${getFormattedDateTime()}B2D${invData.id}`;
    const content = `${invData.partNo}|${invData.visteonPart}|${invData.invoiceNo}|${invData.orgQty}|${invData.invDate}|${invData.invSerialNo}`;

    console.log(content);

    // const invNum = await AsyncStorage.getItem('currInvNo');
    // const partNum = await AsyncStorage.getItem('currPartNo');

    const invNum = invData.invoiceNo;
    const partNum = invData.partNo;

    // First check for pending labels
    getPendingCustomerBinLabels(partNum, invNum, async (isPendingItems) => {
      if (isPendingItems) {
        Alert.alert(
          "Pending Verification",
          "Please complete the pending verification before printing.",
          [{ text: "OK" }]
        );
        return;
      }

      // If no pending items, proceed with printing
      try {
        await BluetoothTscPrinter.printLabel({
          width: 60,
          height: 40,
          direction: BluetoothTscPrinter.DIRECTION.FORWARD,
          reference: [0, 0],
          tear: BluetoothTscPrinter.TEAR.ON,
          sound: 0,
          gap: 3,
          text: [
            {
              x: 180,
              y: 20,
              text: invData.invSerialNo,
              fonttype: BluetoothTscPrinter.FONTTYPE.FONT_1,
              rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1
            },
            {
              x: 180,
              y: 160,
              text: `Inv:${invData.invoiceNo}`,
              fonttype: BluetoothTscPrinter.FONTTYPE.FONT_1,
              rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1
            }
          ],
          qrcode: [
            {
              x: 180,
              y: 35,
              level: BluetoothTscPrinter.EEC.LEVEL_L,
              width: 4,
              rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
              code: content
            }
          ],
          print: [1, 1],
          concentrate: false
        });

        Toast.show({
          type: 'success',
          text1: 'Print Successful',
          text2: 'Invoice has been printed successfully.',
          position: 'top',
          visibilityTime: 1300,
          topOffset: 5,
        });

      }
      catch (err) {
        console.log('TSC Print Error:', err);

        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: 'Check Bluetooth/Printer connection',
          position: 'top',
          visibilityTime: 1300,
          topOffset: 5,
        });
      }
    });
  };


  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <HeaderBar title="Printed QR Strickers" showBackButton={true} navigation={navigation} isPrintScreen={true} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          {/* <TouchableOpacity
            style={[styles.scanButton, printLoad && styles.scanButtonDisabled]}
            onPress={scanBluetooth}
            disabled={printLoad}
          >
            {printLoad ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.scanButtonText}>Scanning...</Text>
              </View>
            ) : (
              <Text style={styles.scanButtonText}>
                {connectedDevice ? `Connected: ${connectedDevice.name}` : 'Scan Printer'}
              </Text>
            )}
          </TouchableOpacity> */}

          {/* <Button title='TSC print' onPress={() => printQr({ date: '12/01/2025', invoiceNo: 'C3630215', qty: 1550 })} /> */}

          <View style={{ marginTop: 20, gap: 20 }}>
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Invoice/Date' value={searchQuery} onChangeText={handleSearch} />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Table data={tableData} columns={columns} printQr={printQr} />

          {/* Modal to show devices */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Bluetooth Printer</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.deviceSectionTitle}>Paired Devices</Text>
                <FlatList
                  data={pairedDevices}
                  keyExtractor={item => item.address}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.deviceItem}
                      onPress={() => connectDevice(item)}
                      disabled={connectingDeviceAddress === item.address}
                    >
                      <Text style={styles.deviceText}>{item.name}</Text>
                      {connectingDeviceAddress === item.address ? (
                        <ActivityIndicator size="small" color={COLORS.primaryOrange} />
                      ) : (
                        <Text style={styles.connectText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />


                {/* <Text style={styles.deviceSectionTitle}>Available Devices</Text>
                <FlatList
                  data={foundDevices}
                  keyExtractor={item => item.address}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.deviceItem} onPress={() => connectDevice(item)}>
                      <Text style={styles.deviceText}>{item.name} - {item.address}</Text>
                      <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>
                  )}
                /> */}
              </View>
            </View>
          </Modal>

          <View style={{ height: 100 }} />
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
  scanButton: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: 12,
    width: 180,
    alignSelf: 'flex-end',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
  },
  scanButtonDisabled: {
    opacity: 0.6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.dmBold,
  },
  closeButton: {
    fontSize: 18,
    fontFamily: theme.fonts.dmMedium,
    color: '#444',
  },
  deviceSectionTitle: {
    fontSize: 15,
    fontFamily: theme.fonts.dmBold,
    marginVertical: 10,
  },
  deviceItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceText: {
    fontSize: 14,
    fontFamily: theme.fonts.dmMedium,
  },
  connectText: {
    color: COLORS.primaryOrange,
    fontFamily: theme.fonts.dmMedium,
  },
});

export default PrintedQRStickersScreen;
