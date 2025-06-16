// VisteonApp/src/components/HeaderBar.js
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';
import { useRef, useState, useContext } from 'react';
import BluetoothPrinterConnector from './BluetoothPrinterConnector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterContext } from '../contexts/PrinterContext';

const HeaderBar = ({ title, navigation, showBackButton, onBackPress, showNotification, onNotificationPress, isPrintScreen, showDownload, handleDownload }) => {
  const insets = useSafeAreaInsets();
  // const { connectedDevice, isConnecting, scanBluetooth } = useBluetooth();
  const {isPrinterConnect, setIsPrinterConnect} = useContext(PrinterContext);
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const bluetoothRef = useRef(null);
  const lastDeviceRef = useRef(null);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [printLoad, setPrintLoad] = useState(false);

  const handleScanPrinter = () => {
    bluetoothRef.current?.openScanner();
  };


  const handleDeviceConnected = async (device) => {
    if (device?.address !== lastDeviceRef.current?.address) {
      setConnectedDevice(device);
      setIsPrinterConnect(device);
      lastDeviceRef.current = device;

      if (device?.name) {
        await AsyncStorage.setItem('isBltConnected', 'true');
        ToastAndroid.show(`Connected to ${device.name}`, ToastAndroid.SHORT);
      } else {
        setIsPrinterConnect(null);
        await AsyncStorage.setItem('isBltConnected', 'false');
        ToastAndroid.show('Printer disconnected', ToastAndroid.SHORT);
      }
    }
  };


  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10, paddingBottom: 10 }]}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconButton}>
            <Ionicons name="arrow-back" size={25} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text
          style={[
            styles.title,
            isPrintScreen
              ? { fontSize: 15, fontFamily: theme.fonts.dmMedium, marginLeft: -25 }
              : { fontSize: 18, fontFamily: theme.fonts.dmBold }
          ]}
        >{title}</Text>
      </View>
      <View style={styles.rightContainer}>
        {/* {showNotification && (
          <TouchableOpacity onPress={handleNotification} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        )} */}
        {
          isPrintScreen && (
            <TouchableOpacity
              onPress={handleScanPrinter}
              disabled={printLoad}
              style={styles.iconButton}>
              <Ionicons name="print" size={26} color={COLORS.white} />
              <View style={[styles.printIndicator, { backgroundColor: isPrinterConnect ? 'green' : 'red' }]}></View>
            </TouchableOpacity>
          )
        }

        {showDownload && (
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.iconButton}>
            <Ionicons name="download" size={26} color={COLORS.white} />
          </TouchableOpacity>
        )}


      </View>

      <BluetoothPrinterConnector
        ref={bluetoothRef}
        onDeviceConnected={handleDeviceConnected}

      />

    </View>
  );
};

HeaderBar.defaultProps = {
  showBackButton: false, // By default, don't show back if it's a root tab screen
  showNotification: false,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryOrange, // Match app theme
    paddingHorizontal: 15,
    // height: Platform.OS === 'ios' ? 90 : 70, // Adjust height considering status bar
    // paddingTop: Platform.OS === 'ios' ? 40 : 20, // Adjust for status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 3, // Give more space to title
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: COLORS.white,
  },
  iconButton: {
    padding: 5, // For easier touch
    position: 'relative'
  },
  printIndicator: {
    width: 7,
    height: 7,
    borderRadius: 50,
    backgroundColor: '#228b22',
    position: 'absolute',
    top: 3,
    right: 5
  }
});

export default HeaderBar;
