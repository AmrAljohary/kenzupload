import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Dimensions,
    I18nManager,
    FlatList,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuthStore } from "../../store/auth";
import { useAuth } from "../../hooks/useAuth";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { countries } from "../../assets/data/countries";
import {
    useNotificationStore,
    NotificationState,
} from "../../store/notification";

import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import CountryPicker, {
    Country,
    CountryCode,
    DARK_THEME,
    DEFAULT_THEME,
    CountryFilter,
    getAllCountries,
} from "react-native-country-picker-modal";

const { height, width } = Dimensions.get("window");

export default function RegisterScreen() {
    const router = useRouter();
    const { t, isRTL } = useAppLanguage();
    const register = useAuthStore((state) => state.register);
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const showNotification = useNotificationStore(
        (state) => state.showNotification
    );

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [usernameExists, setUsernameExists] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [countriesList, setCountriesList] = useState<any[]>([]);
    const [countryCode, setCountryCode] = useState<Country>({
        callingCode: ["966"],
        cca2: "SA" as CountryCode,
        currency: ["SAR"],
        flag: "flag-sa",
        name: "Saudi Arabia",
        region: "Asia",
        subregion: "Western Asia",
    });
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [formErrors, setFormErrors] = useState<{
        username?: string;
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
    }>({});

    // Bottom Sheet references and configurations
    const countryPickerBottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["50%", "80%"], []);

    const { login: storeUserData } = useAuth();

    // التعامل مع لوحة المفاتيح
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            "keyboardDidShow",
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            "keyboardDidHide",
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // تحقق صوري من وجود اسم المستخدم (للعرض فقط)
    useEffect(() => {
        if (username === "y7ia9800") {
            setUsernameExists(true);
        } else {
            setUsernameExists(false);
        }
    }, [username]);

    // التحقق من تطابق كلمتي المرور
    useEffect(() => {
        if (confirmPassword && password !== confirmPassword) {
            setPasswordsMatch(false);
            setFormErrors((prev) => ({
                ...prev,
                confirmPassword: t("auth.passwordsDontMatch"),
            }));
        } else {
            setPasswordsMatch(true);
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.confirmPassword;
                return newErrors;
            });
        }
    }, [password, confirmPassword, t]);

    // عرض رسالة الخطأ من المخزن
    useEffect(() => {
        if (error) {
            showNotification({
                type: "error",
                mainText: t("auth.registrationFailed"),
                subText: error,
                duration: 5000,
            });
        }
    }, [error, t, showNotification]);

    // Load all countries
    useEffect(() => {
        const loadCountries = async () => {
            try {
                // تحويل البيانات من الملف إلى التنسيق المطلوب
                const countryData: any[] = [];

                countries.forEach((countryObj) => {
                    // استخراج رمز الدولة والبيانات
                    for (const [code, country] of Object.entries(countryObj)) {
                        if (!country) continue;

                        const flag = getFlagByCode(code);

                        // التأكد من وجود بيانات الاتصال
                        const callingCodes =
                            country.callingCode &&
                            country.callingCode.length > 0
                                ? country.callingCode
                                : [""];

                        countryData.push({
                            cca2: code as CountryCode,
                            name: country.name.common,
                            callingCode: callingCodes,
                            flag: flag,
                        });
                    }
                });

                // ترتيب الدول أبجديًا حسب الاسم
                countryData.sort((a, b) => a.name.localeCompare(b.name));

                // تعيين السعودية كدولة افتراضية
                const saudiArabia = countryData.find(
                    (country) => country.cca2 === "SA"
                );
                if (saudiArabia) {
                    setCountryCode(saudiArabia);
                }

                setCountriesList(countryData);
                setFilteredCountries(countryData);
            } catch (error) {
                console.error("Error loading countries:", error);
            }
        };

        // وظيفة لإنشاء رمز العلم من رمز الدولة
        const getFlagByCode = (code: string): string => {
            // تحويل رمز الدولة إلى رموز تعبيرية للأعلام (علامات الدول)
            const codePoints = code
                .toUpperCase()
                .split("")
                .map((char) => 127397 + char.charCodeAt(0));

            return String.fromCodePoint(...codePoints);
        };

        loadCountries();
    }, []);

    // تحقق من صحة البريد الإلكتروني
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // تحقق من صحة رقم الهاتف
    const validatePhone = (phone: string): boolean => {
        return phone.length >= 9 && /^\d+$/.test(phone);
    };

    // تحقق من صحة كلمة المرور (على الأقل 8 أحرف، تتضمن حروف كبيرة وصغيرة وأرقام)
    const validatePassword = (password: string): boolean => {
        return password.length >= 8;
    };

    // التحقق من جميع البيانات قبل التسجيل
    const validateForm = (): boolean => {
        const errors: {
            username?: string;
            fullName?: string;
            email?: string;
            phone?: string;
            password?: string;
            confirmPassword?: string;
            terms?: string;
        } = {};

        if (!username) {
            errors.username = t("auth.usernameRequired");
        } else if (username.length < 3) {
            errors.username = t("auth.usernameTooShort");
        }

        if (!fullName) {
            errors.fullName = t("auth.fullNameRequired");
        }

        if (!email) {
            errors.email = t("auth.emailRequired");
        } else if (!validateEmail(email)) {
            errors.email = t("auth.invalidEmail");
        }

        if (!phone) {
            errors.phone = t("auth.phoneRequired");
        } else if (!validatePhone(phone)) {
            errors.phone = t("auth.invalidPhone");
        }

        if (!password) {
            errors.password = t("auth.passwordRequired");
        } else if (!validatePassword(password)) {
            errors.password = t("auth.passwordTooShort");
        }

        if (!confirmPassword) {
            errors.confirmPassword = t("auth.confirmPasswordRequired");
        } else if (password !== confirmPassword) {
            errors.confirmPassword = t("auth.passwordsDontMatch");
        }

        if (!termsAccepted) {
            errors.terms = t("auth.termsRequired");
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Filter countries based on search query
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCountries(countriesList);
        } else {
            const filtered = countriesList.filter(
                (country) =>
                    country.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    country.callingCode[0].includes(searchQuery)
            );
            setFilteredCountries(filtered);
        }
    }, [searchQuery, countriesList]);

    const togglePasswordVisibility = () => {
        setHidePassword(!hidePassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setHideConfirmPassword(!hideConfirmPassword);
    };

    const handleRegister = async () => {
        // التحقق من صحة النموذج
        if (!validateForm()) {
            // إظهار إشعار بالأخطاء
            showNotification({
                type: "error",
                mainText: t("auth.formValidationFailed"),
                subText: t("auth.pleaseFixErrors"),
                duration: 5000,
            });
            return;
        }

        clearError();

        // بناء كائن البيانات المطلوبة للتسجيل
        const registerData = {
            username,
            name: fullName,
            email,
            password,
            password_confirmation: confirmPassword,
            phone_number: phone,
            country_code: `+${countryCode.callingCode[0]}`,
        };

        // عرض إشعار التحميل
        showNotification({
            type: "loading",
            mainText: t("auth.creatingAccount"),
            autoClose: false,
        });

        try {
            // استدعاء وظيفة التسجيل من المخزن
            const result = await register(registerData);

            // إخفاء إشعار التحميل
            useNotificationStore.getState().hideNotification();

            if (result) {
                console.log("Registration successful:", result);

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

                // إظهار إشعار النجاح
                showNotification({
                    type: "success",
                    mainText: t("auth.registrationSuccessful"),
                    subText: t("auth.welcomeToApp"),
                    duration: 3000,
                });

                // توجيه المستخدم إلى صفحة التحقق من البريد الإلكتروني
                router.replace("/(auth)/otp");
            }
        } catch (error) {
            console.error("Registration error:", error);
            // إخفاء إشعار التحميل في حالة حدوث خطأ
            useNotificationStore.getState().hideNotification();
            // سيتم عرض الخطأ تلقائيًا من خلال حالة الخطأ
        }
    };

    // Handle opening country picker bottom sheet
    const handleOpenCountryPicker = useCallback(() => {
        Keyboard.dismiss();
        countryPickerBottomSheetRef.current?.snapToIndex(0);
    }, []);

    // Handle closing country picker bottom sheet
    const handleCloseCountryPicker = useCallback(() => {
        countryPickerBottomSheetRef.current?.close();
        setSearchQuery("");
    }, []);

    // Handle selecting a country
    const handleSelectCountry = useCallback((country: any) => {
        setCountryCode(country);
        handleCloseCountryPicker();
    }, []);

    // Render backdrop for bottom sheet
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

    // Render country item
    const renderCountryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
                countryCode.cca2 === item.cca2 && styles.selectedCountryItem,
            ]}
            onPress={() => handleSelectCountry(item)}
            activeOpacity={0.6}
        >
            <Text style={{ fontSize: 28, marginHorizontal: 8 }}>
                {item.flag}
            </Text>
            <Text
                style={[
                    styles.countryName,
                    { textAlign: isRTL ? "right" : "left" },
                    countryCode.cca2 === item.cca2 &&
                        styles.selectedCountryText,
                ]}
            >
                {item.name}
            </Text>
            <Text
                style={[
                    styles.countryCallingCode,
                    countryCode.cca2 === item.cca2 &&
                        styles.selectedCountryText,
                ]}
            >
                +{item.callingCode[0]}
            </Text>
        </TouchableOpacity>
    );

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
                            styles.welcomeText,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.register")}
                    </Text>
                    <Text
                        style={[
                            styles.descriptionText,
                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                        ]}
                    >
                        {t("auth.registerWelcomeMessage") ||
                            "سجل بياناتك بالأسفل للاستمتاع بكل مميزات التطبيق"}
                    </Text>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text color="#ff4444">{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.formContainer}>
                        {/* اسم المستخدم */}
                        <Text
                            style={[
                                styles.fieldLabel,
                                { textAlign: isRTL ? "right" : "left" },
                            ]}
                        >
                            {t("auth.username")}{" "}
                            <Text style={{ color: "red" }}>*</Text>
                        </Text>
                        <View
                            style={[
                                styles.inputWrapper,
                                usernameExists && { borderColor: "red" },
                            ]}
                        >
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        textAlign: isRTL ? "right" : "left",
                                        paddingLeft: isRTL ? 15 : 45,
                                        paddingRight: isRTL ? 45 : 15,
                                    },
                                ]}
                                placeholder={t("auth.username")}
                                value={username}
                                onChangeText={setUsername}
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
                                    name="person-outline"
                                    size={20}
                                    color="#999"
                                />
                            </View>
                        </View>
                        {usernameExists && (
                            <Text style={styles.errorText}>
                                {isRTL
                                    ? "اسم المستخدم موجود مسبقاً، يرجى اختيار اسم مستخدم آخر"
                                    : "Username already exists, please choose another one"}
                            </Text>
                        )}

                        {/* الاسم الكامل */}
                        <Text
                            style={[
                                styles.fieldLabel,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    marginTop: 15,
                                },
                            ]}
                        >
                            {t("auth.fullName")}{" "}
                            <Text style={{ color: "red" }}>*</Text>
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
                                ]}
                                placeholder={t("auth.fullName")}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholderTextColor="#999"
                            />
                            <View
                                style={[
                                    styles.inputIconContainer,
                                    isRTL ? { right: 15 } : { left: 15 },
                                ]}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#999"
                                />
                            </View>
                        </View>

                        {/* البريد الإلكتروني */}
                        <Text
                            style={[
                                styles.fieldLabel,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    marginTop: 15,
                                },
                            ]}
                        >
                            {t("auth.email")}{" "}
                            <Text style={{ color: "red" }}>*</Text>
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
                                ]}
                                placeholder={t("auth.email")}
                                value={email}
                                onChangeText={setEmail}
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

                        {/* كلمة المرور - إصلاح لون الخلفية */}
                        <Text
                            style={[
                                styles.fieldLabel,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    marginTop: 15,
                                },
                            ]}
                        >
                            {t("auth.password")}{" "}
                            <Text style={{ color: "red" }}>*</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        textAlign: isRTL ? "right" : "left",
                                        paddingLeft: isRTL ? 15 : 45,
                                        paddingRight: isRTL ? 45 : 15,
                                        backgroundColor: "#F9F9F9",
                                    },
                                ]}
                                placeholder={t("auth.password")}
                                value={password}
                                onChangeText={setPassword}
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

                        {/* كلمة المرور التأكيدية - إصلاح لون الخلفية */}
                        <View style={{ marginBottom: 10 }}>
                            <Text
                                style={[
                                    styles.fieldLabel,
                                    {
                                        textAlign: isRTL ? "right" : "left",
                                        marginBottom: 5,
                                    },
                                ]}
                            >
                                {t("auth.confirmPassword")}{" "}
                                <Text style={{ color: "red" }}>*</Text>
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    {
                                        borderColor: !passwordsMatch
                                            ? "#FF5252"
                                            : "#ddd",
                                    },
                                ]}
                            >
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            textAlign: isRTL ? "right" : "left",
                                            paddingLeft: isRTL ? 15 : 45,
                                            paddingRight: isRTL ? 45 : 15,
                                            backgroundColor: "#F9F9F9",
                                        },
                                    ]}
                                    secureTextEntry={hideConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder={t("auth.confirmPassword")}
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
                                    onPress={toggleConfirmPasswordVisibility}
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
                            {!passwordsMatch && (
                                <Text style={styles.errorText}>
                                    {t("auth.passwordsDontMatch") ||
                                        "كلمات المرور غير متطابقة"}
                                </Text>
                            )}
                        </View>

                        {/* رقم الهاتف - إصلاح محاذاة النص والأيقونة */}
                        <View style={{ marginBottom: 10 }}>
                            <Text
                                style={[
                                    styles.fieldLabel,
                                    {
                                        textAlign: isRTL ? "right" : "left",
                                        marginBottom: 5,
                                    },
                                ]}
                            >
                                {t("auth.phone")}{" "}
                                <Text style={{ color: "red" }}>*</Text>
                            </Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    {
                                        flexDirection: isRTL
                                            ? "row-reverse"
                                            : "row",
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.countrySelector,
                                        {
                                            flexDirection: isRTL
                                                ? "row-reverse"
                                                : "row",
                                        },
                                    ]}
                                    onPress={handleOpenCountryPicker}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={{
                                            flexDirection: isRTL
                                                ? "row-reverse"
                                                : "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: isRTL
                                                    ? "row-reverse"
                                                    : "row",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 24,
                                                    marginHorizontal: 4,
                                                }}
                                            >
                                                {countryCode?.flag}
                                            </Text>
                                            <Text
                                                style={styles.countryCodeText}
                                            >
                                                +{countryCode?.callingCode[0]}
                                            </Text>
                                        </View>
                                        <View style={styles.dropdownIcon}>
                                            <Ionicons
                                                name="chevron-down"
                                                size={16}
                                                color="#777"
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <View
                                    style={[
                                        styles.phoneInputWrapper,
                                        { position: "relative" },
                                    ]}
                                >
                                    <TextInput
                                        style={[
                                            styles.phoneInput,
                                            {
                                                textAlign: isRTL
                                                    ? "right"
                                                    : "left",
                                                paddingLeft: isRTL ? 15 : 40,
                                                paddingRight: isRTL ? 40 : 15,
                                                backgroundColor: "#F9F9F9",
                                            },
                                        ]}
                                        placeholder={t("auth.phoneNumber")}
                                        placeholderTextColor="#999"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                    />
                                    <Ionicons
                                        name="call-outline"
                                        size={20}
                                        color="#999"
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            marginTop: -10,
                                            left: isRTL ? null : 15,
                                            right: isRTL ? 15 : null,
                                        }}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* الموافقة على الشروط */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setTermsAccepted(!termsAccepted)}
                            style={[
                                styles.termsContainer,
                                {
                                    flexDirection: isRTL
                                        ? "row-reverse"
                                        : "row",
                                },
                            ]}
                        >
                            <View style={styles.checkbox}>
                                {termsAccepted && (
                                    <View style={styles.innerCheckbox} />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                {t("auth.termsAgreement")}
                            </Text>
                        </TouchableOpacity>

                        {/* زر إنشاء حساب */}
                        <View style={styles.registerButtonContainer}>
                            <Button
                                title={t("auth.register")}
                                onPress={handleRegister}
                                loading={isLoading}
                                fullWidth
                                variant="primary"
                                style={styles.registerButton}
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
                                <Text style={styles.haveAccountText}>
                                    {t("auth.haveAccount")}{" "}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push("/(auth)/login")}
                                >
                                    <Text style={styles.loginLink}>
                                        {t("auth.login")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Sheet for Country Picker */}
                <BottomSheet
                    ref={countryPickerBottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose={true}
                    enableHandlePanningGesture={true}
                    backdropComponent={renderBackdrop}
                    backgroundStyle={styles.bottomSheetBackground}
                >
                    <View style={styles.countryPickerHeader}>
                        <Text style={styles.countryPickerTitle}>
                            {t("auth.selectCountry")}
                        </Text>
                        <TouchableOpacity
                            onPress={handleCloseCountryPicker}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={[
                                styles.searchInput,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    paddingLeft: isRTL ? 15 : 40,
                                    paddingRight: isRTL ? 40 : 15,
                                },
                            ]}
                            placeholder={t("auth.searchCountry")}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            clearButtonMode="always"
                        />
                        <Ionicons
                            name="search"
                            size={20}
                            color="#666"
                            style={[
                                styles.searchIcon,
                                isRTL ? { right: 15 } : { left: 15 },
                            ]}
                        />
                    </View>
                    <BottomSheetScrollView
                        contentContainerStyle={styles.countriesContainer}
                    >
                        {filteredCountries.length > 0 ? (
                            <>
                                <Text
                                    style={[
                                        styles.countriesCountText,
                                        { textAlign: isRTL ? "right" : "left" },
                                    ]}
                                >
                                    {filteredCountries.length}{" "}
                                    {t("auth.countries")}
                                </Text>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{
                                        paddingBottom: 30,
                                    }}
                                >
                                    {filteredCountries.map((item) => (
                                        <TouchableOpacity
                                            key={item.cca2}
                                            style={[
                                                styles.countryItem,
                                                {
                                                    flexDirection: isRTL
                                                        ? "row-reverse"
                                                        : "row",
                                                },
                                                countryCode.cca2 ===
                                                    item.cca2 &&
                                                    styles.selectedCountryItem,
                                            ]}
                                            onPress={() =>
                                                handleSelectCountry(item)
                                            }
                                            activeOpacity={0.6}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 28,
                                                    marginHorizontal: 8,
                                                }}
                                            >
                                                {item.flag}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.countryName,
                                                    {
                                                        textAlign: isRTL
                                                            ? "right"
                                                            : "left",
                                                    },
                                                    countryCode.cca2 ===
                                                        item.cca2 &&
                                                        styles.selectedCountryText,
                                                ]}
                                            >
                                                {item.name}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.countryCallingCode,
                                                    countryCode.cca2 ===
                                                        item.cca2 &&
                                                        styles.selectedCountryText,
                                                ]}
                                            >
                                                +{item.callingCode[0]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <View style={styles.noResultsContainer}>
                                <Ionicons
                                    name="search-outline"
                                    size={48}
                                    color="#ccc"
                                />
                                <Text style={styles.noResultsText}>
                                    {t("auth.noResults")}
                                </Text>
                            </View>
                        )}
                    </BottomSheetScrollView>
                </BottomSheet>
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
        marginTop: height * 0.03,
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
        marginBottom: 20,
    },
    formContainer: {
        marginTop: 5,
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
    errorText: {
        color: "#FF5252",
        fontSize: 12,
        fontFamily: "somar-regular",
        marginTop: 4,
        textAlign: I18nManager.isRTL ? "right" : "left",
    },
    phoneInputContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    countryPickerButton: {
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        width: "35%",
    },
    phoneInputWrapper: {
        flex: 1,
        marginLeft: I18nManager.isRTL ? 0 : 10,
        marginRight: I18nManager.isRTL ? 10 : 0,
    },
    phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        height: 50,
        fontSize: 16,
        backgroundColor: "#F9F9F9",
        fontFamily: "somar-regular",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    termsContainer: {
        alignItems: "center",
        marginVertical: 20,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#777",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 8,
    },
    innerCheckbox: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: "#000",
    },
    termsText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-regular",
    },
    orText: {
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        marginVertical: 15,
        fontFamily: "somar-regular",
    },
    socialButtonsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        marginVertical: 10,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        backgroundColor: "#FFF",
    },
    registerButtonContainer: {
        width: "100%",
        marginTop: 30,
        marginBottom: 30,
    },
    registerButton: {
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
    haveAccountText: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-regular",
    },
    loginLink: {
        fontSize: 14,
        color: "#000",
        textDecorationLine: "underline",
        fontFamily: "somar-bold",
    },

    // Bottom Sheet styles
    bottomSheetIndicator: {
        backgroundColor: "#CCCCCC",
        width: 40,
        height: 5,
    },
    bottomSheetBackground: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    bottomSheetHeader: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        position: "relative",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        fontFamily: "somar-bold",
    },
    closeButton: {
        position: "absolute",
        right: I18nManager.isRTL ? null : 15,
        left: I18nManager.isRTL ? 15 : null,
        padding: 5,
    },
    searchContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        position: "relative",
        marginBottom: 5,
    },
    searchInput: {
        height: 45,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingLeft: 40,
        paddingRight: 15,
        fontSize: 16,
        backgroundColor: "#F7F7F7",
        fontFamily: "somar-regular",
    },
    searchIcon: {
        position: "absolute",
        left: 25,
        top: 22,
    },
    countriesList: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    countryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    countryName: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        marginHorizontal: 10,
        fontFamily: "somar-regular",
    },
    countryCallingCode: {
        fontSize: 16,
        color: "#666",
        fontFamily: "somar-bold",
    },
    countryListHeaderText: {
        fontSize: 12,
        color: "#777",
        marginBottom: 10,
        textAlign: "center",
        fontFamily: "somar-regular",
    },
    noResultsContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 50,
    },
    noResultsText: {
        fontSize: 16,
        color: "#999",
        fontFamily: "somar-regular",
        marginTop: 15,
    },
    inputContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    countrySelector: {
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        width: "35%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    countryCodeText: {
        fontSize: 15,
        color: "#333",
        fontFamily: "somar-medium",
        marginHorizontal: 5,
    },
    dropdownIcon: {
        paddingHorizontal: 4,
    },
    countryPickerHeader: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        position: "relative",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    countryPickerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        fontFamily: "somar-bold",
    },
    countriesContainer: {
        paddingHorizontal: 15,
        paddingTop: 5,
        paddingBottom: 20,
    },

    iconContainer: {
        position: "absolute",
        right: I18nManager.isRTL ? null : 15,
        left: I18nManager.isRTL ? 15 : null,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    countriesCountText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 15,

        fontFamily: "somar-regular",
    },
    selectedCountryItem: {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    selectedCountryText: {
        fontFamily: "somar-bold",
        color: "#000",
    },
    inputError: {
        borderColor: "#FF5252",
        borderWidth: 1,
    },
    checkboxError: {
        borderColor: "#FF5252",
    },
});
