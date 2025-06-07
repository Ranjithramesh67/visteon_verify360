// VisteonApp/src/components/StyledInput.js
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const StyledInput = ({ label, iconName, value, onChangeText, placeholder, secureTextEntry, keyboardType, editable = true, style, inputStyle, error }) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.errorBorder : {}]}>
        {iconName && <Ionicons name={iconName} size={22} color={COLORS.gray} style={styles.icon} />}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumGray}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize="none"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15, // Spacing between inputs
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground, // Light background for input
    borderRadius: 10, // Rounded corners for input fields
    borderWidth: 1,
    borderColor: COLORS.lightBorder, // Subtle border
    paddingHorizontal: 15,
    height: 50, // Fixed height for inputs
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.dmRegular,
    color: COLORS.textBlack,
  },
  errorBorder: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  }
});

export default StyledInput;
