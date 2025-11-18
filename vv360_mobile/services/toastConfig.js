import { BaseToast, ErrorToast } from 'react-native-toast-message';
import theme from '../constants/theme';
import { COLORS } from '../constants/colors';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ height: 50, borderLeftColor: 'green', borderRadius: 8, backgroundColor: '#e3fce8' }}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      text1Style={{
        fontSize: 13,
        fontFamily: theme.fonts.dmBold,
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: theme.fonts.dmMedium,
        color: COLORS.gray
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ height: 50, borderLeftColor: 'red', borderRadius: 8, backgroundColor: '#fad9d9' }}
      text1Style={{
        fontSize: 13,
        fontFamily: theme.fonts.dmBold,
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: theme.fonts.dmMedium,
        color: COLORS.textGray
      }}
    />
  ),
};
