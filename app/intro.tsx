import React, { useEffect, useRef, useState } from "react";
import {
    View,
    ScrollView,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Platform,
    I18nManager,
    NativeScrollEvent,
    NativeSyntheticEvent,
    BackHandler,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../components/ui/Text";
import { Button } from "../components/ui/Button";
import { useAppLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// مفتاح لتخزين حالة الانتهاء من المقدمة
const INTRO_COMPLETED_KEY = "intro_completed";

// صور لشاشات التعريف - استخدام الصور المحلية
const INTRO_IMAGES = [
    require("../assets/images/Slider1.png"),
    require("../assets/images/Slider2.png"),
    require("../assets/images/Slider3.png"),
];

export default function IntroScreen() {
    const router = useRouter();
    const { t, isRTL, currentLanguage } = useAppLanguage();
    const { setIntroComplete } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // بيانات الشرائح التعريفية - تستخدم ترجمات بدلاً من النصوص الثابتة
    const slideData = [
        {
            title: t("intro.slide1.title"),
            description: t("intro.slide1.description"),
        },
        {
            title: t("intro.slide2.title"),
            description: t("intro.slide2.description"),
        },
        {
            title: t("intro.slide3.title"),
            description: t("intro.slide3.description"),
        },
    ];

    useEffect(() => {
        // إعادة ضبط الشريحة الأولى عند تغيير اللغة أو أول تحميل
        setCurrentIndex(0);
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        }, 10); // تأخير بسيط لضمان عمل scrollTo بعد إعادة التهيئة
    }, [currentLanguage]);

    // معالجة زر العودة للخروج من التطبيق
    useEffect(() => {
        const handleBackPress = () => {
            // عرض تنبيه للخروج من التطبيق
            Alert.alert(
                t("common.appName"),
                t("common.exitAppConfirmation") ||
                    "هل ترغب بالخروج من التطبيق؟",
                [
                    {
                        text: t("common.cancel"),
                        style: "cancel",
                    },
                    {
                        text: t("common.yes"),
                        onPress: () => BackHandler.exitApp(),
                    },
                ],
                { cancelable: true }
            );

            // منع السلوك الافتراضي للعودة
            return true;
        };

        // إضافة مستمع لزر العودة
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            handleBackPress
        );

        // تنظيف المستمع عند إزالة المكون
        return () => backHandler.remove();
    }, [t]);

    // تحديث currentIndex فقط عند التفاعل الحقيقي مع المستخدم
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const slideIndex = Math.round(offsetX / width);
        if (
            slideIndex !== currentIndex &&
            slideIndex >= 0 &&
            slideIndex < slideData.length
        ) {
            setCurrentIndex(slideIndex);
        }
    };

    // تخزين حالة الانتهاء من المقدمة
    const markIntroAsCompleted = async () => {
        try {
            await AsyncStorage.setItem(INTRO_COMPLETED_KEY, "true");
            console.log("Intro marked as completed");
        } catch (error) {
            console.error("Error saving intro state:", error);
        }
    };

    // الانتقال للشريحة التالية يدويًا فقط
    const scrollToNext = async () => {
        if (currentIndex < slideData.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            scrollViewRef.current?.scrollTo({
                x: width * nextIndex,
                animated: true,
            });
        } else {
            await markIntroAsCompleted();
            router.push("/main-login");
        }
    };

    // تخطي المقدمة يدوي فقط
    const skipToLogin = async () => {
        await markIntroAsCompleted();
        router.push("/main-login");
    };

    // إنشاء مصفوفة من أزرار التنقل للشرائح
    const renderPagination = () => {
        const dots = [];
        for (let i = 0; i < 3; i++) {
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.paginationDot,
                        currentIndex === i
                            ? styles.activeDot
                            : styles.inactiveDot,
                        // إضافة تأثير التحويل
                        {
                            transform: [
                                { scale: currentIndex === i ? 1 : 0.8 },
                            ],
                        },
                    ]}
                />
            );
        }
        return dots;
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* زر تخطي - يظهر فقط إذا لم نكن في الشريحة الأخيرة */}
            {currentIndex !== 2 && (
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={skipToLogin}
                >
                    <Text variant="body" color="#000" style={styles.skipText}>
                        {t("intro.skip")}
                    </Text>
                </TouchableOpacity>
            )}

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                onMomentumScrollEnd={handleScroll}
            >
                {isRTL
                    ? [...slideData].reverse().map((slide, index) => (
                          <View key={index} style={styles.slide}>
                              <Image
                                  source={
                                      INTRO_IMAGES[isRTL ? 2 - index : index]
                                  }
                                  style={styles.image}
                                  resizeMode="contain"
                              />
                              <View style={styles.textContainer}>
                                  <Text
                                      variant="h2"
                                      style={styles.title}
                                      align="center"
                                      color="#000"
                                  >
                                      {slide.title}
                                  </Text>
                                  <Text
                                      variant="body"
                                      style={styles.description}
                                      align="center"
                                      color="#666"
                                  >
                                      {slide.description}
                                  </Text>
                              </View>
                          </View>
                      ))
                    : slideData.map((slide, index) => (
                          <View key={index} style={styles.slide}>
                              <Image
                                  source={INTRO_IMAGES[index]}
                                  style={styles.image}
                                  resizeMode="contain"
                              />
                              <View style={styles.textContainer}>
                                  <Text
                                      variant="h2"
                                      style={styles.title}
                                      align="center"
                                      color="#000"
                                  >
                                      {slide.title}
                                  </Text>
                                  <Text
                                      variant="body"
                                      style={styles.description}
                                      align="center"
                                      color="#666"
                                  >
                                      {slide.description}
                                  </Text>
                              </View>
                          </View>
                      ))}
            </ScrollView>

            <View style={styles.buttonContainer}>
                <View style={styles.pagination}>{renderPagination()}</View>
                <Button
                    title={
                        currentIndex === 2 ? t("intro.start") : t("intro.next")
                    }
                    variant="primary"
                    fullWidth
                    style={styles.button}
                    onPress={scrollToNext}
                />
            </View>
        </SafeAreaView>
    );
}

// تصدير المفتاح لاستخدامه في الشاشات الأخرى
export { INTRO_COMPLETED_KEY };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    scrollView: {
        flex: 1,
        width: width,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    slide: {
        width,
        height: height * 0.75,
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    image: {
        width,
        height: height * 0.62,
    },
    textContainer: {
        width: "100%",
        backgroundColor: "#FFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingHorizontal: 30,
        paddingBottom: 20,
    },
    title: {
        fontSize: 23,
        fontFamily: "somar-bold",
        marginBottom: 16,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        fontFamily: "somar-regular",
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 15,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: "#000",
        width: 20,
    },
    inactiveDot: {
        backgroundColor: "#D1D5DB",
    },
    buttonContainer: {
        width: "100%",
        position: "absolute",
        bottom: Platform.OS === "ios" ? 50 : 20,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    button: {
        marginBottom: 10,
        backgroundColor: "#000",
        borderRadius: 8,
        paddingVertical: 16,
    },
    indicatorContainer: {
        alignItems: "center",
        marginTop: 5,
    },
    indicator: {
        width: 60,
        height: 4,
        backgroundColor: "#D1D5DB",
        borderRadius: 2,
    },
    skipButton: {
        position: "absolute",
        top: Platform.OS === "ios" ? 50 : 30,
        right: 20,
        zIndex: 100,
        padding: 10,
    },
    skipText: {
        fontFamily: "somar-medium",
        fontSize: 16,
        color: "#000",
    },
});
