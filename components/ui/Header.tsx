import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
    Animated,
    I18nManager,
} from "react-native";
import React, { useRef, useEffect } from "react";
import { useNavigation, useRouter } from "expo-router";
import { useAppLanguage } from "@/hooks/useLanguage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    scrollY?: Animated.Value;
    transparent?: boolean;
}

const Header = ({
    title,
    showBackButton = true,
    scrollY,
    transparent = false,
}: HeaderProps) => {
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(transparent ? 0 : 1)).current;

    useEffect(() => {
        if (scrollY && transparent) {
            scrollY.addListener(({ value }) => {
                // Fade in header when scrolling down, with a threshold of 50
                const opacity = Math.min(1, value / 50);
                fadeAnim.setValue(opacity);
            });

            return () => {
                scrollY.removeAllListeners();
            };
        }
    }, [scrollY, transparent]);

    const goBack = () => {

            router.back()

    };

    const textColor = transparent
        ? fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["#ffffff", "#000000"],
          })
        : "#000000";

    return (
        <View style={isRTL ? styles.arabicContainer : styles.container}>
            {showBackButton && (
                <TouchableOpacity
                    onPress={goBack}
                    style={styles.backButtonContainer}
                >
                    <Ionicons
                        name={isRTL ? "chevron-forward" : "chevron-back"}
                        size={22}
                        color="#333"
                    />
                </TouchableOpacity>
            )}

            {title && (
                <Animated.Text style={[styles.Title]}>{title}</Animated.Text>
            )}
        </View>
    );
};

export default Header;

export const styles = StyleSheet.create({
    headerContainer: {
        width: "100%",
        zIndex: 10,
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    androidHeader: {
        backgroundColor: "#fff",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    container: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
        marginTop: 10,
    },
    arabicContainer: {
        width: "100%",
        flexDirection: "row-reverse",
        alignItems: "center",
        marginTop: 10,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    Title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginHorizontal: 16,
        fontFamily: "somar-bold",
    },
    backButtonContainer: {
        borderRadius: 12,
        overflow: "hidden",
    },
    buttonGradient: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
});
