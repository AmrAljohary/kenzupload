import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Animated,
    I18nManager,
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import FastImage from "react-native-fast-image";
import { api } from "@/services/axios";

interface UsersListProps {
    users: any[];
    isLoading: boolean;
    onEndReached?: () => void;
    hasMoreData?: boolean;
}

const UsersList = ({
    users,
    isLoading,
    onEndReached,
    hasMoreData = false,
}: UsersListProps) => {
    const { t, isRTL } = useAppLanguage();
    const { user: currentUser } = useAuth();
    const [userList, setUserList] = useState<any[]>(users);

    const router = useRouter();
    const [loadingFollows, setLoadingFollows] = useState<
        Record<number, boolean>
    >({});
    // Animation for empty state
    const emptyOpacity = React.useRef(new Animated.Value(0)).current;
    const emptyScale = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (!isLoading && users.length === 0) {
            // Animate empty state appearance
            Animated.parallel([
                Animated.timing(emptyOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(emptyScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isLoading, users.length]);

    // مزامنة userList مع users عند تغيّر users من الأعلى
    React.useEffect(() => {
        setUserList(users);
    }, [users]);

    // الانتقال إلى الملف الشخصي
    const navigateToProfile = (userId: number) => {
        // إذا كان الملف الشخصي للمستخدم الحالي
        if (currentUser && userId === currentUser.id) {
            router.push("/(tabs)/Profile");
        } else {
            router.push({
                pathname: `/(tabs)/Profile`,
                params: { id: userId },
            });
        }
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

            // تحديث حالة المتابعة في قائمة المستخدمين
            setUserList((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === followerId
                        ? { ...user, is_following: !currentlyFollowing }
                        : user
                )
            );
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setLoadingFollows((prev) => ({ ...prev, [followerId]: false }));
        }
    };
    const renderUserItem = ({ item }: { item: any }) => {
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

    const renderFooter = () => {
        if (!isLoading) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#333" />
            </View>
        );
    };

    const renderEmptyList = () => {
        if (isLoading && users.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#333" />
                </View>
            );
        }

        return (
            <Animated.View
                style={[
                    styles.emptyContainer,
                    {
                        opacity: emptyOpacity,
                        transform: [{ scale: emptyScale }],
                    },
                ]}
            >
                <View style={styles.emptyIconContainer}>
                    <MaterialCommunityIcons
                        name="account-search-outline"
                        size={60}
                        color="#ddd"
                    />
                </View>
                <Text style={styles.emptyTitle}>{t("search.noResults")}</Text>
                <Text style={styles.emptyText}>{t("search.tryAgain")}</Text>
                <View style={styles.emptyLine} />
            </Animated.View>
        );
    };

    return (
        <FlatList
            data={userList}
            keyExtractor={(item, index) => `user-${item.id || index}`}
            renderItem={renderUserItem}
            contentContainerStyle={[
                styles.listContainer,
                userList.length === 0 && styles.emptyListContainer,
            ]}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMoreData ? onEndReached : null}
            onEndReachedThreshold={0.2}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyList}
        />
    );
};

export default UsersList;

export const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: "center",
    },
    userRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f1f1",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    userItem: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        marginVertical: 8,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    userNameContainer: {
        marginStart: 12,
        justifyContent: "center",
    },

    followingButton: {
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    userItemRTL: {
        flexDirection: "row",
    },
    userImageContainer: {
        position: "relative",
        marginRight: 16,
    },
    userImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#f0f0f0",
    },

    followingButtonText: {
        color: "#000",
    },
    userImagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
    },
    userInitial: {
        fontSize: 24,
        fontWeight: "600",
        color: "#888",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 2,
        borderWidth: 2,
        borderColor: "#fff",
    },
    userInfo: {
        flexDirection: "row-reverse",
        alignItems: "center",
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        color: "#333",
        fontFamily: "somar-bold",
    },
    userUsername: {
        fontSize: 14,
        color: "#888",
        marginBottom: 4,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    userBio: {
        fontSize: 14,
        color: "#666",
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
    followButtonContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    followButtonText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 18,
        color: "#333",
        marginTop: 10,
        fontWeight: "600",
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    emptyText: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    emptyLine: {
        width: 40,
        height: 3,
        backgroundColor: "#333",
        marginTop: 20,
        borderRadius: 1.5,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: "center",
    },
});
