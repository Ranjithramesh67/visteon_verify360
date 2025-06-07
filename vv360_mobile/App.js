// App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import theme from './constants/theme';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';
import { COLORS } from './constants/colors';


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, fontFamily: theme.fonts.dmRegular }}>
      <StatusBar backgroundColor={COLORS.primaryOrange} barStyle="light-content" />
      <NavigationContainer>
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
