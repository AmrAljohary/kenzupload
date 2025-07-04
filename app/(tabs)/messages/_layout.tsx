import React, { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { useAppLanguage } from "@/hooks/useLanguage";

// This layout defines the nested navigation structure for the messages tab
export default function MessagesLayout() {
    const pathname = usePathname();
    const router = useRouter();
    const { isRTL } = useAppLanguage();

    // Redirect to index when navigating to just /messages with no sub-path
    useEffect(() => {
        if (pathname === "/(tabs)/messages") {
            router.replace("/(tabs)/messages/index" as any);
        }
    }, [pathname]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="chat/[id]"
                options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    // إخفاء شريط التنقل السفلي في صفحة الدردشة
                    presentation: "modal",
                    // تعطيل الرجوع بالإيماءات لمنع المشاكل
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}
