/**
 * واجهة بيانات تسجيل الدخول
 */
export interface LoginRequest {
    login: string; // اسم المستخدم أو البريد الإلكتروني
    password: string; // كلمة المرور
}

/**
 * واجهة بيانات التسجيل
 */
export interface RegisterRequest {
    username: string; // اسم المستخدم
    name: string; // الاسم الكامل
    email: string; // البريد الإلكتروني
    password: string; // كلمة المرور
    password_confirmation: string; // تأكيد كلمة المرور
    phone_number: string; // رقم الهاتف
    country_code: string; // رمز الدولة (مثل +966)
}

/**
 * واجهة بيانات التحقق من الحساب
 */
export interface VerifyRequest {
    login: string; // البريد الإلكتروني
    code: string; // رمز التحقق
}

/**
 * واجهة بيانات تحديث الملف الشخصي
 */
export interface UpdateProfileRequest {
    name?: string; // الاسم
    email?: string; // البريد الإلكتروني
    phone_number?: string; // رقم الهاتف
    country_code?: string; // رمز الدولة
    username?: string; // اسم المستخدم
    bio?: string; // نبذة عن المستخدم
    profile_image?: any; // صورة الملف الشخصي (يمكن أن تكون ملف)
}

/**
 * واجهة بيانات تغيير كلمة المرور
 */
export interface PasswordChangeRequest {
    current_password: string; // كلمة المرور الحالية
    new_password: string; // كلمة المرور الجديدة
    new_password_confirmation: string; // تأكيد كلمة المرور الجديدة
}

/**
 * واجهة بيانات طلب أو التحقق من OTP
 */
export interface OtpRequest {
    email: string; // البريد الإلكتروني
    code?: string; // رمز التحقق (اختياري في طلب الإرسال)
}

/**
 * واجهة بيانات إعادة تعيين كلمة المرور
 */
export interface ResetPasswordRequest {
    email: string; // البريد الإلكتروني
    code: string; // رمز التحقق
    password: string; // كلمة المرور الجديدة
    password_confirmation: string; // تأكيد كلمة المرور الجديدة
}

/**
 * واجهة بيانات المستخدم
 */
export interface User {
    id: number; // معرف المستخدم
    name: string; // اسم المستخدم الكامل
    username: string; // اسم المستخدم للتسجيل
    email: string; // البريد الإلكتروني
    phone_number: string; // رقم الهاتف
    country_code: string; // رمز الدولة
    bio?: string; // نبذة عن المستخدم
    profile_image?: string; // رابط صورة الملف الشخصي
    is_verified: boolean; // هل الحساب موثق
    token: string;
    is_email_verified: boolean; // هل البريد الإلكتروني موثق
}

/**
 * واجهة استجابة المصادقة
 */
export interface AuthResponse {
    data: User; // بيانات المستخدم
    token: string; // توكن المصادقة
    status: boolean; // حالة الطلب
    message: string; // رسالة من الخادم
}
