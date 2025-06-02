import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import StyledButton from '../components/StyledButton';
import StyledInput from '../components/StyledInput';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

import { loginUser } from '../services/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // if (!username.trim() || !password.trim()) {
    //   Alert.alert('Error', 'Username and Password are required.');
    //   return;
    // }
    // setLoading(true);
    // const res = await loginUser({ username, password });
    // setLoading(false);


    // if (res.status == true) {
    //   await AsyncStorage.setItem('fullname', res.data.fullname);
    //   await AsyncStorage.setItem('id', String(res.data.id));
    //   await AsyncStorage.setItem('authToken', res.data.token);

    //   console.log("Navigating to MainApp...");
    //   navigation.replace('MainApp');
    // }
    navigation.replace('MainApp');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
    >
      <StatusBar style="light" />
      <ImageBackground
        source={require('../assets/images/bg3.png')} // Replace with your image path
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Fixed Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Visteon</Text>
        </View>

        {/* Scrollable Form */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome.....</Text>

            <StyledInput
              placeholder="User Name"
              value={username}
              onChangeText={setUsername}
              iconName="person-outline"
            />
            <StyledInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primaryOrange} style={{ marginTop: 20 }} />
            ) : (
              <StyledButton title="Log in" onPress={handleLogin} />
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    marginTop: 80,
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 48,
    fontFamily: theme.fonts.dmMedium,
    color: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderTopRightRadius: 150,
    paddingHorizontal: 30,
    paddingVertical: 40,
    minHeight: height * 0.55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 2,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: theme.fonts.dmBold,
    color: COLORS.primaryOrange,
    marginBottom: 30,
    textAlign: 'left',
  },
});

export default LoginScreen;
