import React, { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";

// This layout defines the nested navigation structure for the home tab
export default function HomeLayout() {
    const pathname = usePathname();
    const router = useRouter();

    // Redirect to index when navigating to just /home with no sub-path
    useEffect(() => {
        if (pathname === "/(tabs)/home") {
            router.replace("/(tabs)/home/index" as any);
        }
    }, [pathname]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="search" />
            <Stack.Screen name="notifications" />
        </Stack>
    );
}
