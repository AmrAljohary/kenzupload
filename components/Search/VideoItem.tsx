import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { I18nManager } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface VideoItemProps {
    video: {
        id: string | number;
        thumbnail?: string;
        url?: string;
        title?: string;
        user?: {
            name?: string;
            profile_image?: string;
        };
    };
    onPress?: (video: any) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, onPress }) => {
    const router = useRouter();

    const handlePress = () => {
        if (onPress) {
            onPress(video);
        } else {
            // إذا لم يتم توفير onPress، استخدم التنقل الافتراضي إلى صفحة الفيديو
            router.push({
                pathname: "/(tabs)/home",
                params: { id: video.id },
            });
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={handlePress}
        >
            <View style={styles.imageWrapper}>
                {video.thumbnail ? (
                    <Image
                        source={{ uri: video.thumbnail }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholder} />
                )}
                {/* تدرج لوني أسفل الصورة */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.gradient}
                />
                {/* معلومات المستخدم في الأسفل */}
                <View style={styles.userInfoRow}>
                    {video.user?.profile_image ? (
                        <Image
                            source={{ uri: video.user.profile_image }}
                            style={styles.userImage}
                        />
                    ) : (
                        <View style={styles.userImagePlaceholder}>
                            <Text style={styles.userInitial}>
                                {video.user?.name
                                    ? video.user.name.charAt(0).toUpperCase()
                                    : "U"}
                            </Text>
                        </View>
                    )}
                    <View style={styles.textInfo}>
                        <Text numberOfLines={1} style={styles.videoTitle}>
                            {video.title || "بدون عنوان"}
                        </Text>
                        <Text numberOfLines={1} style={styles.userName}>
                            {video.user?.name || "مستخدم"}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default VideoItem;

const styles = StyleSheet.create({
    card: {
        width: ITEM_WIDTH,
        marginBottom: 16,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#f7f7f7",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    imageWrapper: {
        width: "100%",
        height: ITEM_HEIGHT,
        position: "relative",
        backgroundColor: "#eaeaea",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    placeholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#e0e0e0",
    },
    gradient: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },
    userInfoRow: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        zIndex: 2,
    },
    userImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "#fff",
        backgroundColor: "#fff",
        marginRight: 10,
    },
    userImagePlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    userInitial: {
        fontSize: 16,
        fontWeight: "700",
        color: "#888",
    },
    textInfo: {
        flex: 1,
        justifyContent: "center",
    },
    videoTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 2,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    userName: {
        fontSize: 13,
        color: "#eee",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
});
