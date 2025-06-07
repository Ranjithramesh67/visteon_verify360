import React, { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView
} from 'react-native';


import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';

const CustomerMaster = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Customer Id', key: 'customerId' },
    { label: 'Customer Name', key: 'customerName' },
    { label: 'Address', key: 'address' }
  ];

  const [tableData, setTableData] = useState([
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
    { customerId: '1234', customerName: 'Person Name', address: 'Chennai 60001' },
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          <View style={{ marginTop: 20, gap: 20 }}>
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Customer Id/Name' />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Table */}
          <Table data={tableData} columns={columns} />

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
  }

});

export default CustomerMaster;
