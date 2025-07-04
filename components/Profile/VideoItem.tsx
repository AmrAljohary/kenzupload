import React, { useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Platform,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { I18nManager } from "react-native";
import { useRouter } from "expo-router";
import FastImage from "react-native-fast-image";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface VideoItemProps {
    video: {
        id: string | number;
        uniqueId?: string; // اضافة دعم للمعرف الفريد
        thumbnail?: string;
        url?: string;
        title?: string;
        user?: {
            name?: string;
            profile_image?: string;
        };
    };
    onPress?: (video: any) => void;
    isLoading?: boolean;
    isShowUserData?: boolean;
}

const VideoItem: React.FC<VideoItemProps> = ({
    video,
    onPress,
    isLoading = false,
    isShowUserData = true,
}) => {
    const router = useRouter();

    // تنظيف أي تفاعلات مع الفيديو عند إزالة المكون
    useEffect(() => {
        return () => {
            // تنظيف عند إزالة المكون
            // هذا يضمن أن أي موارد مرتبطة بهذا الفيديو يتم تحريرها
        };
    }, []);

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

    // استخدام FastImage بدلاً من Image لتحسين الأداء
    const renderThumbnail = () => {
        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#666" />
                </View>
            );
        }

        if (video.thumbnail) {
            return (
                <FastImage
                    source={{ uri: video.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode={FastImage.resizeMode.cover}
                />
            );
        }

        return <View style={styles.placeholder} />;
    };

    const renderUserImage = () => {
        if (!video.user?.profile_image) {
            return (
                <View style={styles.userImagePlaceholder}>
                    <Text style={styles.userInitial}>
                        {video.user?.name
                            ? video.user.name.charAt(0).toUpperCase()
                            : "U"}
                    </Text>
                </View>
            );
        }

        return (
            <FastImage
                source={{ uri: video.user.profile_image }}
                style={styles.userImage}
            />
        );
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={handlePress}
        >
            <View style={styles.imageWrapper}>
                {renderThumbnail()}
                {/* تدرج لوني أسفل الصورة */}
                {isShowUserData && (
                    <>
                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.7)"]}
                            style={styles.gradient}
                        />
                        <View style={styles.userInfoRow}>
                            {renderUserImage()}
                            <View style={styles.textInfo}>
                                <Text
                                    numberOfLines={1}
                                    style={styles.videoTitle}
                                >
                                    {video.title || "بدون عنوان"}
                                </Text>
                                <Text numberOfLines={1} style={styles.userName}>
                                    {video.user?.name || "مستخدم"}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
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
    loadingContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
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
