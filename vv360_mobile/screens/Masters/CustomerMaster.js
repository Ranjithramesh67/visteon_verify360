import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, Modal, Alert
} from 'react-native';



import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';
import StyledInput from '../../components/StyledInput';
import { getAllUsers, insertUser } from '../../services/userDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomerMaster = () => {

  const columns = [
    { label: 'S.No', key: 'serial' },
    { label: 'User Id', key: 'userId' },
    { label: 'User Name', key: 'userName' },
    { label: 'Password', key: 'address' }
  ];

  const [tableData, setTableData] = useState([
    // { userId: '1234', userName: 'admin', address: 'Chennai 60001' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await AsyncStorage.getItem('loggedInUser');
        console.log('Logged in user:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }

      getAllUsers(async users => {
        const formatted = users.map((user, index) => ({
          serial: index + 1,
          userId: user.id.toString(),
          userName: user.username,
          address: user.password,
        }));

        setTableData(formatted);
        setAllUsers(formatted);
        await AsyncStorage.setItem('userCount', `${formatted.length}`);
        // console.log("User Count: ",formatted.length)
      });
    };

    fetchData();
  }, []);




  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = allUsers.filter(item =>
      item.userName?.toLowerCase().includes(query.toLowerCase())
    );
    setTableData(filtered);
  }

  const handleAddUser = () => {
    if (!newUsername || !newPassword) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    insertUser(newUsername, newPassword);

    setShowModal(false);
    setNewUsername('');
    setNewPassword('');

    getAllUsers(users => {
      const formatted = users.map((user, index) => ({
        serial: index + 1,
        userId: user.id.toString(),
        userName: user.username,
        address: user.password,
      }));

      setTableData(formatted);
      setAllUsers(formatted);
    });
  };

  const handleClose = () => {
    setNewUsername('');
    setNewPassword('');
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
            <View style={styles.inputField}>
              <TextInput style={styles.input} placeholder='Enter User Id/Name' value={searchQuery} onChangeText={handleSearch} />
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
              <Text style={[styles.txtname, { color: 'white' }]}>Add User</Text>
            </TouchableOpacity>
          )}

          <Modal
            visible={showModal}
            transparent
            animationType="slide"
            onRequestClose={() => handleClose()}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New User</Text>

                <View style={{ gap: 20, marginBottom: 10, }}>
                  <TextInput
                    placeholder="Username"
                    value={newUsername}
                    onChangeText={setNewUsername}
                    style={styles.Addinput}
                  />
                  <TextInput
                    placeholder="Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.Addinput}
                    secureTextEntry
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleClose()}>
                    <Text style={styles.txtname}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleAddUser}>
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
    backgroundColor: 'rgba(244, 142, 22, 0.28)',
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

export default CustomerMaster;
