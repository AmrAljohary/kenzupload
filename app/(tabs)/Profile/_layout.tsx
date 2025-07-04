import React, { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { useAppLanguage } from "@/hooks/useLanguage";

// This layout defines the nested navigation structure for the home tab
export default function ProfileLayout() {
    const pathname = usePathname();
    const router = useRouter();
    const { isRTL } = useAppLanguage();

    // Redirect to index when navigating to just /home with no sub-path
    useEffect(() => {
        if (pathname === "/(tabs)/profile") {
            router.replace("/(tabs)/profile/index" as any);
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
            <Stack.Screen name="settings" />
            <Stack.Screen name="followers" />
            <Stack.Screen name="following" />
        </Stack>
    );
}
