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
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import VideoItem from "./VideoItem";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - 48) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

// مكون VideoThumbnail المسؤول عن توليد thumbnail وعرض عنصر الفيديو
const VideoThumbnail = ({
    video,
    onPress,
}: {
    video: any;
    onPress: (video: any) => void;
}) => {
    const [thumbnail, setThumbnail] = useState<string | undefined>(
        video.thumbnail
    );

    // توليد thumbnail للفيديو إذا لم يكن موجوداً
    useEffect(() => {
        let isMounted = true;

        const generateThumbnail = async () => {
            if (!video.url || thumbnail) return;

            try {
                const { uri } = await VideoThumbnails.getThumbnailAsync(
                    video.url,
                    {
                        time: 2000,
                    }
                );
                if (isMounted) setThumbnail(uri);
            } catch (error) {
                console.log("Error generating thumbnail:", error);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
        };
    }, [video.url, thumbnail]);

    return <VideoItem video={{ ...video, thumbnail }} onPress={onPress} />;
};

interface RenderDataProps {
    userVideo: any[];
    headerTitle?: string;
    isLoading?: boolean;
    onEndReached?: () => void;
    hasMoreData?: boolean;
}

const RenderData = ({
    userVideo,
    headerTitle,
    isLoading = false,
    onEndReached,
    hasMoreData = false,
}: RenderDataProps) => {
    const { t } = useAppLanguage();
    const router = useRouter();
    // Animation for empty state
    const emptyOpacity = React.useRef(new Animated.Value(0)).current;
    const emptyScale = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (!isLoading && userVideo.length === 0) {
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
    }, [isLoading, userVideo.length]);

    const handleVideoPress = (video: any) => {
        // التنقل إلى صفحة الفيديو مع تمرير معرف الفيديو كمعامل
        router.push({
            pathname: "/(tabs)/home",
            params: { id: video.id },
        });
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
        if (isLoading) return null;
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
                <Text style={styles.emptyTitle}>{t("search.noResults")}</Text>
                <Text style={styles.emptyText}>{t("search.tryAgain")}</Text>
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
                data={userVideo}
                renderItem={({ item }) => (
                    <VideoThumbnail video={item} onPress={handleVideoPress} />
                )}
                keyExtractor={(item, index) => `video-${item.id || index}`}
                numColumns={NUM_COLUMNS}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    userVideo.length === 0 && styles.emptyListContent,
                ]}
                columnWrapperStyle={
                    userVideo.length > 0 ? styles.columnWrapper : undefined
                }
                onEndReached={hasMoreData ? onEndReached : null}
                onEndReachedThreshold={0.2}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyList}
            />
        </View>
    );
};

export default RenderData;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingHorizontal: 16,
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
});
