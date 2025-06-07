import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    navigation.replace("Login");
                } else {
                    navigation.replace("Login");
                }
            } catch (error) {
                console.error("Auto-login error:", error);
                navigation.replace("Login");
            }
        };

        const timer = setTimeout(() => {
            checkLoginStatus();
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/visteon-logo.png')}
                style={styles.logo}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFA500",
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
});
