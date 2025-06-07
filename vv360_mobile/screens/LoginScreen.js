
import { useRef, useState } from 'react';
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
  StatusBar,
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

  const passwordRef = useRef();

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
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Changed for Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Often 0 or a small negative for "height"
    >
      <StatusBar backgroundColor={COLORS.gray} barStyle="light-content" />
      <ImageBackground
        source={require('../assets/images/bg3.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Visteon</Text>
        </View>

        {/* This View takes up the remaining space below the logo */}
        <View style={styles.scrollWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Good practice
          >
            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Welcome.....</Text>

              <StyledInput
                placeholder="User Name"
                value={username}
                onChangeText={setUsername}
                iconName="person-outline"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <StyledInput
                placeholder="Password"
                value={password}
                ref={passwordRef}
                onChangeText={setPassword}
                secureTextEntry
                iconName="lock-closed-outline"
                onSubmitEditing={handleLogin} // Optionally submit on password enter
              />

              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primaryOrange} style={{ marginTop: 20 }} />
              ) : (
                <StyledButton title="Log in" onPress={handleLogin} />
              )}
            </View>
          </ScrollView>
        </View>
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
    // justifyContent: 'flex-start', // Removed, handled by internal flex structure
  },
  logoContainer: {
    marginTop: 80, // Adjust as needed for status bar and desired spacing
    paddingHorizontal: 20,
    // Removed flex: 0.2 or similar, let it take natural height
  },
  logoText: {
    fontSize: 48,
    fontFamily: theme.fonts.dmMedium,
    color: COLORS.white,
  },
  scrollWrapper: { // New wrapper for ScrollView
    flex: 1, // This will take the space below the logo
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1, // Allows content to grow and enable scrolling
    justifyContent: 'flex-end', // Pushes formContainer to the bottom of the ScrollView
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderTopRightRadius: 150, // This large radius might look unusual on smaller parts of the curve
    paddingHorizontal: 30,
    paddingTop: 40, // Increased padding at the top of the form
    paddingBottom: Platform.OS === 'ios' ? 40 : 60, // More padding at bottom for better scroll room
    // minHeight: height * 0.55, // Consider removing or reducing if KAV handles it
    // Let the content define its height, ScrollView will handle overflow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 2, // Ensure it's above other potential elements if any
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
