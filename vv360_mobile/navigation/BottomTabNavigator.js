import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [tabLayouts, setTabLayouts] = useState([]);
  const translateX = useRef(new Animated.Value(0)).current;
  const activePillWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabLayouts.length === state.routes.length && tabLayouts[state.index] !== undefined && tabLayouts[state.index] !== null) {
      const { x, width } = tabLayouts[state.index];
      if (x !== undefined && width !== undefined) {
        Animated.spring(translateX, {
          toValue: x,
          useNativeDriver: false, // Changed to false to resolve width animation issue
          bounciness: 5,
          speed: 12,
        }).start();
        Animated.spring(activePillWidth, {
          toValue: width,
          useNativeDriver: false, // Stays false, which is correct for width
          bounciness: 5,
          speed: 12,
        }).start();
      }
    }
  }, [state.index, tabLayouts, translateX, activePillWidth]);

  const handleLayout = (event, index) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => {
      const newLayouts = [...prev];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarStyle}>
        {tabLayouts.length === state.routes.length && tabLayouts.every(layout => layout !== undefined && layout !== null) && (
          <Animated.View
            style={[
              styles.activePillStyle,
              {
                width: activePillWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let iconName;
          const iconSize = 22;

          if (route.name === 'Home') {
            iconName = isFocused ? 'home-variant' : 'home-variant-outline';
          } else if (route.name === 'Reports') {
            iconName = isFocused ? 'file-multiple' : 'file-multiple-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'account-circle' : 'account-circle-outline';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(event) => handleLayout(event, index)}
              style={styles.tabBarItemStyle}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={iconSize}
                color={isFocused ? COLORS.white : COLORS.textGray}
              />
              <Text style={[styles.tabBarLabelStyle, { color: isFocused ? COLORS.white : COLORS.textGray }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};


const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle:{paddingBottom: 120}
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGrayBackground,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  tabBarStyle: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBarItemStyle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    marginHorizontal: 0,
    paddingHorizontal: 10,
    zIndex: 1,
  },
  tabBarLabelStyle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  activePillStyle: {
    position: 'absolute',
    height: 48,
    top: (60 - 48) / 2,
    borderRadius: 24,
    backgroundColor: COLORS.primaryOrange,
    zIndex: 0,
  },
});

export default BottomTabNavigator;
