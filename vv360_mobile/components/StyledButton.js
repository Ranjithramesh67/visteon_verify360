// VisteonApp/src/components/StyledButton.js
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const StyledButton = ({ title, onPress, style, textStyle, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, textStyle, disabled && styles.disabledButtonText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10, // More rounded corners as per UI
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: theme.fonts.dmBold,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
  },
  disabledButtonText: {
    color: COLORS.gray,
  }
});

export default StyledButton;
