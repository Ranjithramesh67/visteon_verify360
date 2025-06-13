import React, { use, useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, PermissionsAndroid, Alert
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
import { getAllParts, getPrintQr } from '../services/database';

const ReportsScreen = ({ navigation }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerValue, setCustomerValue] = useState(null);
  const [customerItems, setCustomerItems] = useState([
    { label: 'Customer A', value: 'customer_a' },
    { label: 'Customer B', value: 'customer_b' },
  ]);

  const [partOpen, setPartOpen] = useState(false);
  const [partValue, setPartValue] = useState(null);
  const [partItems, setPartItems] = useState([
    { label: 'Part X', value: 'part_x' },
    { label: 'Part Y', value: 'part_y' },
  ]);

  const fetchPartNames = async () => {
    getAllParts((res) => {
      if (res && Array.isArray(res)) {
        const parts = res.map(item => ({
          label: item.partNo,
          value: item.partNo,
        }));
        setPartItems(parts);
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
    { label: 'S.No', key: 'serial' },
    { label: 'Date', key: 'invDate' },
    { label: 'Invoice No', key: 'invoiceNo' },
    { label: 'Quantity', key: 'orgQty' },
    { label: 'Action', key: 'print' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [allReports, setAllReports] = useState([]);
  const [tableData, setTableData] = useState([]);

  async function fetchPrintQr() {
    try {
      getPrintQr(data => {
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

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );

        // if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        //   Alert.alert('Permission Denied', 'Storage permission is required');
        //   return;
        // }
      }

      if (tableData.length === 0) {
        Alert.alert("No Data", "There is no data to export");
        return;
      }

      const csvHeader = 'S.No,Date,Invoice No,Quantity\n';

      const csvRows = tableData.map((item, index) => {
        return `${index + 1},${item.invDate},${item.invoiceNo},${item.orgQty}`;
      });

      const csvContent = csvHeader + csvRows.join('\n');

      const fileName = `Reports_${Date.now()}.csv`;
      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, csvContent, 'utf8');

      Alert.alert('Success', `File downloaded:\n${fileName}`);
      console.log('File saved to:', filePath);
    } catch (error) {
      console.error('Error writing file:', error);
      Alert.alert('Error', 'Failed to download CSV file');
    }
  };


  const handleSearch = (query) => {
    setSearchQuery(query);
    const filteredReports = allReports.filter(item =>
      item.invDate?.includes(query) ||
      item.invoiceNo?.includes(query)
    );
    setTableData(filteredReports);
  }



  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        height: '100%'
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <HeaderBar title="Reports" showNotification={true} navigation={navigation} showDownload={true} handleDownload={handleDownload} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} nestedScrollEnabled={true}>
          <View style={{ marginTop: 20, gap: 20 }}>
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Invoice / Date' value={searchQuery} onChangeText={handleSearch} />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardIns}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <TouchableOpacity onPress={() => showDatePicker('from')} style={styles.dateInput}>
                    <Text style={styles.dateText}>{fromDate || 'From Date'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <TouchableOpacity onPress={() => showDatePicker('to')} style={styles.dateInput}>
                    <Text style={styles.dateText}>{toDate || 'To Date'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ zIndex: 2000 }}>
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
          />
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
