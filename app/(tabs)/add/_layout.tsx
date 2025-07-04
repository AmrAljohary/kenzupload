import React, { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";

// This layout defines the nested navigation structure for the home tab
export default function AddLayout() {
    const pathname = usePathname();
    const router = useRouter();

    // Redirect to index when navigating to just /home with no sub-path
    useEffect(() => {
        if (pathname === "/(tabs)/add") {
            router.replace("/(tabs)/add/index" as any);
        }
    }, [pathname]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="upload" />
        </Stack>
    );
}
