import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform,
  ScrollView, Modal, Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';


import { COLORS } from '../../constants/colors';
import theme from '../../constants/theme';
import Table from '../../components/Table';
import StyledInput from '../../components/StyledInput';
import { deleteUserByUsername, getAllUsers, insertUser } from '../../services/userDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const CustomerMaster = () => {

  const columns = [
    // { label: 'S.No', key: 'serial' },
    { label: 'User Id', key: 'userId' },
    { label: 'User Name', key: 'userName' },
    { label: 'Password', key: 'address' },
    { label: 'Action', key: 'delUser' }
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

  const [showPassword, setShowPassword] = useState(false);



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

    // insertUser(newUsername, newPassword);

    insertUser(newUsername, newPassword, (success, msg) => {
      if (success) {
        setShowModal(false);
        setNewUsername('');
        setNewPassword('');

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

        });
      } else {
        Alert.alert('Error', msg);
        setNewUsername('');
        setNewPassword('');
      }
    });


  };

  const handleUserDelete = (username) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user "${username}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteUserByUsername(username, (success, message) => {
              Toast.show({
                type: success ? 'success' : 'error',
                text1: success ? 'Deleted Successfully' : 'Error',
                text2: success ? `${username} was deleted.` : message,
                position: 'bottom',
                visibilityTime: 1300,
                topOffset: 5,
              });

              if (success) {
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
              }
            });
          }
        }
      ],
      { cancelable: true }
    );
  };


  const handleClose = () => {
    setNewUsername('');
    setNewPassword('');
    setShowPassword(false)
    setShowModal(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            <TouchableWithoutFeedback
              onPress={() => {
                Keyboard.dismiss();
                handleClose();
              }}
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
                    <View style={[styles.inputContainer,{ flexDirection: 'row', alignItems: 'center' }]}>
                      <TextInput
                        placeholder="Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        style={[styles.passinput, { flex: 1 }]}
                      />

                      <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={COLORS.lightGray}
                          style={{ paddingHorizontal: 8 }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleClose()}>
                      <Text style={[styles.txtname, { color: 'black' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn2} onPress={handleAddUser}>
                      <Text style={[styles.txtname, { color: 'white' }]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Table */}
          <Table data={tableData} columns={columns} handleUserDelete={handleUserDelete} />

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
  passinput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.dmRegular,
    color: COLORS.textBlack,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
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

export default CustomerMaster;
