// components/BluetoothPrinterConnector.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    View, Text, TouchableOpacity, Modal, FlatList,
    PermissionsAndroid, Alert, ActivityIndicator, DeviceEventEmitter, StyleSheet
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const BluetoothPrinterConnector = forwardRef(({ onDeviceConnected }, ref) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [pairedDevices, setPairedDevices] = useState([]);
    const [connectingDeviceAddress, setConnectingDeviceAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
        openScanner
    }));

    useEffect(() => {
        const pairedListener = DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
            (rsp) => {
                const paired = parseDevices(rsp.devices);
                setPairedDevices(paired);
            }
        );

        const lostListener = DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_CONNECTION_LOST,
            () => {
                onDeviceConnected?.(null);
            }
        );

        return () => {
            pairedListener.remove();
            lostListener.remove();
        };
    }, []);


    const parseDevices = (devices) => {
        try {
            return typeof devices === 'string' ? JSON.parse(devices) : devices;
        } catch {
            return [];
        }
    };

    const openScanner = async () => {
        setLoading(true);

        try {
            // 1. Ask for Bluetooth-related permissions (first)
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ]);

            const allGranted = Object.values(granted).every(
                status => status === PermissionsAndroid.RESULTS.GRANTED
            );

            if (!allGranted) {
                Alert.alert("Permission Denied", "Bluetooth permissions are required.");
                setLoading(false);
                return;
            }

            // 2. Check and enable Bluetooth
            const enabled = await BluetoothManager.isBluetoothEnabled();
            if (!enabled) {
                try {
                    await BluetoothManager.enableBluetooth();
                    console.log("Bluetooth is now enabled");
                } catch (err) {
                    console.log("Failed to enable Bluetooth:", err);
                    Alert.alert("Bluetooth Error", "Could not enable Bluetooth.");
                    setLoading(false);
                    return;
                }
            }

            // 3. Proceed to scan devices
            setPairedDevices([]);
            BluetoothManager.scanDevices();
            setModalVisible(true);
        } catch (error) {
            console.log("Bluetooth scan error:", error);
            Alert.alert("Error", "Bluetooth scan failed.");
        } finally {
            setLoading(false);
        }
    };


    const connectDevice = async (device) => {
        setConnectingDeviceAddress(device.address);
        try {
            await BluetoothManager.connect(device.address);
            onDeviceConnected?.(device);
            setModalVisible(false);
        } catch (e) {
            Alert.alert("Failed to connect", e.message || "Try another device.");
        } finally {
            setConnectingDeviceAddress(null);
        }
    };

    return (
        <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Bluetooth Printer</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

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
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
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

export default BluetoothPrinterConnector;
