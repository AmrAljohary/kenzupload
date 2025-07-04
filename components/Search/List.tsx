import React from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const SPACING = 10;

interface ListProps {
    item: {
        title: string;
        videos: any[];
    };
}

const List = ({ item }: ListProps) => {
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();

    if (!item?.videos?.length) return null;

    const handleVideoPress = (video: any) => {
        // Navigate to video details
        console.log("Navigate to video:", video.id);
        // router.push(`/video/${video.id}`);
    };

    const renderItem = ({
        item: video,
        index,
    }: {
        item: any;
        index: number;
    }) => {
        return (
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => handleVideoPress(video)}
                activeOpacity={0.7}
            >
                <View style={styles.card}>
                    {video.thumbnail ? (
                        <Image
                            source={{ uri: video.thumbnail }}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <FontAwesome5
                                name="photo-video"
                                size={24}
                                color="#aaa"
                            />
                        </View>
                    )}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)"]}
                        style={styles.gradientOverlay}
                    />
                    <View style={styles.cardContent}>
                        <Text numberOfLines={1} style={styles.videoTitle}>
                            {video.title}
                        </Text>
                        {video.user && (
                            <Text numberOfLines={1} style={styles.userName}>
                                {video.user.name}
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => console.log(`See all ${item.title}`)}
                >
                    <Text style={styles.seeAllText}>
                        {t("content.categories.more")}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={item.videos.slice(0, 6)}
                keyExtractor={(item, index) => `${item.id || index}`}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    isRTL ? styles.listContentRTL : {},
                ]}
                snapToInterval={CARD_WIDTH + SPACING}
                decelerationRate="fast"
                initialNumToRender={3}
                maxToRenderPerBatch={6}
                windowSize={3}
                removeClippedSubviews={true}
            />
        </View>
    );
};

export default List;

export const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    seeAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        fontSize: 14,
        color: "#0984E3",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    listContent: {
        paddingHorizontal: 5,
        paddingBottom: 10,
    },
    listContentRTL: {
        flexDirection: "row-reverse",
    },
    cardContainer: {
        width: CARD_WIDTH,
        marginRight: SPACING,
        marginBottom: SPACING,
    },
    card: {
        height: CARD_HEIGHT,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    placeholderContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    gradientOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50%",
    },
    cardContent: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 4,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    userName: {
        fontSize: 12,
        color: "#f0f0f0",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
});
