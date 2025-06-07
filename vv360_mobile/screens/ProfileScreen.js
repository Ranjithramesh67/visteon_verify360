// VisteonApp/src/screens/ProfileScreen.js
// Placeholder Screen for Bottom Tab
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { COLORS } from '../constants/colors';
import { commonStyles } from '../constants/styles';
import { useState, useEffect } from 'react';
import FontAwesome from "react-native-vector-icons/FontAwesome"
import { launchImageLibrary } from 'react-native-image-picker';
import theme from '../constants/theme';
import { ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation }) => {

  const isScreenFocused = useIsFocused();

  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    profileImage: null,
  });


  const handleImagePicker = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('Image picker error: ', response.errorMessage);
      } else {
        const imageUri = response.assets[0].uri;
        setProfileImage(imageUri);
        setForm({ ...form, profileImage: imageUri });
      }
    });
  };

  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const u_id = await AsyncStorage.getItem('id');
      setUserId(u_id);
      const { data } = await getUser(u_id);

      if (data) {
        setForm({
          name: data.fullname,
          email: data.email,
          mobile: data.mobile,
          profileImage: data.profile_photo,
          password: "demopass"
        })

        setProfileImage(Config.IMAGE_BASE_URL + data.profile_photo)
      }
    }
    catch (error) {
      console.log("server error: ", error);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isScreenFocused) {
      fetchUser();
    }
  }, [isScreenFocused])

  const handleUpdate = async () => {
    if (form.mobile.length !== 10) {
      Toast.show({
        type: 'info',
        text1: 'Alert',
        text2: 'Please enter a valid 10-digit mobile number',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('userId', userId)
    formData.append('full_name', form.name);
    formData.append('email', form.email);
    formData.append('mobile', form.mobile);

    if (profileImage) {
      const fileType = profileImage.split('.').pop() === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('profile_photo', {
        uri: profileImage,
        type: fileType,
        name: `profile.${fileType.split('/')[1]}`,
      });
    }

    try {
      const response = await updateUser(formData);
      if (response.status == true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
          position: 'top'
        });
      }
      // console.log(formData)
      // console.log('Profile updated successfully:', response);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
      <HeaderBar title="Profile" navigation={navigation} showNotification={true} />
      {
        isLoading ? (
          <ActivityIndicator size={'large'} color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            <View style={styles.container}>

              <View style={{ marginTop: 20 }}>
                <TouchableOpacity style={{ width: '50%', marginHorizontal: 'auto' }} onPress={handleImagePicker}>
                  <Image
                    source={profileImage ? { uri: profileImage } : require("../assets/images/user.png")}
                    style={styles.profileImage}
                  />
                  <TouchableOpacity style={styles.cameraContainer} onPress={handleImagePicker}>
                    <FontAwesome
                      name="camera"
                      style={styles.cameraIcon}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 40, gap: 20 }}>

                <View style={styles.inputField}>
                  <TextInput style={styles.input} value={form.name} onChangeText={text => setForm({ ...form, name: text })} placeholder='Your Name' />
                  <View style={styles.tiles}>
                    <Text style={styles.txtname}>Name</Text>
                  </View>
                </View>

                <View style={styles.inputField}>
                  <TextInput maxLength={10} value={form.mobile} onChangeText={text => setForm({ ...form, mobile: text })} keyboardType='phone-pad' style={styles.input} placeholder='Mobile No' />
                  <View style={styles.tiles}>
                    <Text style={styles.txtname}>Mobile</Text>
                  </View>
                </View>

                <View style={styles.inputField}>
                  <TextInput value={form.email} onChangeText={text => setForm({ ...form, email: text })} keyboardType='email-address' style={styles.input} placeholder='Your email' />
                  <View style={styles.tiles}>
                    <Text style={styles.txtname}>Mail</Text>
                  </View>
                </View>

                <View style={styles.inputField}>
                  <TextInput value={form.password} onChangeText={text => setForm({ ...form, password: text })} style={styles.input} placeholder='********' />
                  <View style={styles.tiles}>
                    <Text style={styles.txtname}>Password</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
                  <Text style={styles.btnTxt}>Edit Profile</Text>
                </TouchableOpacity>

              </View>

            </View>
          </ScrollView>
        )
      }

    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGrayBackground,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: 'center',
    marginTop: 10,
  },
  cameraContainer: {
    alignSelf: 'center',
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 500,
    marginTop: -15,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 500,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  inputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
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
  btn: {
    width: 150,
    paddingVertical: 15,
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  btnTxt: {
    color: 'white',
    fontFamily: theme.fonts.dmMedium,
    fontSize: 14,

  }
});

export default ProfileScreen;
