import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ height: 50, borderLeftColor: 'green', borderRadius: 8 }}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      text1Style={{
        fontSize: 13,
        fontWeight: 'bold',
      }}
      text2Style={{
        fontSize: 12,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ height: 50, borderLeftColor: 'red', borderRadius: 8 }}
      text1Style={{
        fontSize: 13,
        fontWeight: 'bold',
      }}
      text2Style={{
        fontSize: 12,
      }}
    />
  ),
};
