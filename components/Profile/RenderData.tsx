import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    Platform,
    ActivityIndicator,
    Animated,
    TouchableOpacity,
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useRouter } from "expo-router";
import VideoItem from "./VideoItem";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 48) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

// مكون VideoThumbnail المسؤول عن توليد thumbnail وعرض عنصر الفيديو
const VideoThumbnail = ({
    video,
    onPress,
    isShowUserData,
}: {
    video: any;
    onPress: (video: any) => void;
    isShowUserData: boolean;
}) => {
    const [thumbnail, setThumbnail] = useState<string | undefined>(
        video?.thumbnail
    );
    const [thumbnailLoading, setThumbnailLoading] = useState(!video?.thumbnail);

    // توليد thumbnail للفيديو إذا لم يكن موجوداً
    useEffect(() => {
        let isMounted = true;

        const generateThumbnail = async () => {
            if (!video?.url || thumbnail) return;

            try {
                setThumbnailLoading(true);
                const { uri } = await VideoThumbnails.getThumbnailAsync(
                    video.url,
                    {
                        time: 2000,
                    }
                );
                if (isMounted) {
                    setThumbnail(uri);
                    setThumbnailLoading(false);
                }
            } catch (error) {
                console.log("Error generating thumbnail:", error);
                setThumbnailLoading(false);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
        };
    }, [video?.url, thumbnail]);

    return (
        <VideoItem
            video={{ ...video, thumbnail }}
            onPress={onPress}
            isLoading={thumbnailLoading}
            isShowUserData={isShowUserData}
        />
    );
};

interface RenderDataProps {
    userVideo?: any[];
    headerTitle?: string;
    isLoading?: boolean;
    onEndReached?: () => void;
    hasMoreData?: boolean;
    isShowUserData?: boolean;
}

const RenderData = ({
    userVideo = [],
    headerTitle,
    isLoading = false,
    onEndReached,
    hasMoreData = false,
    isShowUserData = true,
}: RenderDataProps) => {
    const { t } = useAppLanguage();
    const router = useRouter();
    // Animation for empty state
    const emptyOpacity = React.useRef(new Animated.Value(0)).current;
    const emptyScale = React.useRef(new Animated.Value(0.8)).current;

    // ضمان أن userVideo دائماً مصفوفة
    const videos = Array.isArray(userVideo) ? userVideo : [];

    React.useEffect(() => {
        if (!isLoading && videos.length === 0) {
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
    }, [isLoading, videos.length]);

    const handleVideoPress = (video: any) => {
        // التنقل إلى صفحة الفيديو مع تمرير معرف الفيديو كمعامل
        router.push({
            pathname: "/(tabs)/home",
            params: { id: video.id },
        });
    };

    const handleRetry = () => {
        // إعادة تحميل البيانات بالصفحة الأولى
        if (onEndReached) onEndReached();
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
        if (isLoading) {
            return (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#333" />
                    <Text style={styles.loadingText}>
                        {t("common.loading") || "جاري التحميل..."}
                    </Text>
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
                        name="video-off-outline"
                        size={60}
                        color="#ddd"
                    />
                </View>
                <Text style={styles.emptyTitle}>
                    {t("search.noResults") || "لا توجد فيديوهات"}
                </Text>
                <Text style={styles.emptyText}>
                    {t("search.tryAgain") || "لا توجد فيديوهات في هذا القسم"}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                >
                    <Text style={styles.retryButtonText}>
                        {t("common.retry") || "إعادة المحاولة"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.emptyLine} />
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {headerTitle && (
                <Text style={styles.headerTitle}>{headerTitle}</Text>
            )}
            <FlatList
                data={videos}
                renderItem={({ item }) => (
                    <VideoThumbnail
                        video={item}
                        onPress={handleVideoPress}
                        isShowUserData={isShowUserData}
                    />
                )}
                keyExtractor={(item, index) =>
                    item?.uniqueId || `video-${item?.id || ""}-${index}`
                }
                numColumns={NUM_COLUMNS}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    videos.length === 0 && styles.emptyListContent,
                ]}
                columnWrapperStyle={
                    videos.length > 0 ? styles.columnWrapper : undefined
                }
                onEndReached={hasMoreData ? onEndReached : null}
                onEndReachedThreshold={0.2}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={4}
                initialNumToRender={4}
                windowSize={5}
            />
        </View>
    );
};

export default RenderData;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: "center",
    },
    columnWrapper: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    footerLoader: {
        padding: 20,
        alignItems: "center",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: "#666",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
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
    retryButton: {
        marginTop: 20,
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "#333",
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    emptyLine: {
        width: 40,
        height: 3,
        backgroundColor: "#333",
        marginTop: 20,
        borderRadius: 1.5,
    },
});
