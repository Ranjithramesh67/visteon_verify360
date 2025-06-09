// App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import theme from './constants/theme';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';
import { COLORS } from './constants/colors';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { restoreBackupDB } from './services/BackupService';
import { useEffect } from 'react';


export default function App() {
  useEffect(() => {
    const init = async () => {
      await restoreBackupDB();
    };
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, fontFamily: theme.fonts.dmRegular }}>
      <StatusBar backgroundColor={COLORS.primaryOrange} barStyle="light-content" />
      <NavigationContainer>
        <InvoiceProvider>
          <AppNavigator />
          <Toast />
        </InvoiceProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
