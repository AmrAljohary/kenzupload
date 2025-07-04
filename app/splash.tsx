import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../components/ui/Text";
import { useAuth } from "../hooks/useAuth";

// استخدام الشعار الفعلي
const LOGO_IMAGE = require("../assets/images/SplashLogin.png");

export function SplashScreenContent({ navigateAfterDelay = true }) {
    const router = useRouter();
    const { isFirstLaunch, isAuthenticated, isEmailVerified, introShown } =
        useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // تحريك الشعار (ظهور تدريجي + تكبير)
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // الانتقال بعد التأخير إلى الشاشة المناسبة
        if (navigateAfterDelay) {
            const timer = setTimeout(() => {
                if (isFirstLaunch) {
                    // إذا كان أول تشغيل، انتقل إلى شاشة اختيار اللغة
                    router.replace("/language-selection");
                } else if (!introShown) {
                    // إذا لم يتم عرض المقدمة، انتقل إلى شاشة المقدمة
                    router.replace("/intro");
                } else if (isAuthenticated) {
                    // إذا كان المستخدم مصادقاً
                    if (isEmailVerified) {
                        // إذا كان البريد موثقاً، انتقل إلى الشاشة الرئيسية
                        router.replace("/(tabs)");
                    } else {
                        // إذا لم يكن البريد موثقاً، انتقل إلى شاشة التحقق
                        router.replace("/(auth)/otp");
                    }
                } else {
                    // إذا لم يكن مصادقاً، انتقل إلى شاشة تسجيل الدخول
                    router.replace("/main-login");
                }
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [
        navigateAfterDelay,
        router,
        fadeAnim,
        scaleAnim,
        isFirstLaunch,
        isAuthenticated,
        isEmailVerified,
        introShown,
    ]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={LOGO_IMAGE}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

export default function SplashScreen() {
    return <SplashScreenContent />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000",
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 150,
        height: 150,
    },
    appName: {
        fontSize: 48,
        marginTop: 20,
        letterSpacing: 2,
    },
});
