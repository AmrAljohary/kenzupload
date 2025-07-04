import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/axios";
import { useAuthStore } from "../store/auth";
import axios from "axios";

// مفاتيح التخزين
const AUTH_TOKEN_KEY = "USER_TOKEN";
const USER_DATA_KEY = "USER_DATA";
const IS_FIRST_LAUNCH_KEY = "IS_FIRST_LAUNCH";
const INTRO_SHOWN_KEY = "intro_completed";
const LANGUAGE_SELECTED_KEY = "language_selected";
interface UserData {
    id: number;
    name: string;
    email: string;
    country_code: string;
    phone_number: string;
    is_email_verified: boolean;
    profile_image?: string;
    username: string;
    token: string;
    [key: string]: any;
}

interface ApiResponse {
    data: {
        id: number;
        username: string;
        name: string;
        profile_image: string;
        country_code: string;
        type: string;
        email: string;
        phone_number: string;
        is_banned: boolean;
        ban_type: string | null;
        unbanned_at: string | null;
        cover_image: string | null;
        videos_count: number;
        followers_count: number;
        following_count: number;
        total_likes: number;
        is_email_verified: boolean;
    };
    status: number;
    msg: string;
}

export function useAuth() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isFirstLaunch, setIsFirstLaunch] = useState(false);
    const [introShown, setIntroShown] = useState(false);
    const [languageSelected, setLanguageSelected] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // تحميل حالة المصادقة
    const loadAuthState = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // التحقق من المقدمة والتشغيل الأول
            const [firstLaunchValue, introShownValue, languageSelectedValue] =
                await Promise.all([
                    AsyncStorage.getItem(IS_FIRST_LAUNCH_KEY),
                    AsyncStorage.getItem(INTRO_SHOWN_KEY),
                    AsyncStorage.getItem(LANGUAGE_SELECTED_KEY),
                ]);

            // تعيين حالة التشغيل الأول
            if (firstLaunchValue === null) {
                await AsyncStorage.setItem(IS_FIRST_LAUNCH_KEY, "false");
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }

            // تعيين حالة المقدمة
            setIntroShown(introShownValue === "true");
            setLanguageSelected(languageSelectedValue === "true");
            // التحقق من بيانات المصادقة
            const [storedToken, storedUserData] = await Promise.all([
                AsyncStorage.getItem(AUTH_TOKEN_KEY),
                AsyncStorage.getItem(USER_DATA_KEY),
            ]);
            console.log("storedToken", storedToken);
            console.log("storedUserData", storedUserData);

            if (!storedToken) {
                setIsAuthenticated(false);
                setUser(null);
                setIsEmailVerified(false);
                return;
            }

            // تحديث بيانات المستخدم من الخادم
            try {
                const response = await api.get<ApiResponse>("/profile", {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                    },
                });
                if (response.data?.data) {
                    const userData = response.data.data;
                    const updatedUserData = {
                        ...userData,
                        token: storedToken,
                    };

                    setUser(updatedUserData);
                    setIsAuthenticated(true);
                    setIsEmailVerified(userData.is_email_verified);

                    // تحديث البيانات المخزنة
                    await AsyncStorage.setItem(
                        USER_DATA_KEY,
                        JSON.stringify(updatedUserData)
                    );
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error: any) {
                console.error("Error fetching user data:", error);
                if (error.response?.status === 401) {
                    await logout();
                }
                setError(error.message);
                setIsAuthenticated(false);
                setUser(null);
                setIsEmailVerified(false);
            }
        } catch (error: any) {
            console.error("Error loading auth state:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // تحميل الحالة عند بدء التطبيق
    useEffect(() => {
        loadAuthState();
    }, []);

    // وظيفة تسجيل الدخول
    const login = async (userData: UserData) => {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, userData.token);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
            setIsEmailVerified(userData.is_email_verified);
            return true;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    // وظيفة تحديث حالة التحقق من البريد
    const updateEmailVerificationStatus = async (verified: boolean) => {
        try {
            if (user) {
                const updatedUser = { ...user, is_email_verified: verified };
                await AsyncStorage.setItem(
                    USER_DATA_KEY,
                    JSON.stringify(updatedUser)
                );
                setUser(updatedUser);
                setIsEmailVerified(verified);
            }
            return true;
        } catch (error) {
            console.error("Email verification update error:", error);
            return false;
        }
    };

    // وظيفة تعيين حالة المقدمة
    const setIntroComplete = async (completed: boolean) => {
        try {
            await AsyncStorage.setItem(
                INTRO_SHOWN_KEY,
                completed ? "true" : "false"
            );
            setIntroShown(completed);
            return true;
        } catch (error) {
            console.error("Intro completion error:", error);
            return false;
        }
    };

    // وظيفة تسجيل الخروج
    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
            setIsAuthenticated(false);
            setUser(null);
            setIsEmailVerified(false);
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    };

    // وظيفة تحديث بيانات المستخدم
    const updateUserInfo = async (updatedUserData: Partial<UserData>) => {
        try {
            if (user) {
                const newUserData = { ...user, ...updatedUserData };
                await AsyncStorage.setItem(
                    USER_DATA_KEY,
                    JSON.stringify(newUserData)
                );
                setUser(newUserData);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Update user info error:", error);
            return false;
        }
    };

    return {
        isLoading,
        isAuthenticated,
        isFirstLaunch,
        isEmailVerified,
        introShown,
        user,
        error,
        login,
        logout,
        updateUserInfo,
        updateEmailVerificationStatus,
        setIntroComplete,
        languageSelected,
        loadAuthState, // تصدير هذه الوظيفة للتحديث اليدوي عند الحاجة
    };
}
