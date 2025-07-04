import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
    RefreshControl,
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { api } from "@/services/axios";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import FastImage from "react-native-fast-image";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from "@react-navigation/native";

interface User {
    id: number;
    name: string;
    username: string;
    profile_image?: string;
    is_following: boolean;
}

interface ApiResponse {
    data: User[];
    status: number;
    message?: string;
}

const FollowingScreen = () => {
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();
    const { id, isMyProfile } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    console.log("Following screen params:", id, isMyProfile);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [followers, setFollowers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingFollows, setLoadingFollows] = useState<
        Record<number, boolean>
    >({});

    // جلب قائمة المتابعين
    const fetchFollowers = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);

            // استدعاء API بناءً على وجود معرف المستخدم
            const endpoint =
                isMyProfile === "true"
                    ? "users/following"
                    : `users/following/${id}/ar`;

            console.log("Fetching following from endpoint:", endpoint);
            const response = await api.get<ApiResponse>(endpoint);

            if (response.status === 200 && response.data?.data) {
                setFollowers(response.data.data);
            } else {
                setError(t("errors.loadingFailed"));
            }
        } catch (err) {
            console.error("Error fetching followers:", err);
            setError(t("errors.loadingFailed"));
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    };

    // تحديث البيانات
    const onRefresh = () => {
        setRefreshing(true);
        fetchFollowers(false);
    };

    // متابعة أو إلغاء متابعة مستخدم
    const toggleFollow = async (
        followerId: number,
        currentlyFollowing: boolean
    ) => {
        try {
            setLoadingFollows((prev) => ({ ...prev, [followerId]: true }));

            if (currentlyFollowing) {
                // إلغاء المتابعة
                await api.post(`users/${followerId}/unfollow`);
            } else {
                // متابعة
                await api.post(`users/${followerId}/follow`);
            }

            // تحديث حالة المتابعة في القائمة
            setFollowers((prevFollowers) =>
                prevFollowers.map((follower) =>
                    follower.id === followerId
                        ? { ...follower, is_following: !currentlyFollowing }
                        : follower
                )
            );
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setLoadingFollows((prev) => ({ ...prev, [followerId]: false }));
        }
    };

    // الانتقال إلى الملف الشخصي
    const navigateToProfile = (userId: number) => {
        // إذا كان الملف الشخصي للمستخدم الحالي
        if (currentUser && userId === currentUser.id) {
            router.push("/(tabs)/Profile");
        } else {
            router.push({
                pathname: "/(tabs)/Profile",
                params: { id: userId },
            });
        }
    };

    // استدعاء البيانات عند بدء العرض وعند الرجوع للصفحة
    useEffect(() => {
        fetchFollowers();
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchFollowers();
        }, [id])
    );

    // عنصر المتابِع
    const renderFollowerItem = ({ item }: { item: User }) => {
        const isFollowing = item.is_following;
        const isLoadingFollow = loadingFollows[item.id] || false;
        const isCurrentUser = currentUser && item.id === currentUser.id;

        return (
            <View style={styles.userRow}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => navigateToProfile(item.id)}
                >
                    <FastImage
                        source={{
                            uri:
                                item.profile_image ||
                                "https://via.placeholder.com/80",
                        }}
                        style={styles.userImage}
                    />
                    <View style={styles.userNameContainer}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userUsername}>
                            @{item.username}
                        </Text>
                    </View>
                </TouchableOpacity>

                {!isCurrentUser && (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            isFollowing ? styles.followingButton : null,
                        ]}
                        onPress={() => toggleFollow(item.id, isFollowing)}
                        disabled={isLoadingFollow}
                    >
                        {isLoadingFollow ? (
                            <ActivityIndicator
                                size="small"
                                color={isFollowing ? "#000" : "#fff"}
                            />
                        ) : (
                            <Text
                                style={[
                                    styles.followButtonText,
                                    isFollowing
                                        ? styles.followingButtonText
                                        : null,
                                ]}
                            >
                                {isFollowing
                                    ? t("common.following")
                                    : t("common.follow")}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerButton}
            >
                <Ionicons
                    name={isRTL ? "chevron-forward" : "chevron-back"}
                    size={22}
                    color="#000"
                />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
                <FontAwesome5
                    name="user-friends"
                    size={18}
                    color="#222"
                    style={{ marginEnd: 6 }}
                />
                <Text style={styles.headerTitle}>{t("profile.following")}</Text>
                <View style={styles.headerCountBadge}>
                    <Text style={styles.headerCountText}>
                        {followers.length}
                    </Text>
                </View>
            </View>
            <View style={{ width: 40 }} />
        </View>
    );
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            {renderHeader()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchFollowers()}
                    >
                        <Text style={styles.retryButtonText}>
                            {t("common.retry")}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : followers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {t("profile.noFollowing")}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={followers}
                    keyExtractor={(item) => `follower-${item.id}`}
                    renderItem={renderFollowerItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#000"]}
                            tintColor="#000"
                        />
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

export default FollowingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: Platform.OS === "ios" ? 8 : 0,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        backgroundColor: "#fff",
        zIndex: 10,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitleBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#222",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    headerCountBadge: {
        backgroundColor: "#f0f0f0",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginStart: 8,
    },
    headerCountText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#555",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginVertical: 10,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    retryButton: {
        backgroundColor: "#000",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    userRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f1f1",
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    userImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#f0f0f0",
    },
    userNameContainer: {
        marginStart: 12,
        justifyContent: "center",
    },
    userName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    userUsername: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: "#000",
        minWidth: 80,
        justifyContent: "center",
        alignItems: "center",
    },
    followingButton: {
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    followButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#fff",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    followingButtonText: {
        color: "#000",
    },
});
