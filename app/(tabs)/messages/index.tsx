import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Platform,
    FlatList,
    Dimensions,
    I18nManager,
    RefreshControl,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import FastImage from "react-native-fast-image";
import { useAppLanguage } from "@/hooks/useLanguage";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { api } from "@/services/axios";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Simple interface for chat data
interface ChatItem {
    id: number;
    userId: number;
    name: string;
    username: string;
    image: string;
    lastMessage: string;
    time: string;
    unreadCount: number;
    isVerified: boolean;
}

export default function MessagesScreen() {
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get("/user-chats");

            if (response.data && Array.isArray(response.data)) {
                console.log("response.data", response.data);
                const transformedChats: ChatItem[] = response.data.map(
                    (chat: any) => ({
                        id: chat.id || chat.chat_id,
                        userId: chat.user.id,
                        name: chat.user.name || chat.user.username || "مستخدم",
                        username: chat.user.username || "",
                        image:
                            chat.user.profile_image ||
                            "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(chat.user.name || "User"),
                        lastMessage: chat.last_message || "اضغط لبدء المحادثة",
                        time: chat.last_message_time
                            ? new Date(
                                  chat.last_message_time
                              ).toLocaleTimeString("ar-SA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : "",
                        unreadCount: 0,
                        isVerified: chat.user.type === "admin",
                    })
                );

                setChats(transformedChats);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const createOrGetChat = async (userId: number) => {
        try {
            const response = await api.get(`/chat/${userId}`);
            const chatData = response.data as { id?: number; chat_id?: number };
            return chatData;
        } catch (error) {
            console.error("Error creating/getting chat:", error);
            return null;
        }
    };

    const openChat = async (chat: ChatItem) => {
        try {
            if (chat.id) {
                router.push({
                    pathname: "/(tabs)/messages/chat/[id]",
                    params: {
                        id: String(chat.id),
                        user_name: chat.name,
                        user_image: chat.image,
                        user_username: chat.username,
                    },
                });
                return;
            }

            if (chat.userId) {
                const chatData = await createOrGetChat(chat.userId);
                if (chatData && (chatData.id || chatData.chat_id)) {
                    const chatId = chatData.id || chatData.chat_id;
                    router.push({
                        pathname: "/(tabs)/messages/chat/[id]",
                        params: {
                            id: String(chatId),
                            user_name: chat.name,
                            user_image: chat.image,
                            user_username: chat.username,
                        },
                    });
                }
            }
        } catch (error) {
            console.error("Error opening chat:", error);
        }
    };

    // Filter chats based on search query
    const filteredChats = chats.filter((chat) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        const name = chat.name?.toLowerCase() || "";
        return name.includes(query);
    });

    const renderChatItem = ({
        item,
        index,
    }: {
        item: ChatItem;
        index: number;
    }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50)}
            layout={Layout.springify()}
        >
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => openChat(item)}
                activeOpacity={0.7}
            >
                <FastImage source={{ uri: item.image }} style={styles.avatar} />

                <View style={styles.chatContent}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.isVerified && (
                            <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#007AFF"
                                style={styles.verifiedIcon}
                            />
                        )}
                        <Text style={styles.time}>{item.time}</Text>
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                </View>

                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                            {item.unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t("messages.title")}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t("messages.search")}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        textAlign={isRTL ? "right" : "left"}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.chatList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchChats(true)}
                        colors={["#000"]}
                        tintColor="#000"
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    title: {
        fontSize: 22,
        color: "#000",
        fontFamily: "somar-bold",
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 45,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#000",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    chatList: {
        paddingHorizontal: 16,
        gap: 10,
    },
    chatItem: {
        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#FBFBFB",
        borderBottomWidth: 0.4,
        borderColor: "#EAEAEA",
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: "#f0f0f0",
    },
    chatContent: {
        marginLeft: 12,
        direction: I18nManager.isRTL ? "ltr" : "ltr",
        flex: 1,
    },
    nameRow: {
        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginBottom: 4,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    time: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    lastMessage: {
        fontSize: 14,
        color: "#666",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    verifiedIcon: {
        marginLeft: 8,
    },
    unreadBadge: {
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        overflow: "hidden",
    },
    unreadText: {
        fontSize: 12,
        color: "#fff",
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
});
