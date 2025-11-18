import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  BluetoothManager
} from 'react-native-bluetooth-escpos-printer';
import {
  PermissionsAndroid,
  Alert,
  ToastAndroid,
  DeviceEventEmitter,
} from 'react-native';

const BluetoothContext = createContext();

export const BluetoothProvider = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [foundDevices, setFoundDevices] = useState([]);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingDeviceAddress, setConnectingDeviceAddress] = useState(null);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);

  // Parse helpers
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

  // Scan for devices
  const scanBluetooth = async () => {
    console.log('first scann')
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert('Permission denied', 'Bluetooth permissions are required.');
        return;
      }

      setFoundDevices([]);
      BluetoothManager.scanDevices();
    } catch (error) {
      Alert.alert('Error', 'Bluetooth scan failed.');
    }
  };

  // Connect to a selected device
  const connectDevice = async (device) => {
    setIsConnecting(true);
    setConnectingDeviceAddress(device.address);
    try {
      await BluetoothManager.connect(device.address);
      setConnectedDevice(device);
      ToastAndroid.show(`Connected to ${device.name}`, ToastAndroid.SHORT);
    } catch (e) {
      Alert.alert('Failed to connect', e.message || 'Try another device.');
    } finally {
      setIsConnecting(false);
      setConnectingDeviceAddress(null);
    }
  };

  // Auto-connect on load (optional)
  useEffect(() => {
    BluetoothManager.isBluetoothEnabled().then((enabled) => {
      setIsBluetoothEnabled(enabled);
    });

    DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
      (rsp) => {
        let paired = parseDevices(rsp.devices);
        setPairedDevices(paired);
      }
    );

    DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_DEVICE_FOUND,
      (rsp) => {
        let found = parseDevice(rsp.device);
        if (found && !foundDevices.some((d) => d.address === found.address)) {
          setFoundDevices((prev) => [...prev, found]);
        }
      }
    );

    DeviceEventEmitter.addListener(
      BluetoothManager.EVENT_CONNECTION_LOST,
      () => {
        setConnectedDevice(null);
        ToastAndroid.show('Bluetooth connection lost', ToastAndroid.SHORT);
      }
    );

    return () => {
      DeviceEventEmitter.removeAllListeners();
    };
  }, [foundDevices]);

  return (
    <BluetoothContext.Provider
      value={{
        connectedDevice,
        pairedDevices,
        foundDevices,
        isConnecting,
        connectingDeviceAddress,
        isBluetoothEnabled,
        scanBluetooth,
        connectDevice,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => useContext(BluetoothContext);
