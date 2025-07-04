// تعريف أنواع مخازن Zustand

import { User, LoginCredentials, RegisterData, UpdateUserData } from "./user";

// أنواع مخزن المصادقة
export interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // الوظائف
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    resetPassword: (email: string) => Promise<boolean>;
    updateUser: (userData: UpdateUserData) => void;
    clearError: () => void;
}

// أنواع مخزن الإعدادات
export interface SettingsState {
    language: "ar" | "en";
    isDarkMode: boolean;
    fontScale: number;
    notificationsEnabled: boolean;

    // الوظائف
    setLanguage: (language: "ar" | "en") => void;
    toggleDarkMode: () => void;
    setFontScale: (scale: number) => void;
    toggleNotifications: (enabled: boolean) => void;
}
