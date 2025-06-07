// VisteonApp/src/screens/HomeScreen.js
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';


const { width } = Dimensions.get('window');
const buttonSize = (width - 80) / 2;

const HomeScreen = ({ navigation }) => {
  const menuItems = [
    { id: '1', title: 'Invoice / Bin Verification', screen: 'InvoiceBinVerification' },
    { id: '2', title: 'Customer / VEPL Verification', screen: 'CustomerVeplVerification' },
    { id: '3', title: 'Bin Label / Part Label Verification', screen: 'BinLabelVerification' },
    { id: '4', title: 'Printed QR Stickers', screen: 'PrintedQRStickers' },

  ];

  const itemsCount = {
    Parts: 125,
    Customer: 80,
    User: 7,
  }

  const handleMenuPress = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <View style={styles.safeArea}>
      <HeaderBar title="Home" showNotification={true} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.outerContainer}>

          <View style={styles.topContainer}>
            <Text style={styles.topContainerTitle}>Welcome...!</Text>
            <View style={styles.topContainerMenu}>
              <TouchableOpacity style={styles.menucard} onPress={() => navigation.navigate("PartMaster")}>
                <Ionicons name='settings-sharp' size={20} style={styles.cardicons} />
                <Text style={styles.menuItem}>Part</Text>
                <Text style={styles.itemCount}>{itemsCount.Parts} Items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menucard} onPress={() => navigation.navigate('MaterialMaster')}>
                <Entypo name='tools' size={20} style={styles.cardicons} />
                <Text style={styles.menuItem}>Customer</Text>
                <Text style={styles.itemCount}>{itemsCount.Customer} Items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menucard} onPress={() => navigation.navigate('Customer')}>
                <Fontisto name='persons' size={20} style={styles.cardicons} />
                <Text style={styles.menuItem}>User</Text>
                <Text style={styles.itemCount}>{itemsCount.User} Items</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuButton}
                onPress={() => handleMenuPress(item.screen)}
              >
                {
                  item.id == '1' ? (
                    <Ionicons name='document-text' size={28} style={styles.menuicons} />

                  ) : item.id == '2' ? (
                    <MaterialCommunityIcons name='shield-check' size={28} style={styles.menuicons} />

                  ) : item.id == '3' ? (
                    <Ionicons name='print' size={28} style={styles.menuicons} />

                  ) : (
                    <MaterialCommunityIcons name='qrcode-scan' size={28} style={styles.menuicons} />
                  )
                }
                <Text style={styles.menuButtonText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBEBEB',
  },
  outerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 10,
  },
  graphicContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.secondaryOrange,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  topContainer: {
    justifyContent: 'flex-start',
    width: '100%',
  },
  topContainerTitle: {
    fontSize: 30,
    fontFamily: theme.fonts.dmBold,
    paddingBottom: 15,
    marginTop:10,
  },
  topContainerMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  menucard: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 87,
    height: 90,
    backgroundColor: '#e5e7eb',
    borderRadius: 7,
  },
  menuItem: {
    textAlign: 'center',
    fontFamily: theme.fonts.dmMedium,
  },
  itemCount: {
    textAlign: 'center',
    fontFamily: theme.fonts.dmRegular,
    fontSize: 12,
  },
  cardicons: {
    color: COLORS.primaryOrange,
    marginBottom: 10,
  },
  menuicons: {
    color: "white",
    marginBottom: 10,
  },
  graphicText: {
    fontSize: 18,
    color: COLORS.primaryOrange,
    fontWeight: 'bold',
    marginTop: 10,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuButton: {
    width: buttonSize,
    height: buttonSize * 0.9,
    backgroundColor: COLORS.primaryOrange,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  menuButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: theme.fonts.dmBold,
    textAlign: 'center',
  },
});

export default HomeScreen;
