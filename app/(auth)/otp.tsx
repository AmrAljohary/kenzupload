import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    I18nManager,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuthStore } from "../../store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationStore } from "../../store/notification";

const { width, height } = Dimensions.get("window");

export default function OTPScreen() {
    const router = useRouter();
    const { email = "", type = "verify-email" } = useLocalSearchParams<{
        email: string;
        type: string;
    }>();

    const { t, isRTL } = useAppLanguage();
    const { user, updateEmailVerificationStatus } = useAuth();
    const showNotification = useNotificationStore(
        (state) => state.showNotification
    );
    const hideNotification = useNotificationStore(
        (state) => state.hideNotification
    );

    // في حالة تطبيق حقيقي، يجب إضافة وظائف للتحقق من الرمز في مخزن المصادقة
    const verifyUser = useAuthStore((state) => state.verifyUser);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);

    const [otp, setOTP] = useState(["", "", "", ""]);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(59);
    const inputRefs = React.useRef<Array<TextInput | null>>([]);

    // استخدام بريد المستخدم الحالي إذا لم يتم تمرير البريد
    const emailToUse = email || user?.email || "";

    // تنازلي للوقت
    useEffect(() => {
        const interval = setInterval(() => {
            if (seconds > 0) {
                setSeconds(seconds - 1);
            }
            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(interval);
                } else {
                    setSeconds(59);
                    setMinutes(minutes - 1);
                }
            }
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [seconds]);

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

    const handleOTPChange = (index: number, value: string) => {
        if (value.length <= 1) {
            const newOTP = [...otp];
            newOTP[index] = value;
            setOTP(newOTP);

            // التركيز على الحقل التالي إذا تم إدخال رقم
            if (value !== "" && index < otp.length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (index: number, e: any) => {
        // إذا تم الضغط على زر الحذف وكان الحقل فارغًا، انتقل للحقل السابق
        if (
            e.nativeEvent.key === "Backspace" &&
            otp[index] === "" &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const resendOTP = async () => {
        try {
            // إعادة إرسال رمز التحقق
            showNotification({
                type: "loading",
                mainText: t("common.loading"),
                subText: t("auth.pleaseWait"),
                autoClose: false,
            });

            await useAuthStore.getState().sendOtp({ email: emailToUse });
            hideNotification();

            showNotification({
                type: "success",
                mainText: t("auth.otp.codeSent"),
                subText: t("auth.otp.checkEmail"),
                duration: 3000,
            });

            // إعادة تعيين الحقول والمؤقت
            setOTP(["", "", "", ""]);
            setSeconds(59);
            setMinutes(0);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            hideNotification();

            let errorMessage = t("auth.otp.resendFailed");

            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showNotification({
                type: "error",
                mainText: t("errors.general"),
                subText: errorMessage,
                duration: 3000,
            });
        }
    };

    const verifyOTP = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 4) {
            showNotification({
                type: "error",
                mainText: t("errors.general"),
                subText: t("auth.otp.invalidLength"),
                duration: 3000,
            });
            return;
        }

        clearError();

        showNotification({
            type: "loading",
            mainText: t("common.loading"),
            subText: t("auth.pleaseWait"),
            autoClose: false,
        });

        try {
            if (type === "verify-email") {
                // تحقق من بريد المستخدم
                const result = await verifyUser({
                    code: otpString,
                    login: emailToUse,
                });

                // في حالة نجاح التحقق
                hideNotification();

                // تحديث حالة التحقق محلياً
                await updateEmailVerificationStatus(true);

                showNotification({
                    type: "success",
                    mainText: t("auth.successLogin.title"),
                    subText: t("auth.successLogin.description"),
                    duration: 2000,
                });

                // توجيه المستخدم إلى الشاشة الرئيسية بعد تأخير قصير
                setTimeout(() => {
                    router.replace("/(tabs)");
                }, 2000);
            } else if (type === "signup") {
                // في حالة التسجيل، انتقل إلى شاشة النجاح
                hideNotification();
                router.push("/(auth)/success-register");
            } else if (type === "forget") {
                try {
                    // تحقق من صحة رمز OTP
                    const result = await verifyUser({
                        code: otpString,
                        login: emailToUse,
                    });

                    // في حالة نجاح التحقق
                    hideNotification();

                    showNotification({
                        type: "success",
                        mainText: t("auth.otp.success"),
                        subText: t("auth.otp.verified"),
                        duration: 2000,
                    });

                    // توجيه المستخدم إلى شاشة إعادة تعيين كلمة المرور
                    setTimeout(() => {
                        router.push({
                            pathname: "/(auth)/reset-password",
                            params: { email: emailToUse },
                        });
                    }, 2000);
                } catch (error) {
                    throw error; // إعادة رمي الخطأ ليتم معالجته في catch الخارجي
                }
            }
        } catch (error: any) {
            hideNotification();

            // عرض رسالة الخطأ للمستخدم
            let errorMessage = t("auth.otp.invalidCode");

            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showNotification({
                type: "error",
                mainText: t("errors.general"),
                subText: errorMessage,
                duration: 3000,
            });

            // إعادة تعيين حقول الإدخال
            setOTP(["", "", "", ""]);
            inputRefs.current[0]?.focus();
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
                        backgroundColor: "#fff",
                    }}
                    showsVerticalScrollIndicator={false}
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
                        {t("auth.otp.title")}
                    </Text>
                    <Text
                        style={[
                            styles.description,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.otp.description")} {emailToUse}
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.filledInput : {},
                                ]}
                                value={digit}
                                onChangeText={(value) =>
                                    handleOTPChange(index, value)
                                }
                                onKeyPress={(e) => handleKeyPress(index, e)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                secureTextEntry={false}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <View style={styles.resendContainer}>
                        {seconds !== 0 || minutes !== 0 ? (
                            <Text style={styles.timerText}>
                                ({minutes}:
                                {seconds < 10 ? `0${seconds}` : seconds})
                            </Text>
                        ) : (
                            <TouchableOpacity
                                onPress={resendOTP}
                                disabled={isLoading}
                            >
                                <Text style={styles.resendActionText}>
                                    {t("auth.otp.resend")}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title={t("auth.otp.verify")}
                            onPress={verifyOTP}
                            loading={isLoading}
                            fullWidth
                            variant="primary"
                            style={styles.verifyButton}
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
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    otpInput: {
        width: 60,
        height: 55,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        fontSize: 18,
        backgroundColor: "#F9F9F9",
        fontFamily: "somar-bold",
    },
    filledInput: {
        borderColor: "#000",
        backgroundColor: "#f0f7ff",
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
    },
    timerText: {
        fontSize: 14,
        color: "#777",
        fontFamily: "somar-regular",
    },
    resendText: {
        fontSize: 14,
        color: "#777",
        fontFamily: "somar-regular",
    },
    resendActionText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-bold",
        textDecorationLine: "underline",
    },
    buttonContainer: {
        marginTop: "auto",
        marginBottom: 30,
    },
    verifyButton: {
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 14,
        height: 55,
    },
});
