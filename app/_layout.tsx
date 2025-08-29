import React, { useEffect, useState } from "react";
import { useColorScheme, Text, I18nManager } from "react-native";
import { ThemeProvider } from "../context/theme-provider";
import { Slot } from "expo-router";
import { useRouter, useSegments, useRootNavigation } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "../hooks/useAuth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { SplashScreenContent } from "./splash";
import { useStorageState } from "../hooks/useStorageState";
import i18n, { initializeLanguage } from "../i18n/config";
import { I18nextProvider } from "react-i18next";
import { useDarkmode } from "../hooks/useDarkmode";
import { NotificationProvider } from "../components/providers/NotificationProvider";
import { useAuthStore } from "@/store/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useAppLanguage } from "../hooks/useLanguage";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const fonts = {
    "somar-black": require("../assets/fonts/SomarRounded-Black.ttf"),
    "somar-black-italic": require("../assets/fonts/SomarRounded-BlackItalic.ttf"),
    "somar-bold": require("../assets/fonts/SomarRounded-Bold.ttf"),
    "somar-bold-italic": require("../assets/fonts/SomarRounded-BoldItalic.ttf"),
    "somar-extrabold": require("../assets/fonts/SomarRounded-ExtraBold.ttf"),
    "somar-extrabold-italic": require("../assets/fonts/SomarRounded-ExtraBoldItalic.ttf"),
    "somar-extralight": require("../assets/fonts/SomarRounded-ExtraLight.ttf"),
    "somar-extralight-italic": require("../assets/fonts/SomarRounded-ExtraLightItalic.ttf"),
    "somar-light": require("../assets/fonts/SomarRounded-Light.ttf"),
    "somar-light-italic": require("../assets/fonts/SomarRounded-LightItalic.ttf"),
    "somar-medium": require("../assets/fonts/SomarRounded-Medium.ttf"),
    "somar-medium-italic": require("../assets/fonts/SomarRounded-MediumItalic.ttf"),
    "somar-regular": require("../assets/fonts/SomarRounded-Regular.ttf"),
    "somar-regular-italic": require("../assets/fonts/SomarRounded-RegularItalic.ttf"),
    "somar-semibold": require("../assets/fonts/SomarRounded-SemiBold.ttf"),
    "somar-semibold-italic": require("../assets/fonts/SomarRounded-SemiBoldItalic.ttf"),
    "somar-thin": require("../assets/fonts/SomarRounded-Thin.ttf"),
    "somar-thin-italic": require("../assets/fonts/SomarRounded-ThinItalic.ttf"),
    "space-mono": require("../assets/fonts/SpaceMono-Regular.ttf"),
};

function InitialLayout() {
    const {
        isLoading,
        isFirstLaunch,
        isAuthenticated,
        languageSelected,
        isEmailVerified,
        introShown,
        user,
    } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const rootNavigation = useRootNavigation();
    const [initialNavigationDone, setInitialNavigationDone] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const SendEmail = async () => {
        await useAuthStore.getState().sendOtp({ email: user?.email ?? "" });
    };

    useEffect(() => {
        if (showSplash) {
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showSplash]);

    useEffect(() => {
        if (showSplash) return;
        if (!rootNavigation?.isReady || isLoading) {
            return;
        }

        const currentSegment = segments[0];

        if (!initialNavigationDone) {
            console.log("Current Navigation State:", {
                isFirstLaunch,
                introShown,
                isAuthenticated,
                isEmailVerified,
                currentSegment,
                languageSelected,
            });

            const handleNavigation = () => {
                if (!languageSelected) {
                    console.log(
                        "Language not selected, navigating to language selection"
                    );
                    router.replace("/language-selection");
                    return;
                }

                if (!introShown && !languageSelected) {
                    console.log("Intro not shown, navigating to intro");
                    router.replace("/intro");
                    return;
                }

                if (!isAuthenticated) {
                    console.log(
                        "User not authenticated, navigating to main login"
                    );
                    router.replace("/main-login");
                    return;
                }
                // الخطوة 3: التحقق من توثيق البريد
                if (isAuthenticated && !isEmailVerified) {
                    console.log(
                        "Email not verified, navigating to verification"
                    );

                    router.replace({
                        pathname: "/(auth)/otp",
                        params: {
                            email: user?.email,
                            type: "verify-email",
                        },
                    });
                    return;
                }

                if (isAuthenticated) {
                    console.log(
                        "User authenticated and verified, navigating to home"
                    );
                    router.replace("/(tabs)/home");
                    return;
                }
            };
            handleNavigation();
            setInitialNavigationDone(true);
        }
    }, [
        isAuthenticated,
        isEmailVerified,
        isLoading,
        rootNavigation?.isReady,
        introShown,
        isFirstLaunch,
        segments,
        initialNavigationDone,
        showSplash,
    ]);

    if (showSplash) {
        return <SplashScreenContent navigateAfterDelay={false} />;
    }

    return <Slot />;
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts(fonts);
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);
    const systemTheme ="light";
    const { getTheme } = useDarkmode();
    const [appReady, setAppReady] = useState(false);
    useEffect(() => {
        const enforceRTL = async () => {
            const shouldBeRTL = true;

            if (I18nManager.isRTL !== shouldBeRTL) {
                I18nManager.allowRTL(shouldBeRTL);
                I18nManager.forceRTL(shouldBeRTL);
            }
        };

        enforceRTL();
    }, []);
    // Initialize i18n
    useEffect(() => {
        const initI18n = async () => {
            await initializeLanguage();
            setIsI18nInitialized(true);
        };

        initI18n();
    }, []);

    useEffect(() => {
        const prepareApp = async () => {
            if (fontsLoaded || fontError) {
                await SplashScreen.hideAsync();
            }
        };

        prepareApp();
    }, [fontsLoaded, fontError]);

    useEffect(() => {
        if (!fontsLoaded || !isI18nInitialized) return;

        const timer = setTimeout(() => {
            setAppReady(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, [fontsLoaded, isI18nInitialized]);

    if (!appReady || !fontsLoaded) {
        return <SplashScreenContent navigateAfterDelay={false} />;
    }

    return (
        <I18nextProvider i18n={i18n}>
            <ThemeProvider
                defaultTheme="system"
                storageKey="ui-theme"
                forcedTheme={getTheme()}
            >
                <NotificationProvider>
                    <BottomSheetModalProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                            <Stack
                                screenOptions={{
                                    headerShown: false, // Hide the default header for all screens in the stack
                                }}
                            >
                                {/* <Stack.Screen name="index" /> */}
                                <Stack.Screen name="language-selection" />
                                <Stack.Screen name="intro" />
                                <Stack.Screen name="main-login" />
                                <Stack.Screen name="(auth)" />
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen name="story-viewer" /> {/* Add the new story-viewer stack */}
                            </Stack>
                        </GestureHandlerRootView>
                    </BottomSheetModalProvider>
                </NotificationProvider>
            </ThemeProvider>
        </I18nextProvider>
    );
}
