// VisteonApp/src/constants/styles.js
import { Dimensions, StyleSheet } from 'react-native';
import { COLORS } from './colors';

const { width, height } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({
  // --- Container Styles ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGrayBackground,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrayBackground,
    padding: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: COLORS.lightGrayBackground,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // --- Text Styles ---
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textBlack,
    marginBottom: 10,
    textAlign: 'center',
  },
  subTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: COLORS.textBlack,
    lineHeight: 22,
  },
  labelText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 5,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primaryOrange,
    fontWeight: '600',
  },

  // --- Input Styles ---
  // (More detailed input styles are in StyledInput.js, this could be for general form elements)
  formGroup: {
    marginBottom: 15,
    width: '100%',
  },

  // --- Button Styles ---
  // (More detailed button styles are in StyledButton.js)
  
  // --- Spacing ---
  horizontalRule: {
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    marginVertical: 20,
  },

  // --- Dimensions ---
  screenWidth: width,
  screenHeight: height,
});

// You can also define font families here if you're using custom fonts
export const FONTS = {
  // regular: 'YourFont-Regular',
  // bold: 'YourFont-Bold',
  // italic: 'YourFont-Italic',
};
