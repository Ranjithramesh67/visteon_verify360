import React, { use, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, PermissionsAndroid, Alert,
  Button,
  Modal,
  ActivityIndicator
} from 'react-native';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../constants/colors';
import { commonStyles } from '../constants/styles';
import theme from '../constants/theme';
import Table from '../components/Table';
import HeaderBar from '../components/HeaderBar';
import { clearCustomerTable, deleteAllInvoiceData, getAllCustomerBinLabels, getAllParts, getPendingCustomerBinLabels, getPrintQr } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import CustomDropdown from '../components/CustomDropdown';
import { formatDate } from '../services/helper';

const ReportsScreen = ({ navigation }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const [partOpen, setPartOpen] = useState(false);
  const [partValue, setPartValue] = useState("All Parts");
  const [partItems, setPartItems] = useState([]);

  const fetchPartNames = async () => {
    getAllParts((res) => {
      if (res && Array.isArray(res)) {
        const parts = res.map(item => ({
          label: item.partNo,
          value: item.partNo,
        }));
        setPartItems([
          { label: 'All Parts', value: 'All Parts' },
          ...parts,
        ]);
      }
    });
  }

  useEffect(() => {
    fetchPartNames()
  }, [])

  const showDatePicker = (field) => {
    setSelectedDateField(field);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    if (selectedDateField === 'from') {
      setFromDate(formattedDate);
    } else if (selectedDateField === 'to') {
      setToDate(formattedDate);
    }
    hideDatePicker();
  };


  const columns = [
    // { label: 'S.No', key: 'serial' },
    { label: 'Date', key: 'createdAt' },
    { label: 'Invoice No', key: 'invoiceNo' },
    { label: 'Quantity', key: 'orgQty' },
    { label: 'Action', key: 'delete' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [allReports, setAllReports] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [exportData, setExportData] = useState([]);

  async function fetchPrintQr() {
    try {
      getPrintQr(data => {
        if (data) {
          setAllReports(data)
          setTableData(data)
          console.log(data)
        } else {
          console.log('No records found or an error occurred.');
          setTableData([])
        }
      });
    }
    catch (error) {
      console.log("Server error: ", error)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchPrintQr();

      return () => {
        // cleanup logic if needed
      };
    }, [])
  );


  // const handleDownload = async () => {
  //   try {
  //     if (Platform.OS === 'android') {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  //       );

  //       // if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
  //       //   Alert.alert('Permission Denied', 'Storage permission is required');
  //       //   return;
  //       // }
  //     }

  //     if (tableData.length === 0) {
  //       Alert.alert("No Data", "There is no data to export");
  //       return;
  //     }

  //     const csvHeader = 'S.No,Date,Invoice No,Quantity\n';

  //     const csvRows = tableData.map((item, index) => {
  //       return `${index + 1},${item.invDate},${item.invoiceNo},${item.orgQty}`;
  //     });

  //     const csvContent = csvHeader + csvRows.join('\n');

  //     const fileName = `Reports_${Date.now()}.csv`;
  //     const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

  //     await RNFS.writeFile(filePath, csvContent, 'utf8');

  //     Alert.alert('Success', `File downloaded:\n${fileName}`);
  //     console.log('File saved to:', filePath);
  //   } catch (error) {
  //     console.error('Error writing file:', error);
  //     Alert.alert('Error', 'Failed to download CSV file');
  //   }
  // };

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      Alert.alert(title, message, [{ text: 'OK', onPress: resolve }], {
        cancelable: false,
      });
    });
  };


  const handleExportAll = async () => {
    try {
      setLoading(true); // show loader modal

      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
      }

      const csvHeader = 'S.No,Date,Invoice No,Part No,Visteon Part,Serial No,Vist Serial No,Scanned Qty,Invoice SerialNo\n';
      let allRows = [];
      let serial = 1;

      for (const item of tableData) {
        const { invoiceNo, partNo } = item;

        const isPending = await new Promise((resolve) => {
          getPendingCustomerBinLabels(partNo, invoiceNo, (result) => {
            resolve(result === true);
          });
        });

        if (isPending) {
          await showAlert("Pending Verification", `Invoice ${invoiceNo} has pending verification or data. Skipping export.`);
          continue;
        }

        const invoiceData = await new Promise((resolve) => {
          getAllCustomerBinLabels(partNo, invoiceNo, (res) => {
            resolve(res || []);
          });
        });

        if (invoiceData.length === 0) continue;

        const csvRows = invoiceData.map((entry) =>
          `${serial++},${formatDate(entry.createdAt)},${entry.invoiceNo},${entry.partNo},${entry.visteonPart},${entry.serialNo},${entry.vistSerialNo},${entry.scannedQty},${entry.invSerialNo}`
        );

        allRows.push(...csvRows);
      }

      if (allRows.length === 0) {
        setLoading(false);
        Alert.alert("No Data", "No data available to export.");
        return;
      }

      const csvContent = csvHeader + allRows.join('\n');
      const fileName = `All_CustomerBinLabels_${Date.now()}.csv`;
      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(filePath, csvContent, 'utf8');

      setLoading(false);
      Alert.alert('Success', `File downloaded:\n${fileName}`);
      console.log('File saved to:', filePath);
    } catch (error) {
      setLoading(false);
      console.error('Error exporting all:', error);
      Alert.alert('Error', 'Failed to download CSV file');
    }
  };




  const handleExport = async (partNo, invNo) => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
      }

      getPendingCustomerBinLabels(partNo, invNo, async (isPendingItems) => {
        if (isPendingItems) {
          Alert.alert(
            "Pending Verification",
            "Please complete the pending verification or delete the report.",
            [{ text: "OK" }]
          );
          return;
        }

        getAllCustomerBinLabels(partNo, invNo, async (res) => {
          if (!res || !Array.isArray(res) || res.length === 0) {
            Alert.alert("No Data", "There is no data to export");
            return;
          }

          const csvHeader = 'S.No,Date,Invoice No,Part No,Visteon Part,Serial No,Vist Serial No,Scanned Qty,Invoice SerialNo\n';
          const csvRows = res.map((item, idx) =>
            `${idx + 1},${formatDate(item.createdAt)},${item.invoiceNo},${item.partNo},${item.visteonPart},${item.serialNo},${item.vistSerialNo},${item.scannedQty},${item.invSerialNo}`
          );

          const csvContent = csvHeader + csvRows.join('\n');

          const fileName = `CustomerBinLabels_${Date.now()}.csv`;
          const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

          await RNFS.writeFile(filePath, csvContent, 'utf8');

          Alert.alert('Success', `File downloaded:\n${fileName}`);
          console.log('File saved to:', filePath);
        });
      });
    } catch (error) {
      console.error('Error writing file:', error);
      Alert.alert('Error', 'Failed to download CSV file');
    }
  };




  const handleDelete = async (partNo, invNo) => {
    // const invNum = await AsyncStorage.getItem('currInvNo');
    // const partNum = await AsyncStorage.getItem('currPartNo');

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete the invoice and its bin label data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAllInvoiceData(partNo, invNo, (success) => {
              // console.log(success)
              if (success) {
                Toast.show({
                  type: 'success',
                  text1: 'Deleted Successfully',
                  text2: 'Invoice & BinLabel Data Deleted Successfully',
                  position: 'bottom',
                  visibilityTime: 1300,
                  topOffset: 5,
                });

                fetchPrintQr()

                console.log('Both deletions succeeded');
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Deletion Failed',
                  text2: 'One or both deletions failed',
                  position: 'bottom',
                  visibilityTime: 1300,
                  topOffset: 5,
                });
                console.log('One or both deletions failed');
              }
            });
          },
        },
      ]
    );
  };

  useEffect(() => {
    filterData();
  }, [searchQuery, fromDate, toDate, partValue, allReports]);

  const filterData = () => {
    let filtered = allReports;

    // 1. Filter by Date Range
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      to.setHours(23, 59, 59, 999);

      filtered = filtered.filter(item => {
        const createdAtStr = item.createdAt;
        if (!createdAtStr) return false;

        const createdAtDate = new Date(createdAtStr);
        return createdAtDate >= from && createdAtDate <= to;
      });
    }

    // 2. Filter by Part Number
    if (partValue && partValue !== 'All Parts') {
      filtered = filtered.filter(item => item.partNo === partValue);
    }

    // 3. Filter by Search Query (on invoiceNo or invDate)
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(item =>
        item.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invDate?.includes(searchQuery)
      );
    }

    setTableData(filtered);
  };





  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        height: '100%'
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar title="Reports" showNotification={true} navigation={navigation} showDownload={true} handleDownload={handleExportAll} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} nestedScrollEnabled={true}>
          <View style={{ marginTop: 20, gap: 20 }}>
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Invoice / Date' value={searchQuery} onChangeText={setSearchQuery} />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardIns}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <TouchableOpacity onPress={() => showDatePicker('from')} onLongPress={() => setFromDate('')} style={styles.dateInput}>
                    <Text style={styles.dateText}>{fromDate || 'From Date'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <TouchableOpacity onPress={() => showDatePicker('to')} onLongPress={() => setToDate('')} style={styles.dateInput}>
                    <Text style={styles.dateText}>{toDate || 'To Date'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* <View style={{ zIndex: 2000 }}>
                <DropDownPicker
                  open={partOpen}
                  value={partValue}
                  items={partItems}
                  setOpen={setPartOpen}
                  setValue={setPartValue}
                  setItems={setPartItems}
                  placeholder="Part Number"
                  zIndex={2000}
                  zIndexInverse={1000}
                  style={styles.dropdown}
                />
              </View> */}

              <View style={{ flexDirection: 'row' }}>
                <CustomDropdown
                  items={partItems}
                  placeholder="Select Part Number"
                  selectedValue={partValue}
                  onSelect={setPartValue}
                />

                <TouchableOpacity
                  onPress={() => {
                    setFromDate('')
                    setToDate('')
                    setPartValue('All Parts')
                  }}
                  style={{
                    backgroundColor: COLORS.primaryOrange,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    marginLeft: 10,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ color: '#fff', fontFamily: theme.fonts.dmMedium }}>Clear</Text>
                </TouchableOpacity>
              </View>



            </View>



          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

          {/* Table */}
          <Table
            data={tableData}
            columns={columns}
            handleDelete={handleDelete}
            handleExport={handleExport}
          />

          <Modal visible={loading} transparent>
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)'
            }}>
              <View style={{
                padding: 20,
                backgroundColor: 'white',
                borderRadius: 10,
                alignItems: 'center'
              }}>
                <ActivityIndicator size="large" color={COLORS.primaryOrange} />
                <Text style={{ marginTop: 10 }}>Exporting CSV, please wait...</Text>
              </View>
            </View>
          </Modal>


          {/* <Button title='clear data' onPress={() => clearCustomerTable()} /> */}
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
    marginBottom: 80
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
    fontSize: 13
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
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  cardIns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f8f8f8'
  },
  dateText: {
    color: '#444',
    fontSize: 14,
    fontFamily: theme.fonts.dmMedium,
  },
  dropdown: {
    borderRadius: 10,
    borderColor: '#ccc',
  }

});

export default ReportsScreen;
