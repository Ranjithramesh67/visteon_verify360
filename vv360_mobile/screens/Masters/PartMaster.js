import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView
} from 'react-native';

import { createPartMasterTable, getAllParts, insertPart } from "../../services/database"


import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';
import { restoreBackupDB } from '../../services/BackupService';

const PartMaster = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Part Name', key: 'partName' },
    { label: 'Bin Qty', key: 'binQty' }
  ];

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const init = async () => {
      // await restoreBackupDB();
      createPartMasterTable();
      fetchPartsFromDB();
    };
    init();
  }, []);

  const fetchPartsFromDB = () => {
    getAllParts((rows) => {
      const withSerial = rows.map((row, index) => ({
        ...row,
        serial: index + 1
      }));
      setTableData(withSerial);
    });
  };

  const handleInsertData = async () => {
    const dummyParts = [
      { partNo: '1234', partName: 'Part Name1', binQty: '10' },
      { partNo: '2345', partName: 'Part Name2', binQty: '20' },
      { partNo: '3456', partName: 'Part Name3', binQty: '25' },
      { partNo: '94013-K6530', partName: 'MobilePhone', binQty: '10' },
    ];

    for (const part of dummyParts) {
      await insertPart(part);
    }

    fetchPartsFromDB();
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          <View style={{ marginTop: 20, gap: 20 }}>

            <TouchableOpacity
              style={{ alignSelf: 'flex-end' }}
              onPress={handleInsertData}
            >
              <Text style={{ color: '#A45B06', fontFamily: theme.fonts.dmBold }}>+ Add New</Text>
            </TouchableOpacity>

            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Part Name/Number' />
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

export default PartMaster;
