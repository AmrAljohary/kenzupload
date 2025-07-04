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
    I18nManager,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuthStore } from "../../store/auth";
import { useAuth } from "../../hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import {
    useNotificationStore,
    NotificationState,
} from "../../store/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height, width } = Dimensions.get("window");

export default function LoginScreen() {
    const router = useRouter();
    const { t, isRTL } = useAppLanguage();
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const { login: storeUserData, isEmailVerified } = useAuth();
    const showNotification = useNotificationStore(
        (state) => state.showNotification
    );
    const hideNotification = useNotificationStore(
        (state) => state.hideNotification
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hidePassword, setHidePassword] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [extraPadding, setExtraPadding] = useState(false);
    const [formErrors, setFormErrors] = useState({
        email: "",
        password: "",
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
                // Reset padding with a slight delay to prevent flicker
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

    // عرض رسالة الخطأ من المخزن
    useEffect(() => {
        if (error) {
            showNotification({
                type: "error",
                mainText: t("auth.loginFailed"),
                subText: error,
                duration: 5000,
            });
        }
    }, [error, t, showNotification]);

    const validateForm = () => {
        let valid = true;
        const errors = {
            email: "",
            password: "",
        };

        if (!email.trim()) {
            errors.email = t("auth.emailRequired");
            valid = false;
        }

        if (!password) {
            errors.password = t("auth.passwordRequired");
            valid = false;
        }

        setFormErrors(errors);
        return valid;
    };

    const handleLogin = async () => {
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

        // عرض إشعار التحميل
        showNotification({
            type: "loading",
            mainText: t("auth.loggingIn"),
            subText: t("auth.pleaseWait"),
            autoClose: false,
        });

        try {
            // استدعاء وظيفة تسجيل الدخول من المخزن
            const result = await login({
                login: email,
                password,
            });

            // إخفاء إشعار التحميل
            hideNotification();

            if (result) {
                console.log("Login successful:", result);
                await AsyncStorage.setItem("USER_TOKEN", result.data.token);
                // حفظ بيانات المستخدم باستخدام الهوك المحسن
                await storeUserData({
                    id: result.data.id,
                    name: result.data.name,
                    email: result.data.email,
                    country_code: result.data.country_code,
                    phone_number: result.data.phone_number,
                    is_email_verified: result.data.is_email_verified || false,
                    profile_image: result.data.profile_image,
                    username: result.data.username,
                    token: result.data.token,
                });

                // التوجيه إلى الشاشة المناسبة (التحقق من البريد أو الرئيسية)
                if (result.data.is_email_verified) {
                    // إظهار إشعار الترحيب
                    showNotification({
                        type: "success",
                        mainText: t("auth.loginSuccessful"),
                        subText: t("auth.welcomeBack"),
                        duration: 2000,
                    });

                    router.replace("/(tabs)");
                } else {
                    // إذا لم يتم التحقق من البريد

                    // إظهار إشعار طلب التحقق
                    showNotification({
                        type: "info",
                        mainText: t("auth.verificationNeeded"),
                        subText: t("auth.pleaseVerifyEmail"),
                        duration: 3000,
                    });

                    // إرسال رمز التحقق تلقائياً
                    await useAuthStore
                        .getState()
                        .sendOtp({ email: result.data.email });

                    // انتقل إلى شاشة التحقق مع إرسال البريد الإلكتروني كمعلمة
                    router.replace({
                        pathname: "/(auth)/otp",
                        params: {
                            email: result.data.email,
                            type: "verify-email",
                        },
                    });
                }
            }
        } catch (err) {
            // إخفاء إشعار التحميل في حالة حدوث خطأ
            // سيتم عرض الخطأ تلقائيًا من خلال useEffect السابق
        }
    };

    const togglePasswordVisibility = () => {
        setHidePassword(!hidePassword);
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
                        paddingBottom: extraPadding ? 240 : 0,
                        backgroundColor: "#fff",
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity
                        onPress={() => router.navigate("/main-login")}
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
                            styles.welcomeText,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.welcome2")}
                    </Text>
                    <Text
                        style={[
                            styles.descriptionText,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.welcomeDescription2")}
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

                        <Text
                            style={[
                                styles.fieldLabel,
                                {
                                    marginTop: 15,
                                    textAlign: isRTL ? "right" : "left",
                                },
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
                                onPress={togglePasswordVisibility}
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

                        <View
                            style={[
                                styles.rememberForgotContainer,
                                {
                                    flexDirection: isRTL
                                        ? "row-reverse"
                                        : "row",
                                },
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setRememberMe(!rememberMe)}
                                style={[
                                    styles.rememberContainer,
                                    {
                                        flexDirection: isRTL
                                            ? "row-reverse"
                                            : "row",
                                    },
                                ]}
                            >
                                <View style={styles.checkbox}>
                                    {rememberMe && (
                                        <View style={styles.checkedBox} />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.rememberText,
                                        {
                                            marginLeft: isRTL ? 0 : 8,
                                            marginRight: isRTL ? 8 : 0,
                                        },
                                    ]}
                                >
                                    {t("auth.rememberMe")}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() =>
                                    router.push("/(auth)/forgot-password")
                                }
                            >
                                <Text style={styles.forgotPassword}>
                                    {t("auth.forgotPasswordScreen.title")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.bottomSection,
                            keyboardVisible && styles.bottomSectionKeyboardOpen,
                            { top: keyboardVisible ? 100 : 0 },
                        ]}
                    >
                        <Button
                            title={t("auth.login")}
                            onPress={handleLogin}
                            loading={isLoading}
                            fullWidth
                            variant="primary"
                            style={styles.loginButton}
                        />

                        <View
                            style={[
                                styles.registerContainer,
                                {
                                    flexDirection: isRTL
                                        ? "row-reverse"
                                        : "row",
                                },
                            ]}
                        >
                            <Text style={styles.noAccountText}>
                                {t("auth.dontHaveAccount")}{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/register")}
                            >
                                <Text style={styles.registerText}>
                                    {t("auth.register")}
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
    welcomeText: {
        fontSize: 20,
        fontFamily: "somar-bold",
        marginTop: 20,
    },
    descriptionText: {
        fontSize: 14,
        color: "#777",
        fontFamily: "somar-light",
        marginTop: 8,
        marginBottom: 30,
    },
    formContainer: {
        marginTop: 10,
        backgroundColor: "#fff",
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
    eyeIconContainer: {
        position: "absolute",
        height: "100%",
        justifyContent: "center",
    },
    lockIconContainer: {
        position: "absolute",
        height: "100%",
        justifyContent: "center",
    },
    errorContainer: {
        backgroundColor: "#ffeeee",
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
    rememberForgotContainer: {
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 15,
    },
    rememberContainer: {
        alignItems: "center",
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#777",
        justifyContent: "center",
        alignItems: "center",
    },
    checkedBox: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: "#000",
    },
    rememberText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-regular",
    },
    forgotPassword: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-medium",
    },
    bottomSection: {
        position: "relative",
        marginTop: "auto",
        marginBottom: 30,
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        zIndex: 1000,
    },
    bottomSectionKeyboardOpen: {
        position: "relative",
        marginTop: 40,
        backgroundColor: "#fff",
    },
    loginButton: {
        marginTop: 10,
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 14,
        height: 55,
    },
    registerContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    noAccountText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-regular",
    },
    registerText: {
        fontSize: 14,
        color: "#000",
        textDecorationLine: "underline",
        fontFamily: "somar-bold",
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
        textAlign: I18nManager.isRTL ? "right" : "left",
    },
});
