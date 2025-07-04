import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from "react-native";
import React from "react";
import { useAppLanguage } from "@/hooks/useLanguage";
import { useRouter } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { api } from "@/services/axios";

interface UserProfileProps {
    profile: {
        id?: number;
        full_name?: string;
        name?: string;
        username?: string;
        bio?: string;
        total_likes?: number;
        likes_count?: number;
        following_count?: number;
        followers_count?: number;
        videos_count?: number;
        is_following?: boolean;
        profile_image?: string;
    };
    isMyProfile?: boolean;
    onFollowToggle?: () => void;
    onMessagePress?: () => void;
    onSharePress?: () => void;
    onReportPress?: () => void;
    isFollowing?: boolean;
}

const UserData = ({
    profile,
    isMyProfile = true,
    onFollowToggle,
    onMessagePress,
    onSharePress,
    onReportPress,
    isFollowing = false,
}: UserProfileProps) => {
    const router = useRouter();
    const { t, isRTL } = useAppLanguage();

    // التنقل إلى إعدادات الحساب
    const goToAccountSettings = () => {
        router.push("/(tabs)/Profile/settings" as any);
    };

    // التنقل إلى قائمة المتابعين
    const goToFollowers = () => {
        router.push({
            pathname: "/(tabs)/Profile/followers" as any,
            params: { id: profile?.id, isMyProfile: isMyProfile as any },
        });
    };

    // التنقل إلى قائمة من يتابعهم
    const goToFollowing = () => {
        router.push({
            pathname: "/(tabs)/Profile/following" as any,
            params: { id: profile?.id, isMyProfile: isMyProfile as any },
        });
    };

    // دالة فتح الشات أو إنشائه
    const handleChatPress = async () => {
        try {
            if (!profile?.id) return;
            // استدعاء API لإنشاء أو جلب الشات
            const response = await api.get(`/chat/${profile.id}`);
            const data = response.data as any;
            // توقع أن الاستجابة فيها chat_id أو id
            const chatId = data?.id || data?.chat_id;
            if (chatId) {
                router.push({
                    pathname: "/(tabs)/messages/chat/[id]",
                    params: {
                        id: String(chatId),
                        user_name: profile?.full_name || profile?.name || "",
                        user_image:
                            profile?.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || profile?.name || "User")}&background=random`,
                        user_username: profile?.username || "",
                    },
                });
            } else {
                alert(
                    t("errors.chatOpenFailed") || "حدث خطأ أثناء فتح المحادثة"
                );
            }
        } catch (error) {
            console.error("Error opening chat:", error);
            alert(
                t("errors.chatOpenFailed") || "تعذر فتح المحادثة، حاول لاحقًا"
            );
        }
    };

    return (
        <View style={styles.userDataContainer}>
            <Text style={styles.name}>
                {profile?.full_name || profile?.name || ""}
            </Text>
            <Text style={styles.username}>@{profile?.username || ""}</Text>

            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <View
                style={
                    isRTL ? styles.arabicDataContainer : styles.dataContainer
                }
            >
                <TouchableOpacity style={styles.dataView}>
                    <Text style={styles.dataNumbers}>
                        {profile?.total_likes || profile?.likes_count || 0}
                    </Text>
                    <Text style={styles.dataText}>{t("profile.likes")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={goToFollowing}
                    style={styles.dataView}
                >
                    <Text style={styles.dataNumbers}>
                        {profile?.following_count || 0}
                    </Text>
                    <Text style={styles.dataText}>
                        {t("profile.following")}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={goToFollowers}
                    style={styles.dataView}
                >
                    <Text style={styles.dataNumbers}>
                        {profile?.followers_count || 0}
                    </Text>
                    <Text style={styles.dataText}>
                        {t("profile.followers")}
                    </Text>
                </TouchableOpacity>

                <View style={styles.dataView}>
                    <Text style={styles.dataNumbers}>
                        {profile?.videos_count || 0}
                    </Text>
                    <Text style={styles.dataText}>{t("profile.posts")}</Text>
                </View>
            </View>

            {isMyProfile ? (
                // أزرار للملف الشخصي الخاص بالمستخدم
                <TouchableOpacity
                    onPress={goToAccountSettings}
                    style={styles.editButton}
                    activeOpacity={0.8}
                >
                    <Text style={styles.editButtonText}>
                        {t("profile.editProfile")}
                    </Text>
                </TouchableOpacity>
            ) : (
                // أزرار للملف الشخصي لمستخدم آخر
                <View style={styles.profileActions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.followButton,
                            isFollowing ? styles.followingButton : null,
                        ]}
                        onPress={onFollowToggle}
                    >
                        <Text
                            style={[
                                styles.actionButtonText,
                                isFollowing ? styles.followingButtonText : null,
                            ]}
                        >
                            {isFollowing
                                ? t("common.following")
                                : t("common.follow")}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.otherButtonsContainer}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleChatPress}
                        >
                            <Ionicons
                                name="chatbubble-outline"
                                size={20}
                                color="#000"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onSharePress}
                        >
                            <Ionicons
                                name="share-social-outline"
                                size={20}
                                color="#000"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default UserData;

const styles = StyleSheet.create({
    userDataContainer: {
        alignItems: "center",
        paddingTop: 42,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    name: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 7,
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    username: {
        color: "#979797",
        fontSize: 14,
        fontWeight: "400",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    bio: {
        color: "#555",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 5,
        maxWidth: "85%",
        lineHeight: 20,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    dataContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 20,
        paddingHorizontal: 10,
    },
    arabicDataContainer: {
        width: "100%",
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 20,
        paddingHorizontal: 10,
    },
    dataView: {
        alignItems: "center",
    },
    dataNumbers: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    dataText: {
        color: "#616977",
        fontSize: 12,
        fontWeight: "400",
        marginTop: 2,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    editButton: {
        width: "85%",
        alignSelf: "center",
        height: 42,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        marginTop: 25,
        backgroundColor: "#f8f8f8",
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    profileActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 25,
        width: "100%",
    },
    otherButtonsContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        width: "30%",
    },
    actionButton: {
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
        width: "70%",
    },
    followButton: {
        backgroundColor: "#000",
        paddingHorizontal: 20,
    },
    followingButton: {
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#000",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    followingButtonText: {
        color: "#000",
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 8,
        backgroundColor: "#f8f8f8",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: "#eee",
    },
});
