import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { I18nManager, Platform } from "react-native";
import { changeLanguage } from "../i18n/config";
import { useSettingsStore } from "../store/settings";
import * as Updates from "expo-updates";

export const useAppLanguage = () => {
    const { t, i18n } = useTranslation();
    const setLanguage = useSettingsStore((state) => state.setLanguage);
    const currentLanguage = useSettingsStore((state) => state.language);

    // For compatibility with components that expect 'language' instead of 'currentLanguage'
    const language = currentLanguage;

    // تحديد ما إذا كانت واجهة المستخدم يجب أن تكون RTL بناءً على اللغة الحالية
    const shouldBeRTL = currentLanguage === "ar";

    const switchLanguage = useCallback(
        async (lang: "ar" | "en") => {
            if (lang === currentLanguage) return;

            // تغيير اللغة في i18n
            const success = await changeLanguage(lang);

            if (success) {
                // تحديث مخزن الإعدادات
                setLanguage(lang);

                // تحديد ما إذا كان يجب تغيير RTL
                const shouldForceRTL = lang === "ar";

                // فحص ما إذا كان اتجاه التطبيق يحتاج للتغيير
                const isRTLChanged = shouldForceRTL !== I18nManager.isRTL;

                // تطبيق تغيير RTL إذا لزم الأمر
                if (isRTLChanged) {
                    console.log(`Changing RTL to: ${shouldForceRTL}`);
                    I18nManager.forceRTL(shouldForceRTL);

                    // إعادة تحميل التطبيق لتطبيق التغييرات
                    if (Platform.OS !== "web") {
                        try {
                            await Updates.reloadAsync();
                        } catch (error) {
                            console.log("Unable to reload app", error);
                        }
                    }
                }

                return { success: true, needsRestart: isRTLChanged };
            }

            return { success: false, needsRestart: false };
        },
        [currentLanguage, setLanguage]
    );

    // Added toggleLanguage function for compatibility with settings screen
    const toggleLanguage = useCallback(async () => {
        const newLang = currentLanguage === "ar" ? "en" : "ar";
        return await switchLanguage(newLang);
    }, [currentLanguage, switchLanguage]);

    return {
        t,
        currentLanguage,
        language, // Added for compatibility
        isRTL: shouldBeRTL, // استخدام القيمة المستندة إلى اللغة بدلاً من I18nManager.isRTL
        switchLanguage,
        toggleLanguage, // Added for compatibility
    };
};
