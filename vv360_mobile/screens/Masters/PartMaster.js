import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, Modal
} from 'react-native';
import StyledInput from '../../components/StyledInput';
import { createPartMasterTable, getAllParts, insertPart } from "../../services/database"


import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';
import { restoreBackupDB } from '../../services/BackupService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PartMaster = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'Part No', key: 'partNo' },
    { label: 'Visteon Part No', key: 'visteonPart' }
  ];

  const [tableData, setTableData] = useState([]);
  const [isDis, setIsDis] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [allParts, setAllParts] = useState([]);

  const [showModal, setShowModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentUser, setCurrentUser] = useState('');
  

  useEffect(() => {
    const init = async () => {
      createPartMasterTable();
  
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
      console.log(withSerial.length)

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

    const handleAddUser = () => {
      if (!newUsername || !newPassword) {
        Alert.alert('Error', 'Please enter both customer part number and vsteon part number.');
        return;
      }
  
      insertPart({partNo:newUsername, visteonPart:newPassword});
  
      setShowModal(false);
      setNewUsername('');
      setNewPassword('');
  
      getAllParts(users => {
        const formatted = users.map((user, index) => ({
          serial: index + 1,
          userId: user.id.toString(),
          partNo: user.partNo,
          visteonPart: user.visteonPart,
        }));
  
        setTableData(formatted);
        setAllUsers(formatted);
      });
    };


  const handleInsertData = async () => {
    const dummyParts = [
      { partNo: '94013T7900', visteonPart: 'VPLHBF-10849-ACK' },
      { partNo: '94003K6500', visteonPart: 'VPMHBF-10849-EAF' },
      { partNo: '94013K6500', visteonPart: 'VPMHBF-10849-EMM' },
      { partNo: '94013K6510', visteonPart: 'VPMHBF-10849-ENM' },
      { partNo: '94013K6530', visteonPart: 'VPMHBF-10849-ERM' },
      { partNo: '94013K6520', visteonPart: 'VPMHBF-10849-EPN' },
      { partNo: '94013BV710', visteonPart: 'VPRHBF-10E889-BP' },
      { partNo: '94013BV720', visteonPart: 'VPRHBF-10E889-CL' },
      { partNo: '94013BV730', visteonPart: 'VPRHBF-10E889-DP' }
    ];

    for (const part of dummyParts) {
      await insertPart(part);
    }

    fetchPartsFromDB();
    setIsDis(true);
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container}>
          <View style={{ marginTop: 20, gap: 20 }}>

            {
              !tableData.length && <TouchableOpacity
                style={{ alignSelf: 'flex-end' }}
                onPress={handleInsertData}
                disabled={isDis}
              >
                <Text style={{ color: '#A45B06', fontFamily: theme.fonts.dmBold }}>+ Add New</Text>
              </TouchableOpacity>
            }

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
              <Text style={styles.txtname}>Add Part</Text>
            </TouchableOpacity>
          )}

<Modal
            visible={showModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New Part</Text>

                <StyledInput
                  placeholder="Customer Part Number"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  style={styles.input}
                />
                <StyledInput
                  placeholder="Visteon Part Number"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  secureTextEntry
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={styles.tiles} onPress={() => setShowModal(false)}>
                    <Text style={styles.txtname}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tiles} onPress={handleAddUser}>
                    <Text style={styles.txtname}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    padding: 10,
    width: 100,
    height: 60,
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
    height: '40%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 10,
  },
  
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.dmBold,
    marginBottom: 15,
  },
  

});

export default PartMaster;
