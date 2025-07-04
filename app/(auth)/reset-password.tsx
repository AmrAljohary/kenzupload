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
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuthStore } from "../../store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationStore } from "../../store/notification";
import { I18nManager } from "react-native";

const { height, width } = Dimensions.get("window");

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { email = "" } = useLocalSearchParams<{ email: string }>();
    const { t, isRTL } = useAppLanguage();
    const resetPassword = useAuthStore((state) => state.resetPassword);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const showNotification = useNotificationStore(
        (state) => state.showNotification
    );
    const hideNotification = useNotificationStore(
        (state) => state.hideNotification
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [extraPadding, setExtraPadding] = useState(false);
    const [formErrors, setFormErrors] = useState({
        password: "",
        confirmPassword: "",
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
                mainText: t("auth.resetPasswordScreen.failed"),
                subText: error,
                duration: 5000,
            });
        }
    }, [error, t, showNotification]);

    const validateForm = () => {
        let valid = true;
        const errors = {
            password: "",
            confirmPassword: "",
        };

        if (!password) {
            errors.password = t("auth.passwordRequired");
            valid = false;
        } else if (password.length < 8) {
            errors.password = t("auth.passwordTooShort");
            valid = false;
        }

        if (!confirmPassword) {
            errors.confirmPassword = t("auth.confirmPasswordRequired");
            valid = false;
        } else if (password !== confirmPassword) {
            errors.confirmPassword = t("auth.passwordMismatch");
            valid = false;
        }

        setFormErrors(errors);
        return valid;
    };

    const handleResetPassword = async () => {
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
            mainText: t("auth.resetPasswordScreen.resetting"),
            subText: t("auth.pleaseWait"),
            autoClose: false,
        });

        try {
            await resetPassword({
                email,
                password,
                password_confirmation: confirmPassword,
            });

            hideNotification();

            showNotification({
                type: "success",
                mainText: t("auth.resetPasswordScreen.success"),
                subText: t("auth.resetPasswordScreen.loginNow"),
                duration: 2000,
            });

            // توجيه المستخدم إلى شاشة تسجيل الدخول
            setTimeout(() => {
                router.replace("/(auth)/login");
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
                        {t("auth.resetPasswordScreen.title")}
                    </Text>
                    <Text
                        style={[
                            styles.description,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.resetPasswordScreen.description")}
                    </Text>

                    <View style={styles.formContainer}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { textAlign: isRTL ? "right" : "left" },
                            ]}
                        >
                            {t("auth.password")}
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
                                    formErrors.password
                                        ? styles.inputError
                                        : null,
                                ]}
                                placeholder={t("auth.password")}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (formErrors.password) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            password: "",
                                        }));
                                    }
                                }}
                                secureTextEntry={hidePassword}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <View
                                style={[
                                    styles.lockIconContainer,
                                    isRTL ? { right: 15 } : { left: 15 },
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#999"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.eyeIconContainer,
                                    isRTL ? { left: 15 } : { right: 15 },
                                ]}
                                onPress={() => setHidePassword(!hidePassword)}
                            >
                                <Ionicons
                                    name={
                                        hidePassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {formErrors.password ? (
                            <Text style={styles.errorText}>
                                {formErrors.password}
                            </Text>
                        ) : null}

                        <Text
                            style={[
                                styles.fieldLabel,
                                {
                                    marginTop: 15,
                                    textAlign: isRTL ? "right" : "left",
                                },
                            ]}
                        >
                            {t("auth.confirmPassword")}
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
                                    formErrors.confirmPassword
                                        ? styles.inputError
                                        : null,
                                ]}
                                placeholder={t("auth.confirmPassword")}
                                value={confirmPassword}
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    if (formErrors.confirmPassword) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            confirmPassword: "",
                                        }));
                                    }
                                }}
                                secureTextEntry={hideConfirmPassword}
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <View
                                style={[
                                    styles.lockIconContainer,
                                    isRTL ? { right: 15 } : { left: 15 },
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#999"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.eyeIconContainer,
                                    isRTL ? { left: 15 } : { right: 15 },
                                ]}
                                onPress={() =>
                                    setHideConfirmPassword(!hideConfirmPassword)
                                }
                            >
                                <Ionicons
                                    name={
                                        hideConfirmPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                        {formErrors.confirmPassword ? (
                            <Text style={styles.errorText}>
                                {formErrors.confirmPassword}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.bottomSection}>
                        <Button
                            title={t("auth.resetPasswordScreen.submit")}
                            onPress={handleResetPassword}
                            loading={isLoading}
                            fullWidth
                            variant="primary"
                            style={styles.submitButton}
                        />
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
    lockIconContainer: {
        position: "absolute",
        height: "100%",
        justifyContent: "center",
    },
    eyeIconContainer: {
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
});
