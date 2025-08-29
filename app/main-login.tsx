import React, {
    useState,
    useRef,
    useCallback,
    useMemo,
    useEffect,
} from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    Dimensions,
    Platform,
    ScrollView,
    Animated,
    I18nManager,
    BackHandler,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../components/ui/Text";
import { Button } from "../components/ui/Button";
import { useAppLanguage } from "../hooks/useLanguage";
import {
    AntDesign,
    Entypo,
    FontAwesome,
    FontAwesome6,
} from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { INTRO_COMPLETED_KEY } from "./intro"; // استيراد المفتاح من ملف intro.tsx
import { getBottomSpace } from "react-native-iphone-x-helper";
import { LANGUAGE_SELECTED_KEY } from "./language-selection";

// الصور
const BACKGROUND_IMAGE = require("../assets/images/MainLoginBackground.png");
const LOGO_IMAGE = require("../assets/images/kenzWord.png");

const { width, height } = Dimensions.get("window");

export default function MainLoginScreen() {
    const router = useRouter();
    const { t, isRTL, currentLanguage } = useAppLanguage();
    const { login } = useAuth();

    // مرجع للشريحة السفلية
    const bottomSheetRef = useRef<BottomSheet>(null);

    // نقاط مثبتة للشريحة السفلية
    const snapPoints = useMemo(() => ["50%", "70%"], []);

    // التأكد من تحديث الواجهة عند تغيير اللغة
    useEffect(() => {
        // حل مشكلة RTL من خلال استخدام isRTL بشكل صحيح
        console.log("Language updated:", currentLanguage, "RTL is:", isRTL);

        // إذا كان هناك تناقض بين اللغة وحالة RTL، نقوم بتطبيق RTL بناءً على اللغة
        if (
            (currentLanguage === "ar" && !isRTL) ||
            (currentLanguage === "en" && isRTL)
        ) {
            console.warn(
                "RTL state doesn't match language. This should be fixed by useAppLanguage hook."
            );
        }
    }, [isRTL, currentLanguage]);

    // التحقق من إكمال المقدمة عند تحميل الشاشة
    useEffect(() => {
        const checkIntroStatus = async () => {
            try {
                const introCompleted = await AsyncStorage.getItem(
                    INTRO_COMPLETED_KEY
                );

                //check if the language is selected
                const languageSelected = await AsyncStorage.getItem(
                    LANGUAGE_SELECTED_KEY
                );

                if (languageSelected !== "true") {
                    console.log(
                        "Language not selected, redirecting to language selection screen"
                    );
                    router.replace("/language-selection");
                    return;
                }

                // إذا لم يكن المستخدم قد أكمل المقدمة، نعيده إلى شاشة المقدمة
                if (introCompleted !== "true") {
                    console.log(
                        "Intro not completed, redirecting to intro screen"
                    );
                    router.replace("/intro");
                }
            } catch (error) {
                console.error("Error checking intro completion:", error);
            }
        };

        checkIntroStatus();
    }, [router]);

    // التحقق من إكمال المقدمة ومعالجة زر العودة
    useEffect(() => {
        // معالجة زر العودة للخروج من التطبيق إذا تم إكمال المقدمة
        const handleBackPress = () => {
            // استخدام وعود بدلاً من async/await
            AsyncStorage.getItem(INTRO_COMPLETED_KEY)
                .then((introCompleted) => {
                    if (introCompleted === "true") {
                        BackHandler.exitApp();
                    }
                })
                .catch((error) => {
                    console.error("Error checking intro state:", error);
                });

            // دائمًا نمنع العودة ونتعامل مع منطق الخروج في التنبيه
            return true;
        };

        // إضافة مستمع لحدث زر العودة
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            handleBackPress
        );

        // تنظيف المستمع عند إلغاء تحميل المكون
        return () => backHandler.remove();
    }, [t]);

    // فتح الشريحة السفلية
    const handleOpenTermsSheet = useCallback(() => {
        // بدء من المستوى الأول ثم التحرك للمستوى الثاني تدريجيًا
        bottomSheetRef.current?.snapToIndex(0);
    }, []);

    // إغلاق الشريحة السفلية
    const handleCloseTermsSheet = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    // تخصيص الخلفية
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.7}
            />
        ),
        []
    );

    const handleLoginPress = () => {
        router.push("/(auth)/login");
    };

    const handleRegisterPress = () => {
        router.push("/(auth)/register");
    };

    const handleFacebookLogin = () => {
        // تنفيذ تسجيل الدخول بواسطة Facebook
        console.log("تسجيل الدخول بواسطة Facebook");
    };

    const handleTwitterLogin = () => {
        // تنفيذ تسجيل الدخول بواسطة Twitter
        console.log("تسجيل الدخول بواسطة Twitter");
    };

    const handleGuestLogin = async () => {
        // تسجيل الدخول كضيف مع بيانات فارغة
        const guestToken = "guest_token";
        const guestData = {
            id: 0, // Changed id to number
            name: "Guest User",
            email: "guest@example.com",
            country_code: "",
            phone_number: "",
            is_email_verified: false,
            profile_image: "",
            username: "guest_user",
            token: guestToken,
            // أضف أي حقول أخرى مطلوبة في UserData مع قيم افتراضية
        };

        await login(guestData); // تم تعديل هذا السطر
        router.replace("/(tabs)");
    };

    // مكون الشبكة الاجتماعية مع دعم RTL
    const renderSocialButton = (
        icon: JSX.Element,
        text: string,
        onPress: () => void,
        style: any
    ) => {
        // استخدام أسلوب واضح للتعامل مع RTL
        return (
            <TouchableOpacity style={style} onPress={onPress}>
                <View
                    style={[
                        styles.socialButtonContent,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                >
                    {icon}
                    <Text
                        variant="body"
                        color="#FFFFFF"
                        style={[
                            styles.socialButtonText,
                            {
                                textAlign: isRTL ? "right" : "left",
                                marginRight: isRTL ? 0 : 15,
                                marginLeft: isRTL ? 15 : 0,
                            },
                        ]}
                    >
                        {text}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent={true} backgroundColor="transparent" />
            <ImageBackground
                source={BACKGROUND_IMAGE}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.overlay} />
                <View style={styles.contentWrapper}>
                    {/* الشعار والترحيب */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={LOGO_IMAGE}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        <Text
                            variant="h2"
                            color="#FFFFFF"
                            style={styles.welcomeText}
                            align="center"
                        >
                            {t("auth.welcome")}
                        </Text>
                        <Text
                            variant="body"
                            color="#FFFFFF"
                            style={styles.tagline}
                            align="center"
                        >
                            {t("auth.welcomeDescription")}
                        </Text>
                    </View>

                    {/* محتوى الأزرار */}
                    <View style={styles.contentContainer}>
                        {/* زر تسجيل الدخول */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLoginPress}
                        >
                            <Text
                                variant="h3"
                                color="#000"
                                style={styles.loginButtonText}
                                align="center"
                            >
                                {t("auth.login")}
                            </Text>
                        </TouchableOpacity>

                        {/* زر فيسبوك */}
                        {/* {renderSocialButton(
                            <Entypo
                                name="facebook"
                                size={20}
                                color="#FFFFFF"
                            />,
                            t("auth.continueWithFacebook"),
                            handleFacebookLogin,
                            styles.facebookButton
                        )} */}

                        {/* زر تويتر/إكس */}
                        {/* {renderSocialButton(
                            <FontAwesome6
                                name="x-twitter"
                                size={20}
                                color="#FFFFFF"
                            />,
                            t("auth.continueWithTwitter"),
                            handleTwitterLogin,
                            styles.twitterButton
                        )} */}

                        {/* نص الشروط والأحكام مع خط تحته وإمكانية الضغط عليه */}
                        <TouchableOpacity onPress={handleOpenTermsSheet}>
                            <Text
                                variant="caption"
                                color="#E5E7EB"
                                style={[
                                    styles.termsText,
                                    {
                                        textAlign: "center",
                                        writingDirection: isRTL ? "rtl" : "ltr",
                                    },
                                ]}
                            >
                                {isRTL
                                    ? t("auth.termsInfoPrefix")
                                    : "By continuing, I have read and agree to the"}{" "}
                                <Text
                                    variant="caption"
                                    color="#FFFFFF"
                                    style={styles.termsLink}
                                >
                                    {isRTL
                                        ? t("auth.termsAndConditions")
                                        : "Terms & Conditions"}
                                </Text>{" "}
                                {isRTL ? t("auth.termsInfoSuffix") : ""}
                            </Text>
                        </TouchableOpacity>

                        {/* رابط إنشاء حساب جديد */}
                        <TouchableOpacity
                            style={styles.registerLinkContainer}
                            onPress={handleRegisterPress}
                        >
                            <View
                                style={{
                                    flexDirection: isRTL ? "row-reverse" : "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 3,
                                }}
                            >
                                <Text
                                    variant="body"
                                    color="#FFFFFF"
                                    style={[
                                        styles.registerLinkText,
                                        {
                                            textAlign: "center",
                                            writingDirection: isRTL
                                                ? "rtl"
                                                : "ltr",
                                        },
                                    ]}
                                >
                                    {t("auth.newHerePart1")}
                                </Text>
                                <Text
                                    variant="body"
                                    color="#FFFFFF"
                                    style={[
                                        styles.registerLinkTextBold,
                                        {
                                            textAlign: "center",
                                            writingDirection: isRTL
                                                ? "rtl"
                                                : "ltr",
                                            marginRight: isRTL ? 5 : 0,
                                            marginLeft: isRTL ? 0 : 5,
                                        },
                                    ]}
                                >
                                    {t("auth.newHerePart2")}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* مؤشر الشريط السفلي */}
                        <View style={styles.indicator} />
                    </View>
                </View>
            </ImageBackground>

            {/* الشريحة السفلية للشروط والأحكام */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={styles.bottomSheetIndicator}
                backgroundStyle={styles.bottomSheetBackground}
                animateOnMount={false}
            >
                <BottomSheetScrollView style={styles.bottomSheetContent}>
                    <View
                        style={[
                            styles.bottomSheetHeader,
                            { flexDirection: isRTL ? "row-reverse" : "row" },
                        ]}
                    >
                        <Text
                            variant="h3"
                            color="#000"
                            style={[
                                styles.bottomSheetTitle,
                                { textAlign: isRTL ? "right" : "left" },
                            ]}
                        >
                            {isRTL
                                ? t("auth.termsAndConditions")
                                : "Terms & Conditions"}
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.closeButton,
                                isRTL ? { right: 0 } : { left: 0 },
                            ]}
                            onPress={handleCloseTermsSheet}
                        >
                            <FontAwesome name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomSheetDivider} />

                    <Text
                        variant="body"
                        color="#000"
                        style={[
                            styles.termsContent,
                            {
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {isRTL
                            ? t("auth.termsContent")
                            : "Welcome to Kenz, the poetry and literature platform in the Arab world.\n\nBy using the application, you agree to the following terms and conditions:\n\n1. Terms of Use\nThe application allows you to create a personal account and share literary and poetic content with other users. All posts must be owned by you or you have the right to publish them.\n\n2. Content\nIt is prohibited to share any content that violates laws and customs or infringes on the intellectual property rights of others. The application reserves the right to remove any violating content without prior notice.\n\n3. Privacy\nWe respect your privacy and are committed to protecting your personal data in accordance with the privacy policy available in the application.\n\n4. Accounts\nYou are responsible for maintaining the confidentiality of your account information and password.\n\n5. Modifications\nWe reserve the right to modify these terms and conditions at any time. You will be notified of any material changes through the application.\n\nThank you for joining the Kenz community!"}
                    </Text>

                    <Button
                        title={isRTL ? t("common.close") : "Close"}
                        variant="primary"
                        style={[
                            styles.termsCloseButton,
                            { alignSelf: "center" },
                        ]}
                        onPress={handleCloseTermsSheet}
                    />
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    backgroundImage: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(1, 22, 34, 0.65)",
        opacity: 0.3,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: "space-between",
        paddingTop: Platform.OS === "ios" ? 60 : 30, // Adjusted for status bar
        marginTop: height * 0.20,
    },
    logoContainer: {
        alignItems: "center",
        marginTop: height * 0.12,
        paddingHorizontal: 20,
    },
    logo: {
        width: width * 0.5,
        height: width * 0.4,
    },
    welcomeText: {
        fontSize: 28,
        marginTop: 30,
        fontFamily: "somar-bold",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        paddingHorizontal: 20,
    },
    tagline: {
        fontSize: 16,
        marginTop: 10,
        fontFamily: "somar-regular",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 2,
        paddingHorizontal: 30,
    },
    contentContainer: {
        paddingHorizontal: 24,
        marginBottom: Platform.OS === "ios" ? getBottomSpace() + 20 : 25, // Adjusted for bottom space
        width: "100%",
    },
    loginButton: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        fontFamily: "somar-bold",
        fontSize: 18,
    },
    facebookButton: {
        backgroundColor: "#1877F2",
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    twitterButton: {
        backgroundColor: "#000000",
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    socialButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 15,
        width: "100%",
        paddingHorizontal: 15,
    },
    socialButtonText: {
        fontFamily: "somar-medium",
        fontSize: 16,
    },
    termsText: {
        marginTop: 15,
        lineHeight: 20,
        fontFamily: "somar-regular",
        fontSize: 12,
        opacity: 0.9,
        paddingHorizontal: 20,
    },
    termsLink: {
        textDecorationLine: "underline",
        fontFamily: "somar-medium",
        fontSize: 12,
    },
    registerLinkContainer: {
        marginTop: 10,
        paddingVertical: 8,
    },
    registerLinkText: {
        fontFamily: "somar-medium",
        fontSize: 16,
        marginTop: 5,
    },
    registerLinkTextBold: {
        fontFamily: "somar-bold",
        fontSize: 16,
        marginTop: 5,
        textDecorationLine: "underline",
    },
    indicator: {
        height: 4,
        width: 60,
        backgroundColor: "#FFFFFF",
        alignSelf: "center",
        borderRadius: 2,
        marginTop: 20,
        opacity: 0.5,
    },
    // أنماط الشريحة السفلية
    bottomSheetBackground: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    bottomSheetIndicator: {
        backgroundColor: "#9CA3AF",
        width: 40,
        height: 5,
    },
    bottomSheetContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bottomSheetHeader: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginBottom: 10,
        width: "100%",
        paddingVertical: 5,
    },
    bottomSheetTitle: {
        fontFamily: "somar-bold",
        fontSize: 20,
    },
    closeButton: {
        position: "absolute",
        top: 0,
        padding: 5,
        zIndex: 10,
    },
    bottomSheetDivider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginBottom: 15,
        width: "100%",
    },
    termsScrollView: {
        flex: 1,
        width: "100%",
    },
    termsContent: {
        fontFamily: "somar-regular",
        fontSize: 14,
        lineHeight: 22,
        paddingBottom: 20,
        paddingHorizontal: 10,
        width: "100%",
    },
    termsCloseButton: {
        marginTop: 15,
        marginBottom: 40,
        backgroundColor: "#000",
        borderRadius: 8,
        width: "80%",
    },
});
