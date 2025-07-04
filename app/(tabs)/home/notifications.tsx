import React from "react";
import {
    View,
    StyleSheet,
    Image,
    ScrollView,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useAppLanguage } from "@/hooks/useLanguage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Header from "@/components/ui/Header";

const { width } = Dimensions.get("window");

export default function NotificationsScreen() {
    const { t, isRTL } = useAppLanguage();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Logic to handle back navigation
    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Header title={t("notifications.title")} />
            </View>

            {/* Empty state content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.emptyStateContainer}>
                    <Image
                        source={require("@/assets/images/No notifications.png")}
                        style={styles.emptyStateImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.emptyStateTitle}>
                        {t("notifications.noNotifications")}
                    </Text>
                    <Text style={styles.emptyStateSubtitle}>
                        {t("notifications.noNotificationsMessage")}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        width: "100%",
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        paddingHorizontal: 20,
        marginTop: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: "somar-bold",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    rightSpacer: {
        width: 40,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 50,
    },
    emptyStateContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    emptyStateImage: {
        width: width * 0.7,
        height: width * 0.7,
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 22,
        marginBottom: 10,
        textAlign: "center",
        fontFamily: "somar-bold",
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginHorizontal: 20,
        fontFamily: "somar-regular",
    },
});
