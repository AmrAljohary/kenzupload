import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Platform,
    I18nManager,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../components/ui/Text";
import { Button } from "../components/ui/Button";
import { useAppLanguage } from "../hooks/useLanguage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// الشعار
const LOGO = require("../assets/images/Logo.jpg");
// أعلام البلدان
const SA_FLAG = require("../assets/images/SA.png");
const US_FLAG = require("../assets/images/USA.png");
export const LANGUAGE_SELECTED_KEY = "language_selected";
export default function LanguageSelectionScreen() {
    const router = useRouter();
    const { currentLanguage, switchLanguage } = useAppLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState<"ar" | "en">(
        (currentLanguage as "ar" | "en") || "ar"
    );

    const handleLanguageSelect = (lang: "ar" | "en") => {
        setSelectedLanguage(lang);
    };

    const handleContinue = async () => {
        const result = await switchLanguage(selectedLanguage);
        await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, "true");
        // الانتقال إلى شاشة التعريف بعد اختيار اللغة
        router.replace("/intro");
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* الشعار */}
            <View
                style={[
                    styles.logoContainer,
                    {
                        alignItems:
                            selectedLanguage === "ar"
                                ? "flex-end"
                                : "flex-start",
                    },
                ]}
            >
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                {/* العنوان */}
                <View
                    style={[
                        styles.titleContainer,
                        {
                            alignItems:
                                selectedLanguage === "ar"
                                    ? "flex-end"
                                    : "flex-start",
                        },
                    ]}
                >
                    <Text variant="h2" style={styles.title} align="center">
                        {selectedLanguage === "ar"
                            ? "قم بإختيار لغة التطبيق"
                            : "Choose Your Language"}
                    </Text>
                    <Text
                        variant="body"
                        style={styles.subtitle}
                        align="center"
                        color="#666"
                    >
                        {selectedLanguage === "ar"
                            ? "اختر لغتك المفضلة"
                            : "Choose Your Default Language"}
                    </Text>
                </View>
            </View>

            {/* خيارات اللغة */}
            <View style={[styles.languageOptions]}>
                <TouchableOpacity
                    style={[
                        styles.languageOption,
                        selectedLanguage === "ar" && styles.selectedLanguage,
                        {
                            flexDirection:
                                selectedLanguage === "ar"
                                    ? "row"
                                    : "row-reverse",
                        },
                    ]}
                    onPress={() => handleLanguageSelect("ar")}
                >
                    <View style={styles.checkmarkContainer}>
                        {selectedLanguage === "ar" && (
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color="#000"
                            />
                        )}
                    </View>

                    <View
                        style={[
                            styles.languageContent,
                            {
                                flexDirection:
                                    selectedLanguage === "ar"
                                        ? "row"
                                        : "row-reverse",
                            },
                        ]}
                    >
                        <Text
                            variant="h3"
                            style={[
                                styles.languageText,
                                selectedLanguage === "ar" &&
                                    styles.selectedLanguageText,
                            ]}
                        >
                            اللغة العربية
                        </Text>
                        <Image source={SA_FLAG} style={styles.flagIcon} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.languageOption,
                        selectedLanguage === "en" && styles.selectedLanguage,
                        {
                            flexDirection:
                                selectedLanguage === "ar"
                                    ? "row"
                                    : "row-reverse",
                        },
                    ]}
                    onPress={() => handleLanguageSelect("en")}
                >
                    <View style={styles.checkmarkContainer}>
                        {selectedLanguage === "en" && (
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color="#000"
                            />
                        )}
                    </View>

                    <View
                        style={[
                            styles.languageContent,
                            {
                                flexDirection:
                                    selectedLanguage === "ar"
                                        ? "row"
                                        : "row-reverse",
                            },
                        ]}
                    >
                        <Text
                            variant="h3"
                            style={[
                                styles.languageText,
                                selectedLanguage === "en" &&
                                    styles.selectedLanguageText,
                            ]}
                        >
                            English
                        </Text>
                        <Image source={US_FLAG} style={styles.flagIcon} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* زر الاستمرار */}
            <View style={styles.buttonContainer}>
                <Button
                    title={selectedLanguage === "ar" ? "استمرار" : "Continue"}
                    variant="primary"
                    fullWidth
                    style={styles.continueButton}
                    onPress={handleContinue}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    logoContainer: {
        alignItems: "flex-end",
        marginTop: Platform.OS === "ios" ? 60 : 40,
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        marginTop: 20,
    },
    titleContainer: {
        marginTop: 10,
        marginBottom: 7,
    },
    title: {
        fontSize: 23,
        fontFamily: "somar-bold",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        fontFamily: "somar-regular",
    },
    languageOptions: {
        width: "100%",
    },
    languageOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "#F9FAFB",
    },
    languageContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        justifyContent: "flex-end",
    },
    selectedLanguage: {
        borderColor: "#000",
        borderWidth: 1,
    },
    languageText: {
        fontSize: 18,
        fontFamily: "somar-medium",
    },
    selectedLanguageText: {
        color: "#000",
        fontFamily: "somar-medium",
    },
    flagIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    checkmarkContainer: {
        width: 24,
        height: 24,
    },
    buttonContainer: {
        width: "100%",
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
    },
    continueButton: {
        marginBottom: 20,
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 16,
    },
    indicatorContainer: {
        alignItems: "center",
        marginTop: 10,
    },
    indicator: {
        width: 60,
        height: 4,
        backgroundColor: "#D1D5DB",
        borderRadius: 2,
    },
});
