// VisteonApp/src/navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/colors';
import BinLabelVerificationScreen from '../screens/BinLabelVerificationScreen';
import CustomerVeplVerificationScreen from '../screens/CustomerVeplVerificationScreen';
import InvoiceBinVerificationScreen from '../screens/InvoiceBinVerificationScreen';
import LoginScreen from '../screens/LoginScreen';
import PrintedQRStickersScreen from '../screens/PrintedQRStickersScreen';
import BottomTabNavigator from './BottomTabNavigator'; // This will contain HomeScreen and others
import SplashScreen from '../screens/SplashScreen';
import theme from '../constants/theme';
import PartMaster from '../screens/Masters/PartMaster';
import MaterialMaster from '../screens/Masters/MaterialMaster';
import CustomerMaster from '../screens/Masters/CustomerMaster';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primaryOrange,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: theme.fonts.dmMedium,
          fontSize:16,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name='Splash' component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }} // No header for the Login screen
      />
      <Stack.Screen
        name="MainApp"
        component={BottomTabNavigator}
        options={{ headerShown: false }} // The BottomTabNavigator will manage its own headers or lack thereof
      />
      <Stack.Screen
        name="InvoiceBinVerification"
        component={InvoiceBinVerificationScreen}
        options={{ title: 'Invoice / Bin Verification' }}
      />
      <Stack.Screen
        name="CustomerVeplVerification"
        component={CustomerVeplVerificationScreen}
        options={{ title: 'Customer / VEPL Verification' }}
      />
      <Stack.Screen
        name="BinLabelVerification"
        component={BinLabelVerificationScreen}
        options={{ title: 'Bin Label / Part Label Verification' }}
      />
      <Stack.Screen
        name="PrintedQRStickers"
        component={PrintedQRStickersScreen}
        options={{ title: 'Printed QR Stickers' }}
      />
      <Stack.Screen
        name="PartMaster"
        component={PartMaster}
        options={{title:'Part Master'}}
      />
      <Stack.Screen
        name='MaterialMaster'
        component={MaterialMaster}
        options={{title:'Material Master'}}
      />
      <Stack.Screen
        name='Customer'
        component={CustomerMaster}
        options={{title:'Customer Master'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
