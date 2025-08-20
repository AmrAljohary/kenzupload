import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions,
    Image,
    I18nManager,
    Alert,
    Linking, // Import Linking
} from "react-native";
import { Text } from "@/components/ui/Text";
import {
    CameraView,
    CameraType,
    useCameraPermissions,
    useMicrophonePermissions,
    VideoQuality,
} from "expo-camera";
import { Audio, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    useSharedValue,
    runOnJS,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Video } from "expo-av";
import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from 'expo-document-picker'; // Import DocumentPicker

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const DURATIONS = [{ value: 15 }, { value: 60 }, { value: 180 }];
const STORY_DURATIONS = [{ value: 15 }, { value: 30 }];

// Removed placeholder video URIs as per new requirements

export default function AddScreen() {
    const { t, i18n } = useTranslation();
    const isRTL = I18nManager.isRTL;
    const router = useRouter();
    const params = useLocalSearchParams();
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] =
        useMicrophonePermissions();
    const [type, setType] = useState<CameraType>("back");
    const [isRecording, setIsRecording] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(
        params.mode === "story" ? 30 : 15
    );
    const [recordedVideo, setRecordedVideo] = useState<{ uri: string } | null>(
        null
    );
    const [showPreview, setShowPreview] = useState(false);
    const [selectedTab, setSelectedTab] = useState(
        params.mode === "story" ? "story" : "post"
    ); // 'live', 'story', 'post'
    const [recordingTime, setRecordingTime] = useState(0);
    const [isRecordingExpired, setIsRecordingExpired] = useState(false);
    const [showSoonBadge, setShowSoonBadge] = useState(false);
    const [soonBadgeText, setSoonBadgeText] = useState("");

    const cameraRef = useRef<CameraView>(null);
    const videoRef = useRef(null);
    const recordingProgress = useSharedValue(0);
    const recordingTimer = useRef<NodeJS.Timeout | null>(null);

    const hasPermissions =
        cameraPermission?.granted && microphonePermission?.granted;

    // Function to request permissions
    const requestAllPermissions = async () => {
        const { status: cameraStatus, canAskAgain: cameraCanAskAgain } = await requestCameraPermission();
        const { status: microphoneStatus, canAskAgain: microphoneCanAskAgain } = await requestMicrophonePermission();

        if (cameraStatus === "denied" && !cameraCanAskAgain) {
            Alert.alert(
                t("addContent.permissionDeniedTitle"),
                t("addContent.cameraPermissionPermanentlyDenied"),
                [
                    {
                        text: t("common.cancel"),
                        style: "cancel",
                    },
                    {
                        text: t("addContent.openSettings"),
                        onPress: () => Linking.openSettings(),
                    },
                ]
            );
        } else if (microphoneStatus === "denied" && !microphoneCanAskAgain) {
            Alert.alert(
                t("addContent.permissionDeniedTitle"),
                t("addContent.microphonePermissionPermanentlyDenied"),
                [
                    {
                        text: t("common.cancel"),
                        style: "cancel",
                    },
                    {
                        text: t("addContent.openSettings"),
                        onPress: () => Linking.openSettings(),
                    },
                ]
            );
        } else if (!hasPermissions) {
            // If not permanently denied, try to ask again (this handles initial denials)
            await requestCameraPermission();
            await requestMicrophonePermission();
        }
    };

    useEffect(() => {
        requestAllPermissions();
        return () => {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
        };
    }, []);

    const handleSelectTab = (tab: string) => {
        setSelectedTab(tab);

        // تحديث المدة حسب نوع المحتوى
        if (tab === "story") {
            setSelectedDuration(30); // القصص محدودة بـ 30 ثانية
        } else if (tab === "post") {
            setSelectedDuration(15); // المنشورات تبدأ بـ 15 ثانية
        }

        if (tab === "live") {
            setSoonBadgeText(t("addContent.comingSoon"));
            setShowSoonBadge(true);
            setTimeout(() => setShowSoonBadge(false), 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
    };

    const startRecordingTimer = () => {
        let time = 0;
        setRecordingTime(0);

        recordingTimer.current = setInterval(() => {
            time += 1;
            setRecordingTime(time);

            if (time >= selectedDuration) {
                if (recordingTimer.current) {
                    clearInterval(recordingTimer.current);
                    setIsRecordingExpired(true);
                    handleStopRecording();
                }
            }
        }, 1000);
    };

    const handleStartRecording = async () => {
        if (!cameraRef.current) return;

        // If on iOS simulator, show alert instead of recording
        if (Platform.OS === 'ios' && __DEV__) {
            Alert.alert(
                t("addContent.simulatorRecordingNotSupportedTitle"),
                t("addContent.simulatorRecordingNotSupportedDescription"),
                [{ text: t("common.ok") }]
            );
            return; // Exit function
        }

        if (!microphonePermission?.granted) {
            Alert.alert(t("common.error"), t("addContent.recordError"), [
                { text: t("common.retry"), onPress: requestAllPermissions },
            ]);
            return;
        }

        setIsRecording(true);
        setIsRecordingExpired(false);
        recordingProgress.value = 0;

        recordingProgress.value = withTiming(
            1,
            {
                duration: selectedDuration * 1000,
            },
            (finished) => {
                if (finished) {
                    runOnJS(handleRecordingFinished)();
                }
            }
        );

        startRecordingTimer();

        try {
            const video = await cameraRef.current.recordAsync({
                maxDuration: selectedDuration,
            });

            if (video) {
                setRecordedVideo(video);
                setShowPreview(true);
            }
        } catch (error) {
            console.error(t("addContent.recordError"), error);
            Alert.alert(t("common.error"), t("addContent.recordError"));
        } finally {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
            setIsRecording(false);
        }
    };

    const handleRecordingFinished = () => {
        if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
        }
        setIsRecordingExpired(true);
    };

    const handleStopRecording = async () => {
        if (!cameraRef.current) return;

        if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
        }

        setIsRecording(false);
        // Only stop recording if not in simulator mode and camera is available
        if (!(Platform.OS === 'ios' && __DEV__) && cameraRef.current) {
            await cameraRef.current.stopRecording();
        }
    };

    const handleNext = () => {
        if (recordedVideo) {
            router.push({
                pathname: "/(tabs)/add/upload",
                params: {
                    videoUri: recordedVideo.uri,
                    contentType: selectedTab,
                    duration: selectedDuration.toString(),
                },
            });
        }
    };

    const handleRetake = () => {
        setShowPreview(false);
        setRecordedVideo(null);
        setIsRecordingExpired(false);
    };

    const handleFlipCamera = () => {
        setType(type === "back" ? "front" : "back");
    };

    const handleOpenGallery = async () => {
        let videoUri = null;

        if (Platform.OS === 'ios' && __DEV__) {
            // On iOS simulator, open document picker for video files
            const docPickerResult = await DocumentPicker.getDocumentAsync({ type: 'video/*' });

            // Handle DocumentPicker result based on 'canceled' property
            if (!docPickerResult.canceled && docPickerResult.assets && docPickerResult.assets.length > 0) {
                videoUri = docPickerResult.assets[0].uri;
            } else if (docPickerResult.canceled) {
                console.log("Document picking cancelled (Simulator).");
                return;
            }
        } else {
            // On real devices (or Android simulator), open image library for videos
            const imagePickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 1,
            });
            if (!imagePickerResult.canceled && imagePickerResult.assets && imagePickerResult.assets.length > 0) {
                videoUri = imagePickerResult.assets[0].uri;
            } else if (imagePickerResult.canceled) {
                console.log("Image picking cancelled (Device).");
                return;
            }
        }

        if (videoUri) {
            setRecordedVideo({ uri: videoUri });
            setShowPreview(true);
        }
    };

    // شريط تقدم التسجيل
    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${recordingProgress.value * 100}%`,
            height: 3,
            backgroundColor: "red",
            position: "absolute",
            top: 0,
            left: 0,
        };
    });

    if (!hasPermissions) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    {t("addContent.cameraMicrophonePermissionRequired")}
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestAllPermissions}
                >
                    <Text style={styles.permissionButtonText}>
                        {t("addContent.grantPermission")}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showPreview && recordedVideo) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                {/* شارة قريباً في الأعلى */}
                {showSoonBadge && (
                    <View style={styles.soonBadgeTop}>
                        <Text style={styles.soonBadgeText}>
                            {soonBadgeText}
                        </Text>
                    </View>
                )}
                <View style={styles.previewHeader}>
                    <TouchableOpacity onPress={handleRetake}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.previewTitle}>
                        {t("addContent.preview")}
                    </Text>
                    <View />
                </View>

                <Video
                    ref={videoRef}
                    source={{ uri: recordedVideo.uri }}
                    style={styles.previewVideo}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                />

                <View style={styles.previewFooter}>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>
                            {t("addContent.next")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* شارة قريباً في الأعلى */}
            {showSoonBadge && (
                <View style={styles.soonBadgeTop}>
                    <Text style={styles.soonBadgeText}>{soonBadgeText}</Text>
                </View>
            )}

            {/* شريط تقدم التسجيل */}
            {isRecording && (
                <View style={styles.progressContainer}>
                    <Animated.View style={progressStyle} />
                </View>
            )}

            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={type}
                zoom={0}
                mode="video"
            >
                {/* أزرار التحكم العلوية */}
                {!isRecording && (
                    <View style={styles.topBar}>
                        <View />
                        <View style={styles.musicButton}>
                            <Ionicons
                                name={
                                    selectedTab === "story"
                                        ? "time-outline"
                                        : "musical-notes"
                                }
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.musicText}>
                                {selectedTab === "story"
                                    ? `${t("addContent.tabs.story")} - ${selectedDuration}s`
                                    : t("addContent.addMusic")}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* عرض توقيت التسجيل */}
                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>
                            {t("addContent.recording")}{" "}
                            {formatTime(recordingTime)}/
                            {formatTime(selectedDuration)}
                        </Text>
                    </View>
                )}

                {/* أزرار التحكم السفلية */}
                <View style={styles.bottomControls}>
                    {!isRecording && (
                        <View style={styles.durationContainer}>
                            {(selectedTab === "story"
                                ? STORY_DURATIONS
                                : DURATIONS
                            ).map((duration) => {
                                const durationText =
                                    duration.value === 15
                                        ? "15s"
                                        : duration.value === 30
                                          ? "30s"
                                          : duration.value === 60
                                            ? "60s"
                                            : "3m";
                                return (
                                    <TouchableOpacity
                                        key={duration.value}
                                        style={[
                                            styles.durationOption,
                                            selectedDuration ===
                                                duration.value &&
                                                styles.selectedDurationOption,
                                        ]}
                                        onPress={() =>
                                            setSelectedDuration(duration.value)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.durationText,
                                                selectedDuration ===
                                                    duration.value &&
                                                    styles.selectedDurationText,
                                            ]}
                                        >
                                            {t(
                                                `addContent.durations.${durationText}`
                                            )}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* زر التسجيل دائماً في المنتصف */}
                    <View style={styles.recordButtonWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.recordButton,
                                isRecording && styles.recordingButton,
                            ]}
                            onPress={
                                isRecording
                                    ? handleStopRecording
                                    : handleStartRecording
                            }
                        >
                            <View
                                style={
                                    isRecording
                                        ? styles.stopButtonInner
                                        : styles.recordButtonInner
                                }
                            />
                        </TouchableOpacity>
                    </View>

                    {/* باقي عناصر التحكم تظهر فقط إذا لم يكن هناك تسجيل */}
                    {!isRecording && (
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={styles.sideButton}
                                onPress={handleFlipCamera}
                            >
                                <Ionicons
                                    name="camera-reverse"
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                            <View style={styles.tabsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.tab,
                                        selectedTab === "live" &&
                                            styles.activeTab,
                                    ]}
                                    onPress={() => handleSelectTab("live")}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            selectedTab === "live" &&
                                                styles.activeTabText,
                                        ]}
                                    >
                                        {t("addContent.tabs.live")}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.tab,
                                        selectedTab === "story" &&
                                            styles.activeTab,
                                        selectedTab === "story" &&
                                            styles.storyTab,
                                    ]}
                                    onPress={() => handleSelectTab("story")}
                                >
                                    <View style={styles.tabContent}>
                                        <Text
                                            style={[
                                                styles.tabText,
                                                selectedTab === "story" &&
                                                    styles.activeTabText,
                                            ]}
                                        >
                                            {t("addContent.tabs.story")}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.tab,
                                        selectedTab === "post" &&
                                            styles.activeTab,
                                    ]}
                                    onPress={() => handleSelectTab("post")}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            selectedTab === "post" &&
                                                styles.activeTabText,
                                        ]}
                                    >
                                        {t("addContent.tabs.post")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.sideButton}
                                onPress={handleOpenGallery}
                            >
                                <Ionicons
                                    name="images"
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    permissionText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        fontFamily: "somar-medium",
    },
    permissionButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
    },
    permissionButtonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "somar-bold",
    },
    camera: {
        flex: 1,
        justifyContent: "space-between",
        marginTop: 30,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop:
            Platform.OS === "ios" ? Math.max(50, SCREEN_HEIGHT * 0.06) : 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(53, 56, 63, 0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    musicButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(53, 56, 63, 0.3)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    musicText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-medium",
    },
    bottomControls: {
        flex: 1,
        paddingBottom:
            Platform.OS === "ios" ? Math.max(40, SCREEN_HEIGHT * 0.05) : 20,
        alignItems: "center",
        justifyContent: "flex-end",
        alignSelf: "center",
    },
    durationContainer: {
        flexDirection: "row",
        marginBottom: Math.max(20, SCREEN_HEIGHT * 0.025),
        width: SCREEN_WIDTH < 400 ? "70%" : "55%",
        justifyContent: "space-between",
        alignItems: "center",
        gap: SCREEN_WIDTH < 400 ? 10 : 20,
    },
    durationOption: {
        backgroundColor: "rgba(53, 56, 63, 0.3)",
        paddingHorizontal: SCREEN_WIDTH < 400 ? 12 : 20,
        paddingVertical: 5,
        borderRadius: 15,
        minWidth: SCREEN_WIDTH < 400 ? 40 : 50,
    },
    selectedDurationOption: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    durationText: {
        color: "white",
        fontSize: SCREEN_WIDTH < 400 ? 11 : 12,
        opacity: 0.7,
        fontFamily: "somar-medium",
        textAlign: "center",
    },
    selectedDurationText: {
        opacity: 1,
        fontFamily: "somar-bold",
        fontSize: SCREEN_WIDTH < 400 ? 12 : 14,
    },
    controlRow: {
        flexDirection: "row",
        width: "100%",
        marginBottom: Math.max(20, SCREEN_HEIGHT * 0.025),
    },
    sideButton: {
        width: SCREEN_WIDTH < 400 ? 45 : 50,
        height: SCREEN_WIDTH < 400 ? 45 : 50,
        borderRadius: SCREEN_WIDTH < 400 ? 22.5 : 25,
        backgroundColor: "rgba(53, 56, 63, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: SCREEN_WIDTH < 400 ? 20 : 30,
    },
    recordButton: {
        width: SCREEN_WIDTH < 400 ? 70 : 80,
        height: SCREEN_WIDTH < 400 ? 70 : 80,
        borderRadius: SCREEN_WIDTH < 400 ? 35 : 40,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.3)",
        alignSelf: "center",
    },
    recordButtonInner: {
        width: SCREEN_WIDTH < 400 ? 25 : 30,
        height: SCREEN_WIDTH < 400 ? 25 : 30,
        borderRadius: SCREEN_WIDTH < 400 ? 12.5 : 15,
        backgroundColor: "red",
    },
    stopButtonInner: {
        width: SCREEN_WIDTH < 400 ? 25 : 30,
        height: SCREEN_WIDTH < 400 ? 25 : 30,
        backgroundColor: "red",
        borderRadius: 4,
    },
    recordingButton: {
        borderColor: "red",
    },
    tabsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        alignItems: "center",
        width: "100%",
        paddingHorizontal: SCREEN_WIDTH < 400 ? 5 : 10,
    },
    tabsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    tab: {
        paddingHorizontal: SCREEN_WIDTH < 400 ? 8 : 10,
        paddingVertical: 10,
        marginHorizontal: SCREEN_WIDTH < 400 ? 3 : 5,
        position: "relative",
        minWidth: SCREEN_WIDTH < 400 ? 50 : 60,
    },
    activeTab: {
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    tabText: {
        color: "white",
        fontSize: SCREEN_WIDTH < 400 ? 11 : 12,
        fontFamily: "somar-medium",
        textAlign: "center",
    },
    activeTabText: {
        fontFamily: "somar-bold",
    },
    recordingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        position: "absolute",
        top: Platform.OS === "ios" ? Math.max(50, SCREEN_HEIGHT * 0.06) : 30,
        alignSelf: "center",
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "red",
        marginRight: 10,
    },
    recordingText: {
        color: "white",
        fontFamily: "somar-medium",
    },
    progressContainer: {
        width: "100%",
        height: 3,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100,
    },
    previewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingTop:
            Platform.OS === "ios" ? Math.max(50, SCREEN_HEIGHT * 0.06) : 16,
        marginTop: 30,
    },
    previewTitle: {
        color: "white",
        fontSize: 18,
        fontFamily: "somar-bold",
    },
    previewVideo: {
        flex: 1,
        backgroundColor: "#000",
    },
    previewFooter: {
        padding: 20,
        backgroundColor: "#000",
        paddingBottom:
            Platform.OS === "ios" ? Math.max(40, SCREEN_HEIGHT * 0.05) : 20,
    },
    nextButton: {
        backgroundColor: "#111",
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: "center",
        minHeight: 50,
    },
    nextButtonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "somar-bold",
    },
    recordButtonWrapper: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Math.max(20, SCREEN_HEIGHT * 0.025),
    },
    soonBadgeTop: {
        position: "absolute",
        top: Platform.OS === "ios" ? Math.max(100, SCREEN_HEIGHT * 0.12) : 80,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 100,
        paddingHorizontal: 20,
    },
    soonBadgeText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "somar-bold",
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        textAlign: "center",
    },
    storyTab: {
        borderColor: "#000",
        borderWidth: 1,
    },
    tabContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    storyIndicator: {
        backgroundColor: "#000",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 2,
    },
    storyDurationText: {
        color: "white",
        fontSize: 10,
        fontFamily: "somar-bold",
    },
});
