import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    I18nManager,
} from "react-native";
import { router, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import BottomSheet, {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAppLanguage } from "@/hooks/useLanguage";
import { Text } from "@/components/ui/Text";
import { api } from "@/services/axios";
import FastImage from "react-native-fast-image";
import { TextInput } from "react-native";
import Header from "@/components/ui/Header";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Notification, NotificationType } from "@/components/ui/Notification";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'; // Import manipulateAsync

// أعلام البلدان
const SA_FLAG = require("../../../assets/images/SA.png");
const US_FLAG = require("../../../assets/images/USA.png");

// إنشاء المكون الرئيسي لصفحة الإعدادات
export default function SettingsScreen() {
    const { user, logout, updateUserInfo } = useAuth();
    const { t, isRTL, toggleLanguage, language, switchLanguage } =
        useAppLanguage();
    const router = useRouter();

    // حالات التطبيق
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [profileImage, setProfileImage] = useState<string | null>(
        user?.profile_image || null
    );
    const [coverImage, setCoverImage] = useState<string | null>(
        user?.cover_image || null
    );
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    // حالة اللغة المؤقتة
    const [tempLanguage, setTempLanguage] = useState<string>(language);

    // حالات الإشعارات
    const [notification, setNotification] = useState({
        visible: false,
        type: "success" as NotificationType,
        message: "",
        subMessage: "",
    });

    // مراجع للـ BottomSheet
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["40%"], []);

    // البيانات الحالية
    const [formData, setFormData] = useState({
        name: user?.name || "",
        username: user?.username || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",
        newPassword: "",
        confirmPassword: "",
    });
    const userData = async () => {
        const userData = await AsyncStorage.getItem("USER_DATA");
        if (userData) {
            setFormData(JSON.parse(userData));
        }
    };
    useEffect(() => {
        // التأكد من أن البوتم شيت ق عند تحميل الصفحة
        userData();
    }, []);

    // دالة عرض الإشعارات
    const showNotification = (
        type: NotificationType,
        message: string,
        subMessage: string = ""
    ) => {
        setNotification({
            visible: true,
            type,
            message,
            subMessage,
        });
    };

    // إغلاق الإشعار
    const closeNotification = () => {
        setNotification((prev) => ({ ...prev, visible: false }));
    };

    const handlePresentModalPress = useCallback(
        (option: string) => {
            setSelectedOption(option);
            // إعادة تعيين اللغة المؤقتة عند فتح مربع حوار اللغة
            if (option === "language") {
                setTempLanguage(language);
            }
            // نتأكد من أن البوتم شيت جاهز قبل فتحه
            setTimeout(() => {
                bottomSheetModalRef.current?.expand();
            }, 100);
        },
        [language]
    );

    // الرجوع للصفحة السابقة
    const handleBack = useCallback(() => {
        router.back();
    }, []);

    // في البداية، أضف معالجة حدث useEffect لتحديث البيانات عند تغير user
    useEffect(() => {
        if (user) {
            setProfileImage(user.profile_image || null);
            setCoverImage(user.cover_image || null);
        }
    }, [user]);

    // التقاط صورة من المعرض لصورة الملف الشخصي
    const pickImage = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== "granted") {
                showNotification(
                    "error",
                    t("common.error"),
                    t("settings.cameraPermissionError")
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1, // Start with full quality, we'll compress if needed
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsLoading(true);
                showNotification(
                    "loading",
                    t("common.loading"),
                    t("settings.updatingProfileImage")
                );

                let imageUri = result.assets[0].uri;
                let imageFileInfo = await fetch(imageUri).then(res => res.blob());
                let imageSizeInKB = imageFileInfo.size / 1024; // Calculate size in KB
                let compressionQuality = 1.0; // Start with no compression

                // Compress image if larger than 2MB (2048 KB), target slightly less than 2048KB
                while (imageSizeInKB > 1000 && compressionQuality > 0.01) { // Target 1000KB (1MB) to be safe, allowing lower quality
                    compressionQuality -= 0.1; // Decrease quality by 10%
                    const manipResult = await manipulateAsync(
                        imageUri,
                        [],
                        { compress: compressionQuality, format: SaveFormat.JPEG }
                    );
                    imageUri = manipResult.uri;
                    imageFileInfo = await fetch(imageUri).then(res => res.blob());
                    imageSizeInKB = imageFileInfo.size / 1024; // Recalculate size in KB
                    console.log(`Compressed profile image to ${imageSizeInKB.toFixed(2)} KB with quality ${compressionQuality.toFixed(1)}`);
                }

                console.log("Final profile image URI before upload:", imageUri);
                console.log(`Final profile image size before upload: ${imageSizeInKB.toFixed(2)} KB`);

                try {
                    // إنشاء كائن FormData لرفع الصورة
                    const formData = new FormData();
                    // استخدام اسم الملف الذي يتوقعه الخادم
                    formData.append("profile_image", {
                        uri: imageUri, // Use the potentially compressed image URI
                        type: "image/jpeg",
                        name: "profile_image.jpg",
                    } as any);

                    // استدعاء نقطة النهاية الصحيحة لتحديث الصورة
                    const response = await api.post(
                        "user/profile-image",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );

                    const responseData = response.data as any;

                    if (response && response.status === 200) {
                        // تحديث الصورة في الحالة المحلية
                        setProfileImage(result.assets[0].uri);

                        // تحديث بيانات المستخدم المحلية عبر useAuth
                        if (updateUserInfo && user) {
                            updateUserInfo({
                                ...user,
                                profile_image: result.assets[0].uri,
                            });
                        }

                        // تحديث صورة المستخدم في التخزين المحلي
                        try {
                            const userDataStr =
                                await AsyncStorage.getItem("USER_DATA");
                            if (userDataStr) {
                                const parsedUserData = JSON.parse(userDataStr);
                                const updatedUserData = {
                                    ...parsedUserData,
                                    profile_image: result.assets[0].uri,
                                };
                                await AsyncStorage.setItem(
                                    "USER_DATA",
                                    JSON.stringify(updatedUserData)
                                );
                            }
                        } catch (err) {
                            // معالجة أخطاء AsyncStorage بصمت
                        }

                        showNotification(
                            "success",
                            t("common.success"),
                            t("settings.profileImageUpdated")
                        );
                    } else {
                        showNotification(
                            "error",
                            t("common.error"),
                            responseData?.msg || t("settings.updateError")
                        );
                    }
                } catch (error: any) {
                    let errorMessage = t("settings.updateError");
                    if (
                        error &&
                        error.response &&
                        error.response.data &&
                        error.response.data.msg
                    ) {
                        errorMessage = error.response.data.msg;
                    }
                    showNotification("error", t("common.error"), errorMessage);
                } finally {
                    setIsLoading(false);
                }
            }
        } catch (error) {
            showNotification(
                "error",
                t("common.error"),
                t("settings.imagePickerError")
            );
        }
    };

    // دالة اختيار صورة الغلاف
    const pickCoverImage = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== "granted") {
                showNotification(
                    "error",
                    t("common.error"),
                    t("settings.cameraPermissionError")
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 1],
                quality: 1, // Start with full quality, we'll compress if needed
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsLoading(true);
                showNotification(
                    "loading",
                    t("common.loading"),
                    t("settings.updatingCoverImage")
                );

                let imageUri = result.assets[0].uri;
                let imageFileInfo = await fetch(imageUri).then(res => res.blob());
                let imageSizeInKB = imageFileInfo.size / 1024; // Calculate size in KB
                let compressionQuality = 1.0; // Start with no compression

                // Compress image if larger than 2MB (2048 KB), target slightly less than 2048KB
                while (imageSizeInKB > 1000 && compressionQuality > 0.01) { // Target 1000KB (1MB) to be safe, allowing lower quality
                    compressionQuality -= 0.1; // Decrease quality by 10%
                    const manipResult = await manipulateAsync(
                        imageUri,
                        [],
                        { compress: compressionQuality, format: SaveFormat.JPEG }
                    );
                    imageUri = manipResult.uri;
                    imageFileInfo = await fetch(imageUri).then(res => res.blob());
                    imageSizeInKB = imageFileInfo.size / 1024; // Recalculate size in KB
                    console.log(`Compressed cover image to ${imageSizeInKB.toFixed(2)} KB with quality ${compressionQuality.toFixed(1)}`);
                }

                console.log("Final cover image URI before upload:", imageUri);
                console.log(`Final cover image size before upload: ${imageSizeInKB.toFixed(2)} KB`);

                try {
                    const formData = new FormData();
                    // استخدام اسم الملف الذي يتوقعه الخادم
                    formData.append("cover_image", {
                        uri: imageUri, // Use the potentially compressed image URI
                        type: "image/jpeg",
                        name: "cover_image.jpg",
                    } as any);

                    const response = await api.post(
                        "user/update-cover",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );

                    const responseData = response.data as any;
                    if (response && response.status === 200) {
                        // تحديث الصورة في الحالة المحلية
                        setCoverImage(result.assets[0].uri);

                        // تحديث بيانات المستخدم المحلية عبر useAuth
                        if (updateUserInfo && user) {
                            updateUserInfo({
                                ...user,
                                cover_image: result.assets[0].uri,
                            });
                        }

                        // تحديث صورة الغلاف في التخزين المحلي
                        try {
                            const userDataStr =
                                await AsyncStorage.getItem("USER_DATA");
                            if (userDataStr) {
                                const parsedUserData = JSON.parse(userDataStr);
                                const updatedUserData = {
                                    ...parsedUserData,
                                    cover_image: result.assets[0].uri,
                                };
                                await AsyncStorage.setItem(
                                    "USER_DATA",
                                    JSON.stringify(updatedUserData)
                                );
                            }
                        } catch (err) {
                            // معالجة أخطاء AsyncStorage بصمت
                        }

                        showNotification(
                            "success",
                            t("common.success"),
                            t("settings.coverImageUpdated")
                        );
                    } else {
                        showNotification(
                            "error",
                            t("common.error"),
                            responseData?.msg || t("settings.updateError")
                        );
                    }
                } catch (error: any) {
                    let errorMessage = t("settings.updateError");
                    if (
                        error &&
                        error.response &&
                        error.response.data &&
                        error.response.data.msg
                    ) {
                        errorMessage = error.response.data.msg;
                    }
                    showNotification("error", t("common.error"), errorMessage);
                } finally {
                    setIsLoading(false);
                }
            }
        } catch (error) {
            showNotification(
                "error",
                t("common.error"),
                t("settings.imagePickerError")
            );
        }
    };

    // تحديث البيانات الشخصية
    const updateProfile = async (updatedData: any) => {
        try {
            setIsLoading(true);
            showNotification(
                "loading",
                t("common.loading"),
                t("settings.updatingProfile")
            );

            const response = await api.post("/update-profile", updatedData);
            const responseData = response.data as any;

            // التأكد من صحة الاستجابة
            if (response && response.status === 200) {
                // تحديث بيانات المستخدم المحلية إذا كانت متوفرة
                if (responseData?.data?.user) {
                    try {
                        const userDataStr =
                            await AsyncStorage.getItem("USER_DATA");
                        if (userDataStr) {
                            const parsedUserData = JSON.parse(userDataStr);
                            const updatedUserData = {
                                ...parsedUserData,
                                ...updatedData,
                            };
                            await AsyncStorage.setItem(
                                "USER_DATA",
                                JSON.stringify(updatedUserData)
                            );
                            setFormData((prev) => ({
                                ...prev,
                                ...updatedData,
                            }));
                        }
                    } catch (err) {
                        // معالجة أخطاء AsyncStorage بصمت
                    }
                }

                showNotification(
                    "success",
                    t("common.success"),
                    t("settings.profileUpdated")
                );
            } else {
                // رسالة خطأ في حالة فشل الاستجابة
                const errorMessage =
                    responseData?.msg || t("settings.updateError");
                showNotification("error", t("common.error"), errorMessage);
            }
        } catch (error: any) {
            // معالجة أخطاء الشبكة
            let errorMessage = t("settings.updateError");
            if (
                error &&
                error.response &&
                error.response.data &&
                error.response.data.msg
            ) {
                errorMessage = error.response.data.msg;
            }
            showNotification("error", t("common.error"), errorMessage);
        } finally {
            setIsLoading(false);
            bottomSheetModalRef.current?.close();
        }
    };

    // تغيير كلمة المرور
    const handleChangePassword = async () => {
        try {
            if (formData.newPassword !== formData.confirmPassword) {
                showNotification(
                    "error",
                    t("common.error"),
                    t("auth.errors.passwordMismatch")
                );
                return;
            }

            setIsLoading(true);
            showNotification(
                "loading",
                t("common.loading"),
                t("settings.changingPassword")
            );

            // إنشاء FormData لإرسال البيانات
            const formDataToSend = new FormData();
            formDataToSend.append("current_password", formData.password);
            formDataToSend.append("new_password", formData.newPassword);
            formDataToSend.append(
                "password_confirmation",
                formData.confirmPassword
            );

            const response = await api.post(
                "/change-password",
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const responseData = response.data as any;

            if (response && response.status === 200) {
                showNotification(
                    "success",
                    t("common.success"),
                    t("settings.passwordChanged")
                );

                // إعادة تعيين حقول كلمة المرور
                setFormData({
                    ...formData,
                    password: "",
                    newPassword: "",
                    confirmPassword: "",
                });

                // إغلاق البوتوم شيت
                bottomSheetModalRef.current?.close();
            } else {
                const errorMessage =
                    responseData?.msg || t("settings.passwordChangeError");
                showNotification("error", t("common.error"), errorMessage);
            }
        } catch (error: any) {
            let errorMessage = t("settings.passwordChangeError");
            if (
                error &&
                error.response &&
                error.response.data &&
                error.response.data.msg
            ) {
                errorMessage = error.response.data.msg;
            }
            showNotification("error", t("common.error"), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // تغيير اللغة
    const handleChangeLanguage = (newLanguage?: string) => {
        if (newLanguage) {
            switchLanguage(newLanguage as "ar" | "en");
        } else {
            toggleLanguage();
        }
        bottomSheetModalRef.current?.close();
    };

    // تسجيل الخروج
    const handleLogout = () => {
        // إغلاق البوتوم شيت
        bottomSheetModalRef.current?.close();

        // تسجيل الخروج مباشرة بدون تنبيه
        setTimeout(async () => {
            try {
                showNotification(
                    "loading",
                    t("common.loading"),
                    t("auth.loggingOut")
                );
                await logout();
                // التوجيه إلى صفحة تسجيل الدخول
                router.replace("/(auth)/login");
            } catch (error) {
                console.error("Error logging out:", error);
                showNotification(
                    "error",
                    t("common.error"),
                    t("auth.logoutError")
                );
            }
        }, 300);
    };

    // حذف الحساب
    const handleDeleteAccount = () => {
        // إغلاق البوتوم شيت
        bottomSheetModalRef.current?.close();

        // حذف الحساب مباشرة بدون تنبيه
        setTimeout(async () => {
            try {
                setIsLoading(true);
                showNotification(
                    "loading",
                    t("common.loading"),
                    t("settings.deletingAccount")
                );

                const response = await api.post("delete-account");

                if (
                    response &&
                    typeof response.data === "object" &&
                    response.data &&
                    "success" in response.data &&
                    (response.data as any).success
                ) {
                    await logout();
                    showNotification(
                        "success",
                        t("common.success"),
                        t("settings.accountDeleted")
                    );
                    // التوجيه إلى صفحة تسجيل الدخول
                    router.replace("/(auth)/login");
                } else {
                    showNotification(
                        "error",
                        t("common.error"),
                        (response &&
                            typeof response.data === "object" &&
                            response.data &&
                            "message" in response.data &&
                            (response.data as any).message) ||
                            t("settings.deleteError")
                    );
                }
            } catch (error: any) {
                let errorMessage = t("settings.deleteError");
                if (
                    error &&
                    error.response &&
                    error.response.data &&
                    error.response.data.msg
                ) {
                    errorMessage = error.response.data.msg;
                }
                showNotification("error", t("common.error"), errorMessage);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    // عرض محتوى البوتوم شيت حسب الخيار المحدد
    const renderBottomSheetContent = () => {
        switch (selectedOption) {
            case "fullName":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.changeName")}
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("auth.fullName")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.name}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            name: text,
                                        })
                                    }
                                    placeholder={t("settings.enterName")}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                updateProfile({ name: formData.name })
                            }
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            case "username":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.changeUsername")}
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("auth.username")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.username}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            username: text,
                                        })
                                    }
                                    placeholder={t("settings.enterUsername")}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                updateProfile({ username: formData.username })
                            }
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            case "phone":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.changePhone")}
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("auth.phone")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.phone}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            phone: text,
                                        })
                                    }
                                    placeholder={t("settings.enterPhone")}
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                updateProfile({ phone: formData.phone })
                            }
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            case "email":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.changeEmail")}
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("auth.email")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.email}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            email: text,
                                        })
                                    }
                                    placeholder={t("settings.enterEmail")}
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                updateProfile({ email: formData.email })
                            }
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            case "password":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.changePassword")}
                        </Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("settings.currentPassword")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.password}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            password: text,
                                        })
                                    }
                                    placeholder={t(
                                        "settings.enterCurrentPassword"
                                    )}
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("settings.newPassword")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.newPassword}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            newPassword: text,
                                        })
                                    }
                                    placeholder={t("settings.enterNewPassword")}
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                {t("auth.confirmPassword")}
                            </Text>
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.confirmPassword}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            confirmPassword: text,
                                        })
                                    }
                                    placeholder={t(
                                        "settings.confirmNewPassword"
                                    )}
                                    placeholderTextColor="#999"
                                    secureTextEntry
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleChangePassword}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.actionButtonText}>
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            case "privacy":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.privacy")}
                        </Text>
                        <Text style={styles.bottomSheetDescription}>
                            {t("settings.privacyDescription")}
                        </Text>
                    </View>
                );
            case "language":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.language")}
                        </Text>
                        <View style={styles.languageOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.languageOption,
                                    tempLanguage === "ar" &&
                                        styles.selectedLanguage,
                                    {
                                        flexDirection: isRTL
                                            ? "row"
                                            : "row-reverse",
                                    },
                                ]}
                                onPress={() => setTempLanguage("ar")}
                            >
                                <View style={styles.checkmarkContainer}>
                                    {tempLanguage === "ar" && (
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
                                            flexDirection: isRTL
                                                ? "row"
                                                : "row-reverse",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.languageText,
                                            tempLanguage === "ar" &&
                                                styles.selectedLanguageText,
                                        ]}
                                    >
                                        اللغة العربية
                                    </Text>
                                    <Image
                                        source={SA_FLAG}
                                        style={styles.flagIcon}
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.languageOption,
                                    tempLanguage === "en" &&
                                        styles.selectedLanguage,
                                    {
                                        flexDirection: isRTL
                                            ? "row"
                                            : "row-reverse",
                                    },
                                ]}
                                onPress={() => setTempLanguage("en")}
                            >
                                <View style={styles.checkmarkContainer}>
                                    {tempLanguage === "en" && (
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
                                            flexDirection: isRTL
                                                ? "row"
                                                : "row-reverse",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.languageText,
                                            tempLanguage === "en" &&
                                                styles.selectedLanguageText,
                                        ]}
                                    >
                                        English
                                    </Text>
                                    <Image
                                        source={US_FLAG}
                                        style={styles.flagIcon}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleChangeLanguage(tempLanguage)}
                        >
                            <Text style={styles.actionButtonText}>
                                {t("common.save")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            case "audio":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.audioRecords")}
                        </Text>
                        <Text style={styles.bottomSheetDescription}>
                            {t("settings.comingSoon")}
                        </Text>
                    </View>
                );
            case "terms":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("auth.terms")}
                        </Text>
                        <ScrollView style={styles.termsScrollView}>
                            <Text style={styles.termsText}>
                                {t("auth.termsContent")}
                            </Text>
                        </ScrollView>
                    </View>
                );
            case "privacyPolicy":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.privacyPolicy")}
                        </Text>
                        <ScrollView style={styles.termsScrollView}>
                            <Text style={styles.termsText}>
                                {t("settings.privacyContent")}
                            </Text>
                        </ScrollView>
                    </View>
                );
            case "helpCenter":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.helpCenter")}
                        </Text>
                        <Text style={styles.bottomSheetDescription}>
                            {t("settings.helpCenterDescription")}
                        </Text>
                        <TouchableOpacity style={styles.contactButton}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#000"
                            />
                            <Text style={styles.contactButtonText}>
                                support@kanz.com
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            case "logout":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("auth.logout")}
                        </Text>
                        <Text style={styles.bottomSheetDescription}>
                            {t("settings.logoutConfirmation")}
                        </Text>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() =>
                                    bottomSheetModalRef.current?.close()
                                }
                            >
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        styles.cancelButtonText,
                                    ]}
                                >
                                    {t("common.cancel")}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.confirmButton,
                                ]}
                                onPress={handleLogout}
                            >
                                <Text style={styles.actionButtonText}>
                                    {t("auth.logout")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case "deleteAccount":
                return (
                    <View style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>
                            {t("settings.deleteAccount")}
                        </Text>
                        <Text style={styles.bottomSheetDescription}>
                            {t("settings.deleteAccountConfirmation")}
                        </Text>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() =>
                                    bottomSheetModalRef.current?.close()
                                }
                            >
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        styles.cancelButtonText,
                                    ]}
                                >
                                    {t("common.cancel")}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.deleteButton,
                                ]}
                                onPress={handleDeleteAccount}
                            >
                                <Text style={styles.actionButtonText}>
                                    {t("settings.deleteAccount")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    // عنصر خلفية البوتوم شيت
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    // عنصر صف من عناصر الإعدادات
    const SettingRow = ({
        icon,
        iconColor = "#000",
        title,
        value,
        onPress,
    }: any) => (
        <TouchableOpacity style={styles.settingRow} onPress={onPress}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <View
                    style={[
                        styles.settingIconContainer,
                        { marginHorizontal: 8 },
                    ]}
                >
                    {icon}
                </View>
                <Text style={styles.settingTitle}>{title}</Text>
            </View>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                {value && (
                    <Text
                        style={[styles.settingValue, { marginHorizontal: 6 }]}
                    >
                        {value}
                    </Text>
                )}
                <Ionicons
                    name={isRTL ? "chevron-back" : "chevron-forward"}
                    size={20}
                    color="#000"
                />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* صورة الغلاف */}
                <View style={styles.coverContainer}>
                    <FastImage
                        source={{
                            uri:
                                coverImage ||
                                user?.cover_image ||
                                "https://www.dotefl.com/wp-content/uploads/2023/07/Road-vs-street.jpg",
                        }}
                        style={styles.coverImage}
                    />
                    {/* أزرار الرجوع والتعديل فوق الصورة */}
                    <View style={styles.coverControls}>
                        <TouchableOpacity
                            style={styles.coverButton}
                            onPress={handleBack}
                        >
                            <Ionicons
                                name={
                                    isRTL ? "chevron-forward" : "chevron-back"
                                }
                                size={24}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.coverButton}
                            onPress={pickCoverImage}
                        >
                            <Ionicons
                                name="pencil-outline"
                                size={24}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                    {/* صورة الملف الشخصي فوق الغلاف */}
                    <View style={styles.profileImageWrapper}>
                        <View style={styles.profileImageShadow}>
                            <FastImage
                                source={{
                                    uri:
                                        profileImage ||
                                        user?.profile_image ||
                                        "https://via.placeholder.com/200",
                                }}
                                style={styles.profileImage}
                            />
                            <TouchableOpacity
                                style={styles.cameraButton}
                                onPress={pickImage}
                            >
                                <Ionicons
                                    name="pencil"
                                    size={16}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {/* باقي الصفحة داخل ScrollView */}
                {/* معلومات الحساب */}
                <View style={[styles.sectionContainer, { marginTop: 60 }]}>
                    <SettingRow
                        icon={
                            <Ionicons
                                name="person-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.fullName")}
                        value={formData.name}
                        onPress={() => handlePresentModalPress("fullName")}
                    />
                    <SettingRow
                        icon={
                            <Ionicons
                                name="at-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.username")}
                        value={formData.username}
                        onPress={() => handlePresentModalPress("username")}
                    />
                    {/* <SettingRow
                        icon={
                            <Ionicons
                                name="call-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.phone")}
                        value={formData.phone}
                        onPress={() => handlePresentModalPress("phone")}
                    /> */}
                    <SettingRow
                        icon={
                            <Ionicons
                                name="mail-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.email")}
                        value={formData.email}
                        onPress={() => handlePresentModalPress("email")}
                    />
                    <SettingRow
                        icon={
                            <Ionicons
                                name="lock-closed-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.password")}
                        value="********"
                        onPress={() => handlePresentModalPress("password")}
                    />
                </View>
                {/* الإعدادات العامة */}
                <View style={styles.sectionContainer}>
                    {/* <SettingRow
                        icon={
                            <Ionicons
                                name="shield-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("settings.privacy")}
                        onPress={() => handlePresentModalPress("privacy")}
                    /> */}
                    <SettingRow
                        icon={
                            <Ionicons
                                name="language-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("settings.language")}
                        value={language === "ar" ? "العربية" : "English"}
                        onPress={() => handlePresentModalPress("language")}
                    />
                    {/* <SettingRow
                        icon={
                            <Ionicons
                                name="musical-notes-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("settings.audioRecords")}
                        onPress={() => handlePresentModalPress("audio")}
                    /> */}
                </View>
                {/* المعلومات القانونية */}
                <View style={styles.sectionContainer}>
                    <SettingRow
                        icon={
                            <Ionicons
                                name="document-text-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("auth.terms")}
                        onPress={() => handlePresentModalPress("terms")}
                    />
                    <SettingRow
                        icon={
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("settings.privacyPolicy")}
                        onPress={() => handlePresentModalPress("privacyPolicy")}
                    />
                    <SettingRow
                        icon={
                            <Ionicons
                                name="help-circle-outline"
                                size={22}
                                color="#000"
                            />
                        }
                        title={t("settings.helpCenter")}
                        onPress={() => handlePresentModalPress("helpCenter")}
                    />
                </View>
                {/* أزرار تسجيل الخروج وحذف الحساب */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => handlePresentModalPress("logout")}
                    >
                        <Ionicons
                            name="log-out-outline"
                            size={24}
                            color="#000"
                        />
                        <Text style={styles.logoutText}>
                            {t("auth.logout")}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={() => handlePresentModalPress("deleteAccount")}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={24}
                            color="#F73D3D"
                        />
                        <Text style={styles.deleteAccountText}>
                            {t("settings.deleteAccount")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {/* البوتوم شيت */}
            <BottomSheet
                ref={bottomSheetModalRef}
                index={-1}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                enableDynamicSizing={true}
                enableHandlePanningGesture={true}
            >
                <BottomSheetScrollView>
                    {renderBottomSheetContent()}
                </BottomSheetScrollView>
            </BottomSheet>

            {/* إشعارات النظام */}
            <Notification
                visible={notification.visible}
                type={notification.type}
                mainText={notification.message}
                subText={notification.subMessage}
                onClose={closeNotification}
                autoClose={notification.type !== "loading"}
            />
        </SafeAreaView>
    );
}

// الأنماط
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
        direction: "rtl",
    },
    header: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        height: 54,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f1f1f1",
        backgroundColor: "#fff",
        elevation: 0,
        shadowOpacity: 0,
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#222",
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    headerRightPlaceholder: {
        width: 36,
    },
    scrollContainer: {
        flex: 1,
    },
    profileImageSection: {
        alignItems: "center",
        paddingVertical: 16,
    },
    imageContainer: {
        position: "relative",
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: "hidden",
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#eee",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    loadingImageContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraButton: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionContainer: {
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    settingRow: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 0.5,
        borderBottomColor: "#ececec",
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    settingIconContainer: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    settingTextContainer: {
        flex: 1,
        justifyContent: "flex-end",
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    settingValue: {
        fontSize: 13,
        color: "#888",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    chevronContainer: {
        paddingHorizontal: 6,
    },
    actionsContainer: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        borderRadius: 8,
        backgroundColor: "#f8f8f8",
        marginBottom: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000",
        marginLeft: 6,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    deleteAccountButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        borderRadius: 8,
        backgroundColor: "#FFF0F0",
    },
    deleteAccountText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#F73D3D",
        marginLeft: 6,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },

    bottomSheetContent: {
        padding: 14,
        direction: "ltr",
    },
    bottomSheetTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#000",
        marginBottom: 14,
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    bottomSheetDescription: {
        fontSize: 13,
        color: "#666",
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 14,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    inputContainer: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#666",
        marginBottom: 6,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    textInputContainer: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        backgroundColor: "#f8f8f8",
    },
    textInput: {
        height: 40,
        paddingHorizontal: 12,
        fontSize: 14,
        color: "#000",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    actionButton: {
        height: 44,
        borderRadius: 10,
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
        flex: 1,
        marginHorizontal: 5,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFF",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    languageOptions: {
        width: "100%",
        marginTop: 10,
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
    selectedLanguage: {
        borderColor: "#000",
        borderWidth: 1,
    },
    languageContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        justifyContent: "flex-end",
    },
    languageText: {
        fontSize: 18,
        color: "#444",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    selectedLanguageText: {
        color: "#000",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    flagIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginHorizontal: 8,
    },
    checkmarkContainer: {
        width: 24,
        height: 24,
    },
    termsScrollView: {
        maxHeight: 300,
    },
    termsText: {
        fontSize: 12,
        color: "#333",
        lineHeight: 18,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        borderRadius: 8,
        backgroundColor: "#f8f8f8",
        marginTop: 14,
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000",
        marginLeft: 6,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    coverContainer: {
        width: "100%",
        marginTop: 0,
        height: 220,
        position: "relative",
    },
    coverImage: {
        width: "100%",
        height: "100%",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    coverControls: {
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        zIndex: 10,
    },
    coverButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    profileImageWrapper: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -55,
        alignItems: "center",
        zIndex: 10,
    },
    profileImageShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
        backgroundColor: "#fff",
        borderRadius: 60,
        padding: 4,
        borderWidth: 2,
        borderColor: "#f5f5f5",
    },
    buttonGroup: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        paddingHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
    },
    cancelButtonText: {
        color: "#333",
    },
    confirmButton: {
        backgroundColor: "#222",
    },
    deleteButton: {
        backgroundColor: "#FFF0F0",
        borderWidth: 1,
        borderColor: "#F73D3D",
    },
});
