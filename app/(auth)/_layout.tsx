import { Stack } from "expo-router";
import { View } from "react-native";
import React from "react";
import { useAppLanguage } from "../../hooks/useLanguage";

export default function AuthLayout() {
    const { isRTL } = useAppLanguage();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                // تعديل اتجاه الحركات الانتقالية حسب لغة التطبيق
                animation: isRTL ? "slide_from_left" : "slide_from_right",

            }}
            
        />
    );
}
