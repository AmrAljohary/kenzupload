import { Stack } from "expo-router";
import { Platform } from "react-native";
import { getStatusBarHeight } from "react-native-iphone-x-helper";

export default function StoryViewerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // Hide default header to use custom one
                contentStyle: {
                    paddingTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0, // Ensure content starts below status bar on iOS
                }
            }}
        >
            <Stack.Screen name="[id]" options={{}}
            />
        </Stack>
    );
}
