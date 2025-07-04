import { api } from "../axios";
import {
    LoginRequest,
    RegisterRequest,
    VerifyRequest,
    PasswordChangeRequest,
    OtpRequest,
    UpdateProfileRequest,
    ResetPasswordRequest,
} from "../../types";

/**
 * تسجيل الدخول للمستخدم
 * @param credentials بيانات تسجيل الدخول (اسم المستخدم وكلمة المرور)
 */
const login = (credentials: LoginRequest) => {
    // إنشاء FormData لإرسال البيانات
    const formData = new FormData();

    // إضافة البيانات إلى FormData
    Object.entries(credentials).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });

    // إرسال الطلب باستخدام FormData
    return api.post("/login", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * تسجيل الخروج للمستخدم الحالي
 */
const logout = () => api.post("/logout");

/**
 * تسجيل مستخدم جديد
 * @param userData بيانات المستخدم الجديد
 */
const register = (userData: RegisterRequest) => {
    // إنشاء FormData لإرسال البيانات
    const formData = new FormData();

    // إضافة البيانات إلى FormData
    Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });

    // إرسال الطلب باستخدام FormData
    return api.post("/register", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * التحقق من حساب المستخدم
 * @param data بيانات التحقق
 */
const verified = (data: VerifyRequest) => api.post("/user/verified", data);

/**
 * تحديث الملف الشخصي للمستخدم
 * @param profileData بيانات الملف الشخصي المحدثة
 */
const updateProfile = (profileData: UpdateProfileRequest) =>
    api.post("/update-profile", profileData);

/**
 * تغيير كلمة مرور المستخدم
 * @param passwordData بيانات تغيير كلمة المرور (القديمة والجديدة)
 */
const changePassword = (passwordData: PasswordChangeRequest) =>
    api.post("/change-password", passwordData);

/**
 * إرسال رمز التحقق OTP
 * @param data بيانات طلب OTP (عادة البريد الإلكتروني)
 */
const otpSend = (data: OtpRequest) => api.post("/otp/send", data);

/**
 * التحقق من رمز OTP
 * @param data بيانات التحقق من OTP (الرمز والبريد الإلكتروني)
 */
const otpVerify = (data: OtpRequest) => api.post("/user/verified", data);

/**
 * إعادة تعيين كلمة المرور
 * @param data بيانات إعادة تعيين كلمة المرور
 */
const resetPassword = (data: ResetPasswordRequest) =>
    api.post("/password/reset", data);

const AuthAPI = {
    login,
    logout,
    register,
    verified,
    updateProfile,
    changePassword,
    otpSend,
    otpVerify,
    resetPassword,
};

export default AuthAPI;
