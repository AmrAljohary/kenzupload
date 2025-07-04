import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import type { SettingsState } from "../types/store";

// تعريف القيم الافتراضية
const DEFAULT_LANGUAGE = "ar";
const DEFAULT_THEME = false; // false = وضع النهار، true = وضع الليل
const DEFAULT_FONT_SCALE = 1.0;
const DEFAULT_NOTIFICATIONS = true;

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            language: DEFAULT_LANGUAGE,
            isDarkMode: DEFAULT_THEME,
            fontScale: DEFAULT_FONT_SCALE,
            notificationsEnabled: DEFAULT_NOTIFICATIONS,

            setLanguage: (language) => {
                set({ language });
                // تغيير اتجاه التطبيق بناء على اللغة
                const isRTL = language === "ar";
                if (I18nManager.isRTL !== isRTL) {
                    I18nManager.allowRTL(isRTL);
                    I18nManager.forceRTL(isRTL);
                    // ملاحظة: يتطلب إعادة تشغيل التطبيق لتطبيق التغييرات
                }
            },

            toggleDarkMode: () => {
                set((state) => ({ isDarkMode: !state.isDarkMode }));
            },

            setFontScale: (scale) => {
                set({ fontScale: scale });
            },

            toggleNotifications: (enabled) => {
                set({ notificationsEnabled: enabled });
            },
        }),
        {
            name: "settings-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// استخدام Selectors للتحسين
export const useLanguage = () => useSettingsStore((state) => state.language);
export const useDarkMode = () => useSettingsStore((state) => state.isDarkMode);
export const useFontScale = () => useSettingsStore((state) => state.fontScale);
export const useNotifications = () =>
    useSettingsStore((state) => state.notificationsEnabled);
