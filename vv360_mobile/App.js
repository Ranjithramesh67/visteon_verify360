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
// import { BluetoothProvider } from './contexts/BluetoothContext';
import { PrinterProvider } from './contexts/PrinterContext';
import { restoreBackupDB } from './services/BackupService';
import { createUserTable, insertUser } from './services/userDatabase';
import { useEffect } from 'react';
import { toastConfig } from './services/toastConfig';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://33d65cc6f8192097cc39eee05a80944b@o4509710347141120.ingest.us.sentry.io/4509751363567616',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration()
  ],
  _experiments: { enableLogs: true }

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


export default Sentry.wrap(
  function App() {
    useEffect(() => {
      const init = async () => {
        await restoreBackupDB();
        // createCustomerTable();
        createUserTable();
      };
      init();
    }, []);

    return (
      <GestureHandlerRootView style={{ flex: 1, fontFamily: theme.fonts.dmRegular }}>
        <StatusBar backgroundColor={COLORS.primaryOrange} barStyle="light-content" />
        <NavigationContainer>
          <PrinterProvider>
            <InvoiceProvider>
              <AppNavigator />
              <Toast config={toastConfig} />
            </InvoiceProvider>
          </PrinterProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    );
  });