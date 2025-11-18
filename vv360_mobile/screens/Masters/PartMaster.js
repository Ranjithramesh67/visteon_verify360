import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, Modal,
  Alert
} from 'react-native';
import StyledInput from '../../components/StyledInput';
import { createInvoiceTable, createPartMasterTable, deletePart, getAllParts, insertPart } from "../../services/database"


import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';
import { restoreBackupDB } from '../../services/BackupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const PartMaster = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Visteon Part No', key: 'visteonPart' },
    { label: 'Bin Qty', key: 'binQty' },
    { label: 'Action', key: 'delPart' },
  ];

  const [tableData, setTableData] = useState([]);
  const [isDis, setIsDis] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [allParts, setAllParts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [partBinQty, setPartBinQty] = useState(0);
  const [currentUser, setCurrentUser] = useState('');


  useEffect(() => {
    const init = async () => {
      createPartMasterTable();
      createInvoiceTable();

      const user = await AsyncStorage.getItem('loggedInUser');
      console.log('Current user:', user);
      setCurrentUser(user);

      fetchPartsFromDB();
    };
    init();
  }, []);


  useEffect(() => {
    const init = async () => {
      // await restoreBackupDB();
      createPartMasterTable();
      fetchPartsFromDB();
    };
    init();
  }, []);

  const fetchPartsFromDB = async () => {
    getAllParts(async (rows) => {
      const withSerial = rows.map((row, index) => ({
        ...row,
        serial: index + 1
      }));
      setAllParts(withSerial);
      setTableData(withSerial); // Initially show all
      await AsyncStorage.setItem('partCount', `${withSerial.length}`);
      // console.log(withSerial.length)

    });


  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = allParts.filter(item =>
      item.partNo?.toLowerCase().includes(query.toLowerCase()) ||
      item.visteonPart?.toLowerCase().includes(query.toLowerCase())
    );
    setTableData(filtered);
  };

  const handleAddPart = () => {
    if (!newUsername || !newPassword) {
      Alert.alert('Error', 'Please fill the all fields.');
      return;
    }

    // insertPart({ partNo: newUsername, visteonPart: newPassword, binQty: partBinQty });

    insertPart({ partNo: newUsername, visteonPart: newPassword, binQty: partBinQty }, (success) => {
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PartMaster Successfully Inserted..',
          position: 'top',
          visibilityTime: 1300,
          topOffset: 5,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'PartMaster Inster Error',
          position: 'top',
          visibilityTime: 1300,
          topOffset: 5,
        });
        return
      }
    });

    setShowModal(false);
    setNewUsername('');
    setNewPassword('');
    setPartBinQty(0)

    getAllParts(async users => {
      const formatted = users.map((user, index) => ({
        serial: index + 1,
        userId: user.id.toString(),
        partNo: user.partNo,
        visteonPart: user.visteonPart,
        binQty: user.binQty
      }));


      setTableData(formatted);
      setAllParts(formatted);
      await AsyncStorage.setItem('partCount', `${formatted.length}`);

      console.log('inside insert: ', formatted.length)
    });

  };

  const handlePartDelete = (partNo) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete Part "${partNo}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePart(partNo, (success, message) => {
              Toast.show({
                type: success ? 'success' : 'error',
                text1: success ? 'Deleted Successfully' : 'Error',
                text2: success ? `${partNo} was deleted.` : message,
                position: 'top',
                visibilityTime: 1300,
                topOffset: 5,
              });

              if (success) {
                fetchPartsFromDB(); // Refresh table
              }
            });
          },
        },
      ],
      { cancelable: true }
    );
  };



  const handleClose = () => {
    setNewUsername('');
    setNewPassword('');
    setPartBinQty(0)
    setShowModal(false)
  }


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          <View style={{ marginTop: 20, gap: 20 }}>

            {/* {
              !tableData.length && <TouchableOpacity
                style={{ alignSelf: 'flex-end' }}
                onPress={handleInsertData}
                disabled={isDis}
              >
                <Text style={{ color: '#A45B06', fontFamily: theme.fonts.dmBold }}>+ Add New</Text>
              </TouchableOpacity>
            } */}

            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter Part Name/Number' value={searchQuery} onChangeText={handleSearch} />
              <TouchableOpacity style={styles.tiles}>
                <Text style={styles.txtname}>Search</Text>
              </TouchableOpacity>
            </View>

          </View>

          {currentUser === 'admin' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={[styles.txtname, { color: 'white' }]}>Add Part</Text>
            </TouchableOpacity>
          )}

          <Modal
            visible={showModal}
            transparent
            animationType="slide"
            onRequestClose={() => handleClose()}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                Keyboard.dismiss();
                handleClose();
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Add New Part</Text>

                  <View style={{ gap: 20, marginBottom: 10, }}>
                    <TextInput
                      placeholder="Customer Part Number"
                      value={newUsername}
                      onChangeText={setNewUsername}
                      style={styles.Addinput}
                      autoCapitalize='characters'
                    // autoFocus
                    />
                    <TextInput
                      placeholder="Visteon Part Number"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={styles.Addinput}
                      autoCapitalize='characters'
                    />

                    <TextInput
                      placeholder="Bin Quantity"
                      value={partBinQty}
                      onChangeText={setPartBinQty}
                      style={styles.Addinput}
                      keyboardType='number-pad'
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleClose()}>
                      <Text style={[styles.txtname, { color: 'black' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn2} onPress={handleAddPart}>
                      <Text style={[styles.txtname, { color: 'white' }]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Table */}
          <Table data={tableData} columns={columns} handlePartDelete={handlePartDelete} />

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
  Addinput: {
    fontSize: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    height: 45,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontFamily: theme.fonts.dmRegular,
    color: COLORS.textBlack,
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
  addButton: {
    backgroundColor: COLORS.primaryOrange,
    marginTop: 15,
    borderRadius: 30,
    alignItems: 'center',
    padding: 12,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContainer: {
    width: '90%',
    height: 'auto',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.dmBold,
    marginBottom: 15,
  },
  actionBtn: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 50,
    padding: 10,
    paddingVertical: 15,
    flex: 1,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  actionBtn2: {
    backgroundColor: COLORS.primaryOrange,
    borderRadius: 50,
    padding: 10,
    paddingVertical: 15,
    flex: 1,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  }


});

export default PartMaster;
