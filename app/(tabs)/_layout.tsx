import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Image, I18nManager } from "react-native";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5, AntDesign, Feather } from "@expo/vector-icons";
import { Text } from "../../components/ui/Text";
import { useAppLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { BlurView } from "expo-blur";
import Story from "../../assets/icons/svgs/Story";
import Home from "../../assets/icons/svgs/Home";
import Messages from "../../assets/icons/svgs/Messages";
import { Pressable } from "react-native";
import FastImage from 'react-native-fast-image'; // Added FastImage import
function TabBar({ state, descriptors, navigation }: any) {
    const { isRTL } = useAppLanguage();
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/main-login");
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading || !isAuthenticated || !user) {
        return null;
    }
    console.log("stareteyfvwe", state);
    return (
        <View
            style={[
                styles.tabBar,
                {
                    flexDirection: isRTL ? "row-reverse" : "row",
                    direction: I18nManager.isRTL ? "ltr" : "rtl",
                },
            ]}
        >
            {state.routes
                .filter((route: any) => route.name !== "index")
                .map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel || options.title || route.name;
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (isFocused) {
                            if (route.name === "Profile") {
                                router.replace("/(tabs)/Profile"); // Force re-navigation
                            }
                        } else if (!event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    if (route.name === "add") {
                        return (
                            <View key="add" style={styles.addButtonWrapper}>
                                <TouchableOpacity
                                    onPress={onPress}
                                    style={styles.addButton}
                                >
                                    <Ionicons
                                        name="add"
                                        size={32}
                                        color="#000"
                                    />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tab}
                        >
                            {options.tabBarIcon &&
                                options.tabBarIcon({
                                    focused: isFocused,
                                    color: isFocused ? "#fff" : "#8A8B8B",
                                    size: 24,
                                })}
                            <Text
                                style={[
                                    styles.label,
                                    isFocused && styles.labelFocused,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
        </View>
    );
}

export default function TabsLayout() {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();
    const { t } = useAppLanguage();

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (!isLoading && !isAuthenticated) {
            timeout = setTimeout(() => {
                router.replace("/main-login");
            }, 100);
        }
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [isLoading, isAuthenticated]);

    if (isLoading || !isAuthenticated || !user) {
        return null;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props: any) => (
                <TabBar
                    {...props}
                    style={{ display: "relative", overflow: "hidden" }}
                />
            )}
        >
            <Tabs.Screen
                name="home"
                options={{
                    tabBarLabel: t("navigation.home"),
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Home width={size} height={size} borderColor={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    tabBarLabel: t("navigation.chat"),
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Messages
                            width={size}
                            height={size}
                            borderColor={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    tabBarLabel: "",
                }}
            />
            <Tabs.Screen
                name="stories"
                options={{
                    tabBarLabel: t("navigation.stories"),
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Story width={size} height={size} borderColor={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="Profile"
                options={{
                    tabBarLabel: t("navigation.profile"),
                    tabBarIcon: ({
                        focused,
                        color,
                        size,
                    }: {
                        focused: boolean;
                        color: string;
                        size: number;
                    }) => {
                        console.log("Profile image URL:", user?.profile_image); // Log the image URL
                        // Use a test image for debugging
                        const testImageUrl = "https://picsum.photos/200/300";

                        if (user?.profile_image) {
                            return (
                                <View style={styles.profileIconContainer}>
                                    <FastImage
                                        source={{
                                            uri: user.profile_image, // Use the actual user image initially
                                            // uri: testImageUrl, // Uncomment this line to test with a known good image
                                        }}
                                        style={[
                                            styles.profileImage,
                                            focused &&
                                                styles.profileImageFocused,
                                        ]}
                                        resizeMode={FastImage.resizeMode.cover} // Use FastImage.resizeMode
                                        onError={() => console.log("FastImage loading error.")} // Updated onError to not expect an argument
                                    />
                                    {focused && (
                                        <View style={styles.activeIndicator} />
                                    )}
                                </View>
                            );
                        }
                        return (
                            <View style={styles.profilePlaceholderContainer}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={size}
                                    color={color}
                                />
                                <Text
                                    style={[
                                        styles.label,
                                        focused && styles.labelFocused,
                                        styles.addPhotoLabel,
                                    ]}
                                >
                                    {t("profile.addPhoto")}
                                </Text>
                            </View>
                        );
                    },
                    tabBarButton: (props) => {
                        return (
                            <Pressable
                                {...props}
                                onPress={() => {
                                    router.replace("/(tabs)/Profile"); // Force re-navigation
                                }}
                            />
                        );
                    },
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        alignItems: "center",
        justifyContent: "space-around",
        height: 80,
        paddingHorizontal: 10,
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
        backgroundColor: "#1D1F24",
        zIndex: 1,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 11,
        marginTop: 4,
        color: "#8A8B8B",
        fontFamily: "somar-medium",
    },
    labelFocused: {
        color: "#fff",
    },
    addButtonWrapper: {
        width: 70,
        height: 70,
        marginTop: -60,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    addButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    profileIconContainer: {
        width: 32, // Adjusted for slightly larger clickable area
        height: 32, // Adjusted for slightly larger clickable area
        marginBottom: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    profilePlaceholderContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
    },
    profileImage: {
        width: 28, // Make it slightly smaller than container to show border
        height: 28, // Make it slightly smaller than container to show border
        borderRadius: 14, // Half of width/height for perfect circle
        borderWidth: 2,
        borderColor: "#8A8B8B",
    },
    profileImageFocused: {
        borderColor: "#fff",
        transform: [{ scale: 1.1 }],
    },
    activeIndicator: {
        position: "absolute",
        bottom: -4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#fff",
    },
    addPhotoLabel: {
        fontSize: 10, // حجم أصغر للنص
        marginTop: 2, // مسافة صغيرة من الأيقونة
    },
});
