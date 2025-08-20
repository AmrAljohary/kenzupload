import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Image,
    I18nManager,
    Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { useAppLanguage } from "../../hooks/useLanguage";
import { Ionicons } from "@expo/vector-icons";
import { getBottomSpace } from "react-native-iphone-x-helper"; // إضافة هذا الاستيراد

export default function SuccessRegisterScreen() {
    const router = useRouter();
    const { t, isRTL } = useAppLanguage();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // بعد فترة محددة، انتقل إلى صفحة تسجيل الدخول
        const timer = setTimeout(() => {
            setLoading(false);
            router.replace("/(auth)/login");
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View style={styles.contentContainer}>
                <Ionicons
                    name="checkmark-circle"
                    size={100}
                    color="#4CAF50"
                    style={styles.successIcon}
                />

                <Text style={styles.title}>
                    {t("auth.successRegister.title")}
                </Text>

                <Text style={styles.description}>
                    {t("auth.successRegister.description")}
                </Text>

                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#2563EB"
                        style={styles.loader}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Platform.OS === "ios" ? 20 : 0,
        paddingBottom: Platform.OS === "ios" ? getBottomSpace() : 0, // إضافة هذا السطر
    },
    successIcon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 20,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#777",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
    },
    loader: {
        marginTop: 20,
    },
});
