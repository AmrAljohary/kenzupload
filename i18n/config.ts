import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import enTranslation from "./en.json";
import arTranslation from "./ar.json";

const LANGUAGE_STORAGE_KEY = "APP_LANGUAGE";

const resources = {
    en: {
        translation: enTranslation,
    },
    ar: {
        translation: arTranslation,
    },
};

const detectInitialLanguage = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        return savedLanguage || "ar"; // العربية كلغة افتراضية
    } catch (error) {
        console.error("خطأ في قراءة اللغة المحفوظة:", error);
        return "ar";
    }
};

export const initializeLanguage = async () => {
    const language = await detectInitialLanguage();

    // تهيئة i18n
    await i18n.use(initReactI18next).init({
        resources,
        lng: language,
        fallbackLng: "ar",
        interpolation: {
            escapeValue: false,
        },
        compatibilityJSON: "v3",
    });

    // ضبط اتجاه التطبيق
    setAppDirection(language);

    return language;
};

export const changeLanguage = async (language: "ar" | "en") => {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        await i18n.changeLanguage(language);
        setAppDirection(language);
        return true;
    } catch (error) {
        console.error("خطأ في تغيير اللغة:", error);
        return false;
    }
};

export const setAppDirection = (language: string) => {
    const isRTL = language === "ar";
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
    }
};

// Initialize i18n immediately to make it available for static imports
// but it will be properly initialized later
i18n.use(initReactI18next).init({
    resources,
    lng: "ar", // Default language until properly initialized
    fallbackLng: "ar",
    interpolation: {
        escapeValue: false,
    },
    compatibilityJSON: "v3",
});

export default i18n;
