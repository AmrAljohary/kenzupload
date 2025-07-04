// تعريف أنواع بيانات المستخدم

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
    avatar?: string;
    followersCount: number;
    followingCount: number;
    createdAt: string;
    isVerified: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface OtpVerification {
    email: string;
    code: string;
}

export interface ResetPasswordData {
    email: string;
    newPassword: string;
    code: string;
}

export interface UpdateUserData {
    fullName?: string;
    bio?: string;
    avatar?: string;
    phone?: string;
}
