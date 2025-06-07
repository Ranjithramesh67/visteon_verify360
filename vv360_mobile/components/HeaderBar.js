// VisteonApp/src/components/HeaderBar.js
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const HeaderBar = ({ title, navigation, showBackButton, onBackPress, showNotification, onNotificationPress }) => {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNotification = () => {
    if(onNotificationPress) {
        onNotificationPress();
    } else {
        // Default notification action, e.g., navigate to a notifications screen
        console.log("Notification icon pressed");
        // navigation.navigate('NotificationsScreen');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 , paddingBottom: 10 }]}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rightContainer}>
        {showNotification && (
          <TouchableOpacity onPress={handleNotification} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

HeaderBar.defaultProps = {
    showBackButton: false, // By default, don't show back if it's a root tab screen
    showNotification: false,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryOrange, // Match app theme
    paddingHorizontal: 15,
    // height: Platform.OS === 'ios' ? 90 : 70, // Adjust height considering status bar
    // paddingTop: Platform.OS === 'ios' ? 40 : 20, // Adjust for status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 3, // Give more space to title
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: theme.fonts.dmBold,
    color: COLORS.white,
  },
  iconButton: {
    padding: 5, // For easier touch
  },
});

export default HeaderBar;
