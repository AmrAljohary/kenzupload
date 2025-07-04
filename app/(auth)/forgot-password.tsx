import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    I18nManager,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuthStore } from "../../store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationStore } from "../../store/notification";

const { height, width } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { t, isRTL } = useAppLanguage();
    const sendOtp = useAuthStore((state) => state.sendOtp);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const showNotification = useNotificationStore(
        (state) => state.showNotification
    );
    const hideNotification = useNotificationStore(
        (state) => state.hideNotification
    );

    const [email, setEmail] = useState("");
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [extraPadding, setExtraPadding] = useState(false);
    const [formErrors, setFormErrors] = useState({
        email: "",
    });

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            "keyboardDidShow",
            () => {
                setKeyboardVisible(true);
                setExtraPadding(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            "keyboardDidHide",
            () => {
                setKeyboardVisible(false);
                setTimeout(() => {
                    setExtraPadding(false);
                }, 100);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        if (error) {
            showNotification({
                type: "error",
                mainText: t("auth.forgotPasswordScreen.failed"),
                subText: error,
                duration: 5000,
            });
        }
    }, [error, t, showNotification]);

    const validateForm = () => {
        let valid = true;
        const errors = {
            email: "",
        };

        if (!email.trim()) {
            errors.email = t("auth.emailRequired");
            valid = false;
        }

        setFormErrors(errors);
        return valid;
    };

    const handleSendOtp = async () => {
        Keyboard.dismiss();

        if (!validateForm()) {
            showNotification({
                type: "error",
                mainText: t("auth.formValidationFailed"),
                subText: t("auth.pleaseFixErrors"),
                duration: 3000,
            });
            return;
        }

        clearError();

        showNotification({
            type: "loading",
            mainText: t("auth.forgotPasswordScreen.sending"),
            subText: t("auth.pleaseWait"),
            autoClose: false,
        });

        try {
            await sendOtp({ email });
            hideNotification();

            showNotification({
                type: "success",
                mainText: t("auth.forgotPasswordScreen.otpSent"),
                subText: t("auth.forgotPasswordScreen.checkEmail"),
                duration: 2000,
            });

            // توجيه المستخدم إلى شاشة التحقق من الرمز
            setTimeout(() => {
                router.push({
                    pathname: "/(auth)/otp",
                    params: {
                        email,
                        type: "forget",
                    },
                });
            }, 2000);
        } catch (err) {
            // سيتم عرض الخطأ تلقائياً من خلال useEffect
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#fff" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <SafeAreaView style={styles.container}>
                <Stack.Screen
                    options={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "#fff" },
                    }}
                />
                <StatusBar style="dark" backgroundColor="#fff" />

                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingBottom: extraPadding ? 120 : 0,
                        backgroundColor: "#fff",
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[
                            styles.backButton,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        <Ionicons
                            name={isRTL ? "chevron-forward" : "chevron-back"}
                            size={24}
                            color="#000"
                        />
                    </TouchableOpacity>

                    <View
                        style={[
                            styles.logoContainer,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        <Image
                            source={require("../../assets/images/Logo.jpg")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text
                        style={[
                            styles.title,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.forgotPasswordScreen.title")}
                    </Text>
                    <Text
                        style={[
                            styles.description,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.forgotPasswordScreen.description")}
                    </Text>

                    <View style={styles.formContainer}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { textAlign: isRTL ? "right" : "left" },
                            ]}
                        >
                            {t("auth.email")}
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        textAlign: isRTL ? "right" : "left",
                                        paddingLeft: isRTL ? 15 : 45,
                                        paddingRight: isRTL ? 45 : 15,
                                    },
                                    formErrors.email ? styles.inputError : null,
                                ]}
                                placeholder={t("auth.email")}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (formErrors.email) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            email: "",
                                        }));
                                    }
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <View
                                style={[
                                    styles.inputIconContainer,
                                    isRTL ? { right: 15 } : { left: 15 },
                                ]}
                            >
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#999"
                                />
                            </View>
                        </View>
                        {formErrors.email ? (
                            <Text style={styles.errorText}>
                                {formErrors.email}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.bottomSection}>
                        <Button
                            title={t("auth.forgotPasswordScreen.sendCode")}
                            onPress={handleSendOtp}
                            loading={isLoading}
                            fullWidth
                            variant="primary"
                            style={styles.submitButton}
                        />

                        <View
                            style={[
                                styles.loginContainer,
                                {
                                    flexDirection: isRTL
                                        ? "row-reverse"
                                        : "row",
                                },
                            ]}
                        >
                            <Text style={styles.rememberText}>
                                {t(
                                    "auth.forgotPasswordScreen.rememberPassword"
                                )}{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/login")}
                            >
                                <Text style={styles.loginText}>
                                    {t("auth.login")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    backButton: {
        marginTop: 50,
    },
    logoContainer: {
        marginTop: height * 0.05,
    },
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 20,
        fontFamily: "somar-bold",
        marginTop: 20,
        color: "#000",
    },
    description: {
        fontSize: 14,
        color: "#777",
        fontFamily: "somar-light",
        marginTop: 8,
        marginBottom: 30,
    },
    formContainer: {
        marginTop: 10,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 5,
        color: "#333",
        fontFamily: "somar-medium",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        height: 50,
        position: "relative",
    },
    input: {
        flex: 1,
        fontSize: 14,
        height: "100%",
        fontFamily: "somar-regular",
    },
    inputIconContainer: {
        position: "absolute",
        height: "100%",
        justifyContent: "center",
    },
    inputError: {
        borderColor: "#FF5252",
        borderWidth: 1,
    },
    errorText: {
        color: "#FF5252",
        fontSize: 12,
        fontFamily: "somar-regular",
        marginTop: 4,
    },
    bottomSection: {
        marginTop: "auto",
        marginBottom: Platform.OS === "ios" ? 20 : 30,
        width: "100%",
    },
    submitButton: {
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 14,
        height: 55,
    },
    loginContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    rememberText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-regular",
    },
    loginText: {
        fontSize: 14,
        color: "#000",
        textDecorationLine: "underline",
        fontFamily: "somar-bold",
    },
});
