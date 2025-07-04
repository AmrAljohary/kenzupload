import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Platform,
    FlatList,
    StatusBar,
    Dimensions,
    Alert,
    Modal,
    Pressable,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FastImage from "react-native-fast-image";
import { useAppLanguage } from "@/hooks/useLanguage";
import Animated, {
    FadeInDown,
    SlideInDown,
    Layout,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { api } from "@/services/axios";
import { useAuth } from "@/hooks/useAuth";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Message {
    id: number;
    message_id?: number;
    text?: string;
    message?: string;
    type?: "text" | "image" | "audio";
    uri?: string;
    file_url?: string;
    timestamp: string;
    created_at?: string;
    isSent: boolean;
    isRead: boolean;
    user_id?: number;
    sender?: any;
}

interface ReportType {
    id: number;
    name: string;
}

export default function ChatScreen() {
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();
    const { id, user_name, user_image, user_username } = useLocalSearchParams<{
        id: string;
        user_name?: string;
        user_image?: string;
        user_username?: string;
    }>();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(
        null
    );
    const [reportTypes, setReportTypes] = useState<ReportType[]>([
        { id: 1, name: "محتوى غير لائق" },
        { id: 2, name: "رسائل مزعجة" },
        { id: 3, name: "محتوى كاذب" },
        { id: 4, name: "تحرش" },
        { id: 5, name: "أخرى" },
    ]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { user } = useAuth(); // Get current user
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // استبدال USER الثابت ببيانات params
    const chatUser = {
        name: user_name || "محادثة جديدة",
        image: user_image || "https://ui-avatars.com/api/?name=User",
        username: user_username || "",
    };

    // تحميل الرسائل عند فتح الشاشة وبدء التحديث التلقائي
    useEffect(() => {
        console.log("=== CHAT COMPONENT MOUNTED ===");
        console.log("Route params:", {
            id,
            user_name,
            user_image,
            user_username,
        });

        if (id) {
            console.log("Valid chat ID found, loading messages...");
            loadMessages();

            // تحميل أنواع التقارير
            loadReportTypes();

            // بدء التحديث التلقائي كل ثانية
            startPolling();
        } else {
            console.error("No chat ID provided!");
        }

        return () => {
            console.log("=== CHAT COMPONENT UNMOUNTING ===");
            // إيقاف التحديث التلقائي عند إغلاق الشاشة
            stopPolling();
        };
    }, [id]);

    // بدء التحديث التلقائي
    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // تحديث الرسائل كل ثانية
        pollingIntervalRef.current = setInterval(() => {
            // تحديث صامت بدون عرض مؤشر التحميل
            loadMessages(true);
        }, 1000);
    };

    // إيقاف التحديث التلقائي
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    // تحميل أنواع التقارير من API
    const loadReportTypes = async () => {
        try {
            const response = await api.get("/report/type");
            const responseData = response.data as any;

            if (responseData && Array.isArray(responseData)) {
                setReportTypes(responseData);
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                setReportTypes(responseData.data);
            }
        } catch (error) {
            console.error("Error loading report types:", error);
            // استخدام القيم الافتراضية في حالة الفشل
        }
    };

    const loadMessages = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            console.log("=== LOADING MESSAGES ===");
            console.log("Chat ID:", id);
            console.log("Loading messages for chat:", id);

            const response = await api.get(`/messages/${id}`);
            console.log("=== MESSAGES API RESPONSE ===");
            console.log("Status:", response.status);
            console.log(
                "Response data:",
                JSON.stringify(response.data, null, 2)
            );

            // Handle different possible response structures
            let messagesData = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    messagesData = response.data;
                    console.log("Response is direct array");
                } else if (
                    (response.data as any).data &&
                    Array.isArray((response.data as any).data)
                ) {
                    messagesData = (response.data as any).data;
                    console.log("Response has data property with array");
                } else if (
                    (response.data as any).status === 200 &&
                    Array.isArray((response.data as any).data)
                ) {
                    messagesData = (response.data as any).data;
                    console.log("Response has status 200 with data array");
                } else {
                    console.log(
                        "Unknown response structure:",
                        typeof response.data
                    );
                }
            }

            console.log(
                "Messages data found:",
                messagesData.length,
                "messages"
            );

            if (messagesData.length > 0) {
                const apiMessages = messagesData.map(
                    (apiMsg: any, index: number) => {
                        console.log(`Message ${index}:`, apiMsg);

                        // Get the correct message ID
                        const messageId =
                            apiMsg.message_id ||
                            apiMsg.id ||
                            Date.now() + index;

                        // Determine if message is sent by current user
                        const currentUserId = user?.id || 0;
                        const senderId = apiMsg.sender?.id || apiMsg.user_id;
                        const isSentByCurrentUser = senderId === currentUserId;

                        return {
                            id: messageId,
                            text:
                                apiMsg.message || apiMsg.text || "رسالة فارغة",
                            message:
                                apiMsg.message || apiMsg.text || "رسالة فارغة",
                            type:
                                (apiMsg.type as "text" | "image" | "audio") ||
                                "text",
                            uri: apiMsg.file_url,
                            file_url: apiMsg.file_url,
                            timestamp: apiMsg.created_at
                                ? new Date(
                                      apiMsg.created_at
                                  ).toLocaleTimeString("ar-SA", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : new Date().toLocaleTimeString("ar-SA", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  }),
                            created_at: apiMsg.created_at,
                            isSent: isSentByCurrentUser,
                            isRead: true,
                            user_id: senderId,
                            sender: apiMsg.sender, // Keep sender info for profile pictures
                        };
                    }
                );

                setMessages(apiMessages.reverse()); // Newest first for inverted FlatList
                console.log(
                    "Successfully loaded",
                    apiMessages.length,
                    "messages"
                );
                console.log("First message structure:", apiMessages[0]);
            } else {
                console.log("No messages found - setting empty array");
                setMessages([]);
            }
        } catch (error: any) {
            console.error("=== ERROR LOADING MESSAGES ===");
            console.error("Error:", error);
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);

            // Don't show error to user, just keep empty messages
            setMessages([]);
        } finally {
            if (!silent) {
                setLoading(false);
            }
            console.log("=== FINISHED LOADING MESSAGES ===");
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) {
            console.log("Message is empty, not sending");
            return;
        }

        const messageText = message.trim();
        const tempId = Date.now();

        console.log("=== SENDING MESSAGE ===");
        console.log("Chat ID:", id);
        console.log("Message text:", messageText);
        console.log("Temp ID:", tempId);
        //reciver id
        const reciverId = id;
        console.log("Reciver ID:", reciverId);

        const tempMessage: Message = {
            id: tempId,
            text: messageText,
            message: messageText,
            type: "text",
            timestamp: new Date().toLocaleTimeString("ar-SA", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isSent: true,
            isRead: false,
            user_id: user?.id || 0,
        };

        // Add message optimistically to UI
        setMessages((prev) => [tempMessage, ...prev]);
        setMessage(""); // Clear input immediately
        console.log("Added optimistic message to UI");

        try {
            console.log(
                "Sending message to chat:",
                id,
                "Message:",
                messageText
            );

            // Try different API call formats
            let response;

            // Method 1: FormData
            const formData = new FormData();
            formData.append("message", messageText);
            formData.append("type", "text");

            console.log("Trying FormData method...");

            try {
                response = await api.post(`/messages/${id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                console.log("FormData method succeeded!");
            } catch (formError: any) {
                console.log("FormData method failed, trying JSON method");
                console.log(
                    "FormData error:",
                    formError.response?.data || formError.message
                );

                // Method 2: JSON
                console.log("Trying JSON method...");
                response = await api.post(
                    `/messages/${id}`,
                    {
                        message: messageText,
                        type: "text",
                    },
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );
                console.log("JSON method succeeded!");
            }

            console.log("=== SEND MESSAGE RESPONSE ===");
            console.log("Status:", response.status);
            console.log(
                "Response data:",
                JSON.stringify(response.data, null, 2)
            );

            // Update the temporary message as sent successfully
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId
                        ? {
                              ...msg,
                              isRead: true,
                              id: (response.data as any)?.id || tempId, // Use API ID if available
                              created_at:
                                  (response.data as any)?.created_at ||
                                  new Date().toISOString(),
                          }
                        : msg
                )
            );

            console.log("Message sent successfully and UI updated");
        } catch (error: any) {
            console.error("=== ERROR SENDING MESSAGE ===");
            console.error("Error:", error);
            console.error("Error message:", error.message);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);

            // Remove the failed message from UI
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

            // Restore the message in input
            setMessage(messageText);

            Alert.alert("خطأ", "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.");
            console.log("Removed failed message from UI and restored input");
        }

        console.log("=== FINISHED SENDING MESSAGE ===");
    };

    const handleLongPress = (messageItem: Message) => {
        if (!messageItem.isSent) {
            setSelectedMessage(messageItem);
            setShowReportModal(true);
        }
    };

    const handleReportMessage = async (reportTypeId: number) => {
        if (!selectedMessage) return;

        try {
            await api.post("/message-reports", {
                report_type_id: reportTypeId,
                message_id: selectedMessage.id,
            });

            Alert.alert(
                t("common.success") || "تم",
                t("messages.reportSuccess") || "تم الإبلاغ عن الرسالة بنجاح"
            );
            setShowReportModal(false);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error reporting message:", error);
            Alert.alert(
                t("common.error") || "خطأ",
                t("messages.reportError") || "فشل في الإبلاغ عن الرسالة"
            );
        }
    };

    const handleRefresh = async () => {
        console.log("=== MANUAL REFRESH TRIGGERED ===");
        setRefreshing(true);
        try {
            await loadMessages();
            console.log("Manual refresh completed successfully");
        } catch (error) {
            console.error("Manual refresh failed:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const testApiConnection = async () => {
        try {
            console.log("=== TESTING API CONNECTION ===");

            // Test basic API connection
            const testResponse = await api.get("/");
            console.log("Basic API test response:", testResponse.status);

            // Test messages endpoint specifically
            console.log("Testing messages endpoint for chat:", id);
            const messagesResponse = await api.get(`/messages/${id}`);
            console.log(
                "Messages endpoint test - Status:",
                messagesResponse.status
            );
            console.log(
                "Messages endpoint test - Data type:",
                typeof messagesResponse.data
            );
            console.log(
                "Messages endpoint test - Is array:",
                Array.isArray(messagesResponse.data)
            );

            Alert.alert("اختبار الاتصال", "تم اختبار الاتصال بنجاح");
        } catch (error: any) {
            console.error("=== API CONNECTION TEST FAILED ===");
            console.error("Error:", error.message);
            console.error("Status:", error.response?.status);
            console.error("Response:", error.response?.data);

            Alert.alert(
                "خطأ في الاتصال",
                `فشل الاتصال بالخادم: ${error.message}`
            );
        }
    };

    const renderMessage = ({
        item,
        index,
    }: {
        item: Message;
        index: number;
    }) => {
        // Get avatar URL from sender info or use fallback
        const senderAvatar =
            item.sender?.profile_image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(item.sender?.name || "User")}&background=random`;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50)}
                layout={Layout.springify()}
                style={styles.messageWrapper}
            >
                <View
                    style={[
                        styles.messageRow,
                        item.isSent ? styles.sentRow : styles.receivedRow,
                    ]}
                >
                    {!item.isSent && (
                        <FastImage
                            source={{
                                uri: senderAvatar,
                                priority: FastImage.priority.normal,
                            }}
                            style={styles.avatar}
                            defaultSource={require("../../../../assets/images/default-avatar.png")}
                        />
                    )}

                    <TouchableOpacity
                        onLongPress={() => handleLongPress(item)}
                        style={[
                            styles.messageBubble,
                            item.isSent
                                ? styles.sentBubble
                                : styles.receivedBubble,
                        ]}
                    >
                        {item.type === "text" && (
                            <Text
                                style={[
                                    styles.messageText,
                                    item.isSent
                                        ? styles.sentText
                                        : styles.receivedText,
                                ]}
                            >
                                {item.text || item.message || "رسالة فارغة"}
                            </Text>
                        )}

                        {item.type === "image" && item.uri && (
                            <FastImage
                                source={{ uri: item.uri }}
                                style={styles.imageMessage}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        )}

                        <Text style={styles.messageTime}>{item.timestamp}</Text>
                    </TouchableOpacity>

                    {item.isSent && (
                        <Text style={styles.readStatus}>
                            {item.isRead ? "✓✓" : "✓"}
                        </Text>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name={isRTL ? "chevron-forward" : "chevron-back"}
                        size={24}
                        color="#333"
                    />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <FastImage
                        source={{ uri: chatUser.image }}
                        style={styles.headerAvatar}
                        defaultSource={require("../../../../assets/images/default-avatar.png")}
                    />
                    <View>
                        <Text style={styles.headerTitle}>{chatUser.name}</Text>
                        {chatUser.username ? (
                            <Text style={styles.headerUsername}>
                                @{chatUser.username}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => {
                    // Safely handle ID conversion to string
                    const id = item.id || item.message_id || `message-${index}`;
                    return String(id);
                }}
                contentContainerStyle={styles.messagesList}
                inverted
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={t("messages.typeMessage") || "اكتب رسالة..."}
                    placeholderTextColor="#999"
                    multiline
                    textAlign={isRTL ? "right" : "left"}
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color="#fff"
                        style={{ transform: [{ scaleX: isRTL ? 1 : -1 }] }}
                    />
                </TouchableOpacity>
            </View>

            {/* Report Modal */}
            <Modal
                visible={showReportModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReportModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowReportModal(false)}
                >
                    <Animated.View
                        entering={SlideInDown}
                        style={styles.reportModal}
                    >
                        <View style={styles.reportHeader}>
                            <Text style={styles.reportTitle}>
                                {t("messages.reportMessage") ||
                                    "الإبلاغ عن الرسالة"}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowReportModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.reportDescription}>
                            {t("messages.selectReportReason") ||
                                "اختر سبب الإبلاغ عن هذه الرسالة:"}
                        </Text>

                        {reportTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={styles.reportOption}
                                onPress={() => handleReportMessage(type.id)}
                            >
                                <Text style={styles.reportOptionText}>
                                    {type.name}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowReportModal(false)}
                        >
                            <Text style={styles.cancelText}>
                                {t("common.cancel") || "إلغاء"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 0.5,
        borderBottomColor: "#e0e0e0",
        marginTop: 40,
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginLeft: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
    },
    headerUsername: {
        fontSize: 13,
        color: "#888",
        marginTop: 2,
    },
    menuButton: {
        padding: 8,
    },
    debugButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    debugButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    messagesList: {
        padding: 16,
        gap: 8,
    },
    messageWrapper: {
        marginVertical: 4,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginVertical: 2,
    },
    sentRow: {
        justifyContent: "flex-end",
    },
    receivedRow: {
        justifyContent: "flex-start",
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: SCREEN_WIDTH * 0.75,
        padding: 12,
        borderRadius: 16,
    },
    sentBubble: {
        backgroundColor: "#000",
        marginLeft: 50,
    },
    receivedBubble: {
        backgroundColor: "#f0f0f0",
        marginRight: 50,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    sentText: {
        color: "#fff",
    },
    receivedText: {
        color: "#000",
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },
    imageMessage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 8,
    },
    messageTime: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
        textAlign: "right",
    },
    messageFooter: {
        marginTop: 4,
        marginBottom: 8,
    },
    sentFooter: {
        alignItems: "flex-end",
        marginRight: 16,
    },
    receivedFooter: {
        alignItems: "flex-start",
        marginLeft: 48,
    },
    timestamp: {
        fontSize: 12,
        color: "#999",
    },
    readStatus: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#fff",
        borderTopWidth: 0.5,
        borderTopColor: "#e0e0e0",
    },
    input: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    reportModal: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "70%",
    },
    reportHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
    },
    reportDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
        lineHeight: 20,
    },
    reportOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: "#e0e0e0",
    },
    reportOptionText: {
        fontSize: 16,
        color: "#111",
    },
    cancelButton: {
        backgroundColor: "#f44336",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
