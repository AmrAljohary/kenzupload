import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Switch,
    Platform,
    StatusBar,
    I18nManager,
    Image,
    ActivityIndicator,
    Alert,
    ScrollView,
    Dimensions,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useTranslation } from "react-i18next";
import { api } from "@/services/axios";
import { Notification } from "@/components/ui/Notification";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeInDown,
    FadeInUp,
    SlideInRight,
} from "react-native-reanimated";
import { BlurView } from "expo-blur"; // Import BlurView

const { width, height } = Dimensions.get("window");

export default function UploadScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isRTL = I18nManager.isRTL;
    const { videoUri, contentType, duration } = useLocalSearchParams();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [allowDownload, setAllowDownload] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [notif, setNotif] = useState({
        visible: false,
        type: "success",
        mainText: "",
        subText: "",
    });

    // Check if this is a story upload
    const isStoryUpload = contentType === "story";

    useEffect(() => {
        if (videoUri) {
            generateThumbnail();
        }
    }, [videoUri]);

    const generateThumbnail = async () => {
        try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(
                typeof videoUri === "string" ? videoUri : videoUri[0],
                { time: 1000 }
            );
            setThumbnail(uri);
        } catch (e) {
            setThumbnail(null);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        // For stories, title is not required
        if (!videoUri || (!isStoryUpload && !title.trim())) {
            setNotif({
                visible: true,
                type: "error",
                mainText: t("addContent.uploadErrorTitle"),
                subText: t("addContent.uploadErrorMsg"),
            });
            return;
        }
        setUploading(true);
        setProgress(0);
        try {
            const formData = new FormData();

            if (isStoryUpload) {
                // Story upload to /stories endpoint
                formData.append("content", {
                    uri: typeof videoUri === "string" ? videoUri : videoUri[0],
                    name: "story.mp4",
                    type: "video/mp4",
                } as any);
                formData.append("type", "video");
                formData.append(
                    "video_duration",
                    typeof duration === "string" ? duration : "30"
                );
                formData.append("visibility", "public");

                const response = await api.post("/stories", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent: any) => {
                        if (progressEvent.total) {
                            setProgress(
                                progressEvent.loaded / progressEvent.total
                            );
                        }
                    },
                });

                console.log("Story upload response:", response);

                setNotif({
                    visible: true,
                    type: "success",
                    mainText: t("stories.uploadSuccessTitle"),
                    subText: t("stories.uploadSuccessMsg"),
                });

                setTimeout(() => {
                    router.replace({
                        pathname: "/(tabs)/stories",
                        params: {
                            uploadedStory: "1",
                        },
                    });
                }, 1200);
            } else {
                // Regular video upload to /videos/upload endpoint
                formData.append("video", {
                    uri: typeof videoUri === "string" ? videoUri : videoUri[0],
                    name: "video.mp4",
                    type: "video/mp4",
                } as any);
                formData.append("title", title);
                formData.append("description", description);

                const response = await api.post("/videos/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent: any) => {
                        if (progressEvent.total) {
                            setProgress(
                                progressEvent.loaded / progressEvent.total
                            );
                        }
                    },
                });

                let videoId = null;
                console.log("Video upload response:", response);
                if (response?.data && typeof response.data === "object") {
                    if ("id" in response.data && response.data.id) {
                        videoId = response.data.id;
                    } else if (
                        "data" in response.data &&
                        response.data.data &&
                        typeof response.data.data === "object" &&
                        "id" in response.data.data
                    ) {
                        videoId = response.data.data.id;
                    }
                }

                setNotif({
                    visible: true,
                    type: "success",
                    mainText: t("addContent.uploadSuccessTitle"),
                    subText: t("addContent.uploadSuccessMsg"),
                });

                setTimeout(() => {
                    router.replace({
                        pathname: "/(tabs)/home",
                        params: {
                            id: videoId ? String(videoId) : undefined,
                            uploadedVideo: "1",
                        },
                    });
                }, 1200);
            }
        } catch (e) {
            console.error("Upload error:", e);
            setNotif({
                visible: true,
                type: "error",
                mainText: t("addContent.uploadErrorTitle"),
                subText: t("addContent.uploadErrorMsg"),
            });
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    if (isStoryUpload) {
        return (
            <View style={styles.storyContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />

                {/* Background Video */}
                {videoUri && (
                    <Video
                        source={{
                            uri:
                                typeof videoUri === "string"
                                    ? videoUri
                                    : videoUri[0],
                        }}
                        style={styles.backgroundVideo}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                    />
                )}

                {/* Dark Overlay */}
                <View style={styles.darkOverlay} />

                {/* Header */}
                <Animated.View
                    entering={FadeInDown.delay(200)}
                    style={styles.storyHeader}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.storyHeaderTitle}>
                        {t("stories.uploadTitle")}
                    </Text>
                    <View style={styles.headerSpacer} />
                </Animated.View>


                {/* Upload Button */}
                <Animated.View
                    entering={SlideInRight.delay(600)}
                    style={styles.storyButtonContainer}
                >
                    {uploading ? (
                        <View style={styles.storyProgressContainer}>
                            <View // Changed from LinearGradient
                                style={styles.storyProgressCard} // Retain existing style
                            >
                                <View style={styles.progressHeader}>
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff" />
                                    <Text style={styles.progressTitle}>
                                        {t("stories.uploading")}
                                    </Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBg}>
                                        <Animated.View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${Math.round(progress * 100)}%`,
                                                    backgroundColor: "#0984E3" // Changed to accent blue
                                                },
                                            ]} />
                                    </View>
                                    <Text style={styles.progressPercentage}>
                                        {Math.round(progress * 100)}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.storyPublishButton}
                            onPress={handleShare}
                            disabled={loading}
                        >
                            <View // Changed from LinearGradient
                                style={styles.publishButtonGradient} // Retain existing style
                            >
                                <Ionicons
                                    name="cloud-upload-outline" size={24}
                                    color="#fff" />
                                <Text style={styles.publishButtonText}>
                                    {t("stories.publishStory")}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Notification */}
                <Notification
                    visible={notif.visible}
                    type={notif.type as any}
                    mainText={notif.mainText}
                    subText={notif.subText}
                    onClose={() => setNotif({ ...notif, visible: false })}
                />
            </View>
        );
    }

    // Regular video upload UI (existing code)
    const renderHeader = () => (
        <View style={styles.header}>
            {isRTL ? (
                <>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color="#000"
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t("addContent.uploadTitle")}
                    </Text>
                    <View style={{ width: 24 }} />
                </>
            ) : (
                <>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t("addContent.uploadTitle")}
                    </Text>
                    <View style={{ width: 24 }} />
                </>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}

            {/* حقل العنوان */}
            <View style={styles.titleContainer}>
                <TextInput
                    style={styles.titleInput}
                    placeholder={t("addContent.titlePlaceholder")}
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    textAlign={isRTL ? "right" : "left"}
                />
            </View>

            {/* معاينة الفيديو والصورة */}
            <View style={styles.previewRow}>
                <View style={styles.descriptionContainer}>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder={t("addContent.descriptionPlaceholder")}
                        placeholderTextColor="#999"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        textAlign={isRTL ? "right" : "left"}
                    />
                </View>
                <View style={styles.thumbnailContainer}>
                    {thumbnail ? (
                        <Image
                            source={{ uri: thumbnail }}
                            style={styles.thumbnail}
                        />
                    ) : (
                        <View style={styles.thumbnailPlaceholder} />
                    )}
                </View>
            </View>

            {/* إعدادات */}
            <View style={styles.settingsContainer}>
                <View style={styles.settingItem}>
                    <Ionicons
                        name="lock-closed"
                        size={22}
                        color="#000"
                        style={{ marginHorizontal: 8 }}
                    />
                    <Text style={styles.settingText}>
                        {t("addContent.public")}
                    </Text>
                </View>
                <View style={styles.settingItem}>
                    <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={22}
                        color="#000"
                        style={{ marginHorizontal: 8 }}
                    />
                    <Text style={styles.settingText}>
                        {t("addContent.allowComments")}
                    </Text>
                    <Switch
                        value={allowComments}
                        onValueChange={setAllowComments}
                        trackColor={{ false: "#eee", true: "#000" }}
                        thumbColor="#fff"
                    />
                </View>
                <View style={styles.settingItem}>
                    <Ionicons
                        name="people-outline"
                        size={22}
                        color="#000"
                        style={{ marginHorizontal: 8 }}
                    />
                    <Text style={styles.settingText}>
                        {t("addContent.allowDownload")}
                    </Text>
                    <Switch
                        value={allowDownload}
                        onValueChange={setAllowDownload}
                        trackColor={{ false: "#eee", true: "#000" }}
                        thumbColor="#fff"
                    />
                </View>
            </View>

            {/* زر المشاركة أو شريط التقدم */}
            {uploading ? (
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${Math.round(progress * 100)}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {Math.round(progress * 100)}%
                    </Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    disabled={loading || uploading}
                >
                    <Text style={styles.shareButtonText}>
                        {t("addContent.share")}
                    </Text>
                </TouchableOpacity>
            )}

            {/* إشعار النجاح أو الفشل */}
            <Notification
                visible={notif.visible}
                type={notif.type as any}
                mainText={notif.mainText}
                subText={notif.subText}
                onClose={() => setNotif({ ...notif, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    // Story Upload Styles
    storyContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    backgroundVideo: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
    },
    darkOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    storyHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(10px)",
    },
    storyHeaderTitle: {
        fontSize: 20,
        fontFamily: "somar-bold",
        color: "#fff",
        textAlign: "center",
    },
    headerSpacer: {
        width: 44,
    },
    storyInfoCard: {
        position: "absolute",
        bottom: 200,
        left: 20,
        right: 20,
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    storyInfoGradient: { // This style is now for BlurView background
        padding: 24,
    },
    storyInfoBlurBackground: { // New style for BlurView
        flex: 1, // Make it take full space of the card
        borderRadius: 24, // Match parent borderRadius
        overflow: "hidden", // Ensure content is clipped within blur
        padding: 24, // Apply padding here instead of storyInfoGradient
    },
    storyInfoHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    storyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.2)", // Slightly transparent white
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    storyInfoTitle: {
        fontSize: 20,
        fontFamily: "somar-bold",
        color: "#fff", // Changed to #fff
        flex: 1,
    },
    storyDetails: {
        gap: 16,
    },
    storyDetailItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)", // Slightly transparent white
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    detailLabel: {
        fontSize: 16,
        fontFamily: "somar-medium",
        color: "#fff", // Changed to #fff
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        fontFamily: "somar-bold",
        color: "#fff", // Changed to #fff
    },
    storyButtonContainer: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 60 + (Dimensions.get("window").height > 800 ? 20 : 0) : 60, // Adjust based on device height and bottom space
        left: 20,
        right: 20,
    },
    storyPublishButton: {
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        backgroundColor: "#000", // Solid background for touchable
    },
    publishButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 24,
        gap: 12,
        backgroundColor: "#000", // Ensure it's dark for minimal look
    },
    publishButtonText: {
        fontSize: 18,
        fontFamily: "somar-bold",
        color: "#fff",
        letterSpacing: 0.5,
    },
    storyProgressContainer: {
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        backgroundColor: "#000", // Solid dark background
    },
    storyProgressCard: {
        padding: 20,
        backgroundColor: "#000", // Ensure it's dark
    },
    progressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontFamily: "somar-bold",
        color: "#fff",
    },
    progressBarContainer: {
        gap: 8,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: 8,
        backgroundColor: "#fff",
        borderRadius: 4,
    },
    progressPercentage: {
        fontSize: 14,
        fontFamily: "somar-medium",
        color: "#fff",
        textAlign: "center",
    },
    // Regular Upload Styles (existing)
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 44 : 16,
        paddingBottom: 12,
        backgroundColor: "#fff",
        marginTop: 30,
    },
    headerTitle: {
        fontSize: 20,
        color: "#000",
        fontFamily: "somar-bold",
        letterSpacing: 0.5,
    },
    titleContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 2,
        backgroundColor: "#fafafa",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    titleInput: {
        fontSize: 16,
        color: "#222",
        fontFamily: "somar-regular",
        textAlignVertical: "top",
    },
    previewRow: {
        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        gap: 12,
    },
    descriptionContainer: {
        flex: 1,
        backgroundColor: "#fafafa",
        borderRadius: 16,
        padding: 14,
        marginRight: I18nManager.isRTL ? 0 : 12,
        marginLeft: I18nManager.isRTL ? 12 : 0,
        minHeight: 90,
        maxHeight: 120,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    descriptionInput: {
        fontSize: 16,
        color: "#222",
        fontFamily: "somar-regular",
        minHeight: 70,
        textAlignVertical: "top",
    },
    thumbnailContainer: {
        width: 90,
        height: 90,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    thumbnail: {
        width: 90,
        height: 90,
        borderRadius: 16,
    },
    thumbnailPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 16,
        backgroundColor: "#eee",
    },
    settingsContainer: {
        direction: I18nManager.isRTL ? "ltr" : "rtl",
        marginTop: 28,
        paddingHorizontal: 16,
        borderRadius: 16,
        paddingVertical: 10,
    },
    settingItem: {
        flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    settingText: {
        fontSize: 15,
        color: "#222",
        fontFamily: "somar-regular",
        flex: 1,
        textAlign: I18nManager.isRTL ? "right" : "left",
        marginHorizontal: 6,
    },
    shareButton: {
        backgroundColor: "#111",
        marginHorizontal: 16,
        marginBottom: Platform.OS === "ios" ? 34 : 16,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    shareButtonText: {
        color: "#fff",
        fontSize: 19,
        fontFamily: "somar-bold",
        letterSpacing: 1,
    },
    progressText: {
        marginTop: 6,
        fontSize: 14,
        color: "#222",
        fontFamily: "somar-regular",
    },
});
