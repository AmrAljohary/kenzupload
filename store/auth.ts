import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    User,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    PasswordChangeRequest,
    VerifyRequest,
    OtpRequest,
    ResetPasswordRequest,
    AuthResponse,
} from "../types";
import AuthAPI from "../services/api/auth";

interface AuthState {
    // حالة المستخدم
    user: User | null;
    token: string | null;

    // حالة واجهة المستخدم
    isLoading: boolean;
    error: string | null;

    // دوال المصادقة
    login: (credentials: LoginRequest) => Promise<AuthResponse>;
    register: (userData: RegisterRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    updateProfile: (profileData: UpdateProfileRequest) => Promise<void>;
    changePassword: (passwordData: PasswordChangeRequest) => Promise<void>;
    verifyUser: (data: VerifyRequest) => Promise<void>;
    sendOtp: (data: OtpRequest) => Promise<void>;
    verifyOtp: (data: OtpRequest) => Promise<void>;
    resetPassword: (data: ResetPasswordRequest) => Promise<void>;

    // دوال مساعدة
    clearError: () => void;
    setLoading: (isLoading: boolean) => void;
}

/**
 * تعالج استجابة API لإرجاع قيم موحدة
 */
const handleApiResponse = async (response: any) => {
    // تحقق من وجود خطأ
    if (response.problem || !response.ok) {
        let errorMessage = "حدث خطأ غير متوقع";

        // حاول استخراج رسالة الخطأ من الاستجابة
        if (response.data && response.data.message) {
            errorMessage = response.data.message;
        } else if (response.status) {
            switch (response.status) {
                case 401:
                    errorMessage =
                        "خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.";
                    break;
                case 403:
                    errorMessage = "ليس لديك صلاحية للوصول لهذا المورد.";
                    break;
                case 404:
                    errorMessage = "لم يتم العثور على المورد المطلوب.";
                    break;
                case 422:
                    errorMessage = "بيانات غير صالحة. يرجى التحقق من المدخلات.";
                    break;
                case 500:
                    errorMessage = "خطأ في الخادم. يرجى المحاولة لاحقاً.";
                    break;
                default:
                    errorMessage = `خطأ: ${response.status}`;
            }
        }

        throw new Error(errorMessage);
    }

    return response.data;
};

/**
 * مخزن حالة المصادقة باستخدام Zustand
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // الحالة الأولية
            user: null,
            token: null,
            isLoading: false,
            error: null,

            // تعيين قيمة تحميل
            setLoading: (isLoading: boolean) => set({ isLoading }),

            // مسح الخطأ
            clearError: () => set({ error: null }),

            /**
             * تسجيل الدخول
             */
            login: async (credentials: LoginRequest) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await AuthAPI.login(credentials);
                    const result = (await handleApiResponse(
                        response
                    )) as AuthResponse;

                    // حفظ التوكن في التخزين
                    if (result.token) {
                        await AsyncStorage.setItem(
                            "USER_TOKEN",
                            result.data.token
                        );
                    }

                    set({
                        user: result.data,
                        token: result.token,
                        isLoading: false,
                    });

                    // إعادة النتيجة للتمكين من استخدام .then()
                    return result;
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error:
                            error.message ||
                            "فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.",
                    });
                    throw error; // رمي الخطأ للتمكين من التقاطه في الواجهة
                }
            },

            /**
             * تسجيل مستخدم جديد
             */
            register: async (userData: RegisterRequest) => {
                try {
                set({ isLoading: true, error: null });

                    const response = await AuthAPI.register(userData);
                    const result = (await handleApiResponse(
                        response
                    )) as AuthResponse;

                    // تلقائيًا تسجيل الدخول بعد التسجيل الناجح إذا كان التوكن موجودًا
                    if (result.token) {
                        await AsyncStorage.setItem(
                            "USER_TOKEN",
                            result.data.token
                        );
                        set({
                            user: result.data,
                            token: result.token,
                            isLoading: false,
                        });
                    } else {
                        set({ isLoading: false });
                    }

                    // إعادة النتيجة للتمكين من استخدام .then()
                    return result;
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error:
                            error.message ||
                            "فشل في التسجيل. يرجى المحاولة مرة أخرى.",
                    });
                    throw error; // رمي الخطأ للتمكين من التقاطه في الواجهة
                }
            },

            /**
             * تسجيل الخروج
             */
            logout: async () => {
                try {
                    set({ isLoading: true, error: null });

                    // محاولة تسجيل الخروج من الخادم
                    try {
                        await AuthAPI.logout();
                    } catch (error) {
                        console.error(
                            "Error during logout from server:",
                            error
                        );
                        // حتى لو فشل تسجيل الخروج من الخادم، نريد مسح بيانات المستخدم محليًا
                    }

                    // مسح التوكن
                    await AsyncStorage.removeItem("USER_TOKEN");

                    set({
                        user: null,
                        token: null,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error:
                            error.message ||
                            "فشل في تسجيل الخروج. يرجى المحاولة مرة أخرى.",
                    });
                }
            },

            /**
             * تحديث الملف الشخصي
             */
            updateProfile: async (profileData: UpdateProfileRequest) => {
                try {
                set({ isLoading: true, error: null });

                    const response = await AuthAPI.updateProfile(profileData);
                    const result = (await handleApiResponse(
                        response
                    )) as AuthResponse;

                    // تحديث بيانات المستخدم محليًا
                    set({
                        user: result.user,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error:
                            error.message ||
                            "فشل في تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.",
                    });
                }
            },

            /**
             * تغيير كلمة المرور
             */
            changePassword: async (passwordData: PasswordChangeRequest) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await AuthAPI.changePassword(passwordData);
                    await handleApiResponse(response);

                    set({ isLoading: false });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error:
                            error.message ||
                            "فشل في تغيير كلمة المرور. يرجى المحاولة مرة أخرى.",
                    });
                }
            },

            /**
             * التحقق من حساب المستخدم
             */
            verifyUser: async (data: VerifyRequest) => {
                try {
                set({ isLoading: true, error: null });

                    const response = await AuthAPI.verified(data);
                    const result = await handleApiResponse(response);

                    // تحديث حالة المستخدم
                    if (result.data) {
                        set({
                            user: {
                                ...get().user,
                                is_email_verified: true,
                            } as User,
                            isLoading: false,
                        });
                    }

                    return result;
                } catch (error: any) {
                    let errorMessage = "فشل في التحقق من الحساب";

                    if (error.response?.data?.msg) {
                        errorMessage = error.response.data.msg;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    throw error;
                }
            },

            /**
             * إرسال رمز OTP
             */
            sendOtp: async (data: OtpRequest) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await AuthAPI.otpSend(data);
                    const result = await handleApiResponse(response);

                    set({ isLoading: false });
                    return result;
                } catch (error: any) {
                    let errorMessage = "فشل في إرسال رمز التحقق";

                    if (error.response?.data?.msg) {
                        errorMessage = error.response.data.msg;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    throw error;
                }
            },

            /**
             * التحقق من رمز OTP
             */
            verifyOtp: async (data: OtpRequest) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await AuthAPI.otpVerify(data);
                    const result = await handleApiResponse(response);

                    set({ isLoading: false });
                    return result;
                } catch (error: any) {
                    let errorMessage = "فشل في التحقق من الرمز";

                    if (error.response?.data?.msg) {
                        errorMessage = error.response.data.msg;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    throw error;
                }
            },

            /**
             * إعادة تعيين كلمة المرور
             */
            resetPassword: async (data: ResetPasswordRequest) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await AuthAPI.resetPassword(data);
                    const result = await handleApiResponse(response);

                    set({ isLoading: false });
                    return result;
                } catch (error: any) {
                    let errorMessage = "فشل في إعادة تعيين كلمة المرور";

                    if (error.response?.data?.msg) {
                        errorMessage = error.response.data.msg;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    set({
                        isLoading: false,
                        error: errorMessage,
                    });
                    throw error;
                }
            },
        }),
        {
            name: "auth-storage", // اسم مفتاح التخزين
            storage: createJSONStorage(() => AsyncStorage), // استخدام AsyncStorage
            // تخزين فقط بيانات المستخدم والتوكن
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),
        }
    )
);

// الدوال المساعدة للوصول إلى البيانات من المخزن
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.token);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
