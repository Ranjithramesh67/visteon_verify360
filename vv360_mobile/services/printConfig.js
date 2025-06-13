import { BluetoothManager, BluetoothEscposPrinter, BluetoothTscPrinter } from 'react-native-bluetooth-escpos-printer';
import { getFormattedDateTime } from './helper';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const printQr = async (invData) => {
    const b2dInv = `${getFormattedDateTime()}B2D${invData.id}`
    const pName = await AsyncStorage.getItem('currPartName')
    const content = `${invData.partNo}|${pName}|${invData.invoiceNo}|${invData.orgQty}|${invData.invDate}|${b2dInv}`;

    console.log(content)

    try {
        await BluetoothTscPrinter.printLabel({
            width: 60,
            height: 40,
            direction: BluetoothTscPrinter.DIRECTION.FORWARD,
            reference: [0, 0],
            tear: BluetoothTscPrinter.TEAR.ON,
            sound: 0,
            text: [],
            qrcode: [
                {
                    x: 50,
                    y: 50,
                    level: BluetoothTscPrinter.EEC.LEVEL_L,
                    width: 5,
                    rotation: BluetoothTscPrinter.ROTATION.ROTATION_0,
                    code: content
                }
            ],
            print: [1, 1],
            concentrate: false
        })
        await BluetoothTscPrinter.formFeed();

        console.log("TSC QR printed!");

    } catch (err) {
        console.error('TSC Print Error:', err);
    }
};