import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
    Platform,
    FlatList,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Animated,
    I18nManager,
    Share,
    AppState,
    Button,
    Modal,
    ToastAndroid,
    Alert,
    Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
    Ionicons,
    MaterialCommunityIcons,
    AntDesign,
    Feather,
    MaterialIcons,
    FontAwesome,
    FontAwesome5,
    Entypo,
} from "@expo/vector-icons";
import { Text } from "../../components/ui/Text";
import { LinearGradient } from "expo-linear-gradient";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView, VideoSource } from "expo-video";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { useAppLanguage } from "../../hooks/useLanguage";
import { api } from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { State } from "react-native-gesture-handler";
import {
    LongPressGestureHandler,
    TapGestureHandler,
} from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");
const BOTTOM_TAB_HEIGHT = 40;
const DOUBLE_CLICK_DELAY = 300;
const PRELOAD_VIDEO_COUNT = 10; // عدد الفيديوهات المحملة مسبقاً
import Heart from "../../assets/icons/svgs/Heart";
import Comment from "../../assets/icons/svgs/Comment";

interface VideoUser {
    id: number;
    name: string;
    username: string;
    profile_image: string;
}

interface VideoItem {
    id: number;
    url: string;
    title: string;
    description: string;
    created_at: string;
    likes_count: number;
    views: number;
    is_liked: boolean;
    is_saved: boolean;
    has_liked: boolean;
    user: VideoUser;
}

interface ApiResponse {
    paginationLinks: {
        currentPages: number;
        links: {
            first: string;
            last: string;
        };
        perPage: number;
        total: number;
    };
    rows: VideoItem[];
}

// واجهة لمكون Bottom Sheet
interface VideoOptionsBottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    video: VideoItem;
    isRTL: boolean;
}

// واجهة لزر الإجراء
interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    action: string;
    color?: string;
}

// مكون صفحة سفلية (Bottom Sheet)
const VideoOptionsBottomSheet = ({
    isVisible,
    onClose,
    video,
    isRTL,
}: VideoOptionsBottomSheetProps) => {
    const [translateY] = useState(new Animated.Value(height));
    const [translateYOverlay] = useState(new Animated.Value(0));
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // تأثير الظهور والاختفاء
    useEffect(() => {
        if (isVisible) {
            // ظهور الصفحة السفلية
            Animated.spring(translateY, {
                toValue: 0,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }).start();
            // تأثير الظلام في الخلفية
            Animated.timing(translateYOverlay, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // إخفاء الصفحة السفلية
            Animated.spring(translateY, {
                toValue: height,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }).start();
            // إخفاء التأثير من الخلفية
            Animated.timing(translateYOverlay, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    // إظهار رسالة التوست عند إجراء
    const showActionToast = (message: string) => {
        if (Platform.OS === "android") {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            setToastMessage(message);
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        }
    };

    // معالجة الإجراءات
    const handleAction = (action: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        switch (action) {
            case "save":
                showActionToast("تم حفظ الفيديو في التنزيلات");
                break;
            case "notInterested":
                showActionToast("لن يتم اقتراح فيديوهات مشابهة");
                break;
            case "report":
                showActionToast("تم إرسال البلاغ");
                break;
            case "share":
                Share.share({
                    message: `شاهد فيديو "${video.title}" من ${video.user.name}`,
                    url: video.url,
                });
                break;
            case "addToPlaylist":
                showActionToast("تم إضافة الفيديو إلى قائمة التشغيل");
                break;
            default:
                break;
        }

        setTimeout(() => {
            onClose();
        }, 300);
    };

    // تصميم زر إجراء
    const ActionButton = ({
        icon,
        label,
        action,
        color = "#333",
    }: ActionButtonProps) => (
        <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction(action)}
        >
            <View
                style={[
                    styles.actionIconContainer,
                    { backgroundColor: `${color}15` },
                ]}
            >
                {icon}
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    style={[styles.overlay, { opacity: translateYOverlay }]}
                >
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={styles.closeArea} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.bottomSheetContainer,
                        { transform: [{ translateY: translateY }] },
                    ]}
                >
                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={styles.blurBackground}
                    >
                        <View style={styles.bottomSheetContent}>
                            {/* مقبض السحب */}
                            <View style={styles.handle} />

                            {/* عنوان الفيديو والمستخدم */}
                            <View style={styles.videoInfo}>
                                <Image
                                    source={{ uri: video.user.profile_image }}
                                    style={styles.bottomSheetAvatar}
                                />
                                <View style={styles.videoTextInfo}>
                                    <Text
                                        style={styles.videoTitle}
                                        numberOfLines={1}
                                    >
                                        {video.title || "فيديو رائع"}
                                    </Text>
                                    <Text
                                        style={styles.videoAuthor}
                                        numberOfLines={1}
                                    >
                                        {video.user.name} @{video.user.username}
                                    </Text>
                                </View>
                            </View>

                            {/* الإجراءات الرئيسية */}
                            <View style={styles.primaryActions}>
                                <ActionButton
                                    icon={
                                        <Entypo
                                            name="add-to-list"
                                            size={22}
                                            color="#6C5CE7"
                                        />
                                    }
                                    label="إضافة للقائمة"
                                    action="addToPlaylist"
                                    color="#6C5CE7"
                                />
                                <ActionButton
                                    icon={
                                        <FontAwesome5
                                            name="download"
                                            size={22}
                                            color="#00B894"
                                        />
                                    }
                                    label="حفظ الفيديو"
                                    action="save"
                                    color="#00B894"
                                />
                                <ActionButton
                                    icon={
                                        <Ionicons
                                            name="share-social"
                                            size={22}
                                            color="#0984E3"
                                        />
                                    }
                                    label="مشاركة"
                                    action="share"
                                    color="#0984E3"
                                />
                                <ActionButton
                                    icon={
                                        <AntDesign
                                            name="flag"
                                            size={22}
                                            color="#E17055"
                                        />
                                    }
                                    label="إبلاغ"
                                    action="report"
                                    color="#E17055"
                                />
                            </View>

                            {/* خط فاصل */}
                            <View style={styles.divider} />

                            {/* الإجراءات الثانوية */}
                            <View style={styles.secondaryActions}>
                                <TouchableOpacity
                                    style={styles.secondaryAction}
                                    onPress={() =>
                                        handleAction("notInterested")
                                    }
                                >
                                    <AntDesign
                                        name="dislike2"
                                        size={22}
                                        color="#777"
                                    />
                                    <Text style={styles.secondaryActionText}>
                                        غير مهتم
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryAction}
                                    onPress={() =>
                                        handleAction("dontRecommend")
                                    }
                                >
                                    <Feather
                                        name="slash"
                                        size={22}
                                        color="#777"
                                    />
                                    <Text style={styles.secondaryActionText}>
                                        عدم اقتراح هذا الحساب
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryAction}
                                    onPress={() => handleAction("autoScroll")}
                                >
                                    <MaterialIcons
                                        name="swap-vertical-circle"
                                        size={22}
                                        color="#777"
                                    />
                                    <Text style={styles.secondaryActionText}>
                                        تمكين التمرير التلقائي
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.secondaryAction}
                                    onPress={() => handleAction("emptyScreen")}
                                >
                                    <Feather
                                        name="maximize"
                                        size={22}
                                        color="#777"
                                    />
                                    <Text style={styles.secondaryActionText}>
                                        تشغيل بوضع الشاشة الكاملة
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* توست آيفون */}
                {showToast && (
                    <View style={styles.toastContainer}>
                        <BlurView
                            intensity={70}
                            tint="dark"
                            style={styles.toastBlur}
                        >
                            <Text style={styles.toastText}>{toastMessage}</Text>
                        </BlurView>
                    </View>
                )}
            </View>
        </Modal>
    );
};

// تعريف Props للمكون VideoItem
interface VideoItemProps {
    item: VideoItem;
    isActive: boolean;
    handleVideoPress: (videoId: number) => void;
    handleLike: (
        videoId: number,
        tapLocation?: { x: number; y: number }
    ) => void;
    handleSave: (videoId: number) => void;
    handleShare: (videoId: number) => void;
    showHeart: { [key: number]: boolean };
    heartAnim: { [key: number]: Animated.Value };
    isRTL: boolean;
    router: any;
    onLongPress: (video: VideoItem) => void;
}

// مكون منفصل للفيديو لحل مشكلة استخدام Hooks
const VideoItem = React.memo(
    ({
        item,
        isActive,
        handleVideoPress,
        handleLike,
        handleSave,
        handleShare,
        showHeart,
        heartAnim,
        isRTL,
        router,
        onLongPress,
    }: VideoItemProps) => {
        const videoPlayer = useVideoPlayer(item.url, (player) => {
            player.loop = true;
            if (isActive) player.play();
            else player.pause();
        });
        const singleTapRef = useRef();
        const doubleTapRef = useRef();
        const longPressRef = useRef();

        // تحكم في حالة تشغيل الفيديو
        const [isPaused, setIsPaused] = useState(false);

        // مكان ظهور القلب عند النقر المزدوج
        const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

        // مصفوفة لتخزين عدة قلوب صغيرة
        const [miniHearts, setMiniHearts] = useState<
            Array<{
                id: number;
                x: number;
                y: number;
                size: number;
                duration: number;
                animValue: Animated.Value;
            }>
        >([]);

        // تحديث حالة التشغيل عند تغيير الفيديو النشط
        useEffect(() => {
            if (isActive) {
                if (isPaused) {
                    videoPlayer.pause();
                } else {
                    videoPlayer.play();
                }
            } else {
                videoPlayer.pause();
                // إعادة تعيين حالة الإيقاف عند تغيير الفيديو النشط
                setIsPaused(false);
            }
        }, [isActive, isPaused, videoPlayer]);

        const handleSingleTap = () => {
            if (isActive) {
                setIsPaused(!isPaused);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleVideoPress(item.id);
            }
        };

        // إنشاء قلوب صغيرة متطايرة
        const createMiniHearts = (x: number, y: number) => {
            // تعريف نوع مصفوفة القلوب الصغيرة
            const newHearts: Array<{
                id: number;
                x: number;
                y: number;
                size: number;
                duration: number;
                animValue: Animated.Value;
            }> = [];

            const count = Math.floor(Math.random() * 3) + 5; // 5-7 قلوب

            for (let i = 0; i < count; i++) {
                const id = Date.now() + i;
                const animValue = new Animated.Value(0);
                const offsetX = (Math.random() - 0.5) * 100; // انتشار أفقي (-50 إلى 50)
                const offsetY = Math.random() * -150 - 50; // انتشار عمودي (-50 إلى -200) دائما للأعلى
                const size = Math.floor(Math.random() * 20) + 10; // حجم القلب (10-30)
                const duration = Math.floor(Math.random() * 1000) + 1500; // مدة الرسوم المتحركة (1500-2500ms)

                // إنشاء رسوم متحركة للقلوب المتطايرة
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }).start(() => {
                    // إزالة القلب بعد انتهاء الرسوم المتحركة
                    setMiniHearts((prev) =>
                        prev.filter((heart) => heart.id !== id)
                    );
                });

                newHearts.push({
                    id,
                    x: x + offsetX,
                    y: y + offsetY,
                    size,
                    duration,
                    animValue,
                });
            }

            setMiniHearts((prev) => [...prev, ...newHearts]);
        };

        // معالجة النقر المزدوج
        const handleDoubleTap = (event: any) => {
            // احصل على موقع النقر
            const tapLocation = {
                x: event.x,
                y: event.y,
            };

            // حدد مكان ظهور القلب
            setHeartPosition(tapLocation);

            // إنشاء قلوب متطايرة صغيرة
            createMiniHearts(tapLocation.x, tapLocation.y);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleLike(item.id, tapLocation);
        };

        return (
            <LongPressGestureHandler
                ref={longPressRef}
                minDurationMs={600}
                onHandlerStateChange={({ nativeEvent }) => {
                    if (nativeEvent.state === State.ACTIVE) {
                        onLongPress(item);
                    }
                }}
            >
                <TapGestureHandler
                    ref={doubleTapRef}
                    numberOfTaps={2}
                    onHandlerStateChange={({ nativeEvent }) => {
                        if (nativeEvent.state === State.ACTIVE) {
                            handleDoubleTap(nativeEvent);
                        }
                    }}
                    waitFor={longPressRef} // don't double tap if long press is active
                >
                    <TapGestureHandler
                        ref={singleTapRef}
                        numberOfTaps={1}
                        waitFor={[doubleTapRef, longPressRef]} // only fire if double tap and long press don't
                        onHandlerStateChange={({ nativeEvent }) => {
                            if (nativeEvent.state === State.ACTIVE) {
                                handleSingleTap();
                            }
                        }}
                    >
                        <View
                            style={[
                                styles.videoContainer,
                                { height: height - BOTTOM_TAB_HEIGHT },
                            ]}
                        >
                            <View style={styles.videoWrapper}>
                                <VideoView
                                    style={styles.video}
                                    player={videoPlayer}
                                    allowsFullscreen
                                    allowsPictureInPicture
                                    nativeControls={false}
                                />

                                {/* أيقونة التشغيل/الإيقاف - تظهر فقط عند الإيقاف */}
                                {isPaused && isActive && (
                                    <View style={styles.playIconContainer}>
                                        <Ionicons
                                            name="play"
                                            size={40}
                                            color="#fff"
                                        />
                                    </View>
                                )}

                                {/* رسوم متحركة للقلب الرئيسي */}
                                {showHeart[item.id] && (
                                    <Animated.View
                                        style={[
                                            styles.heartAnimContainer,
                                            {
                                                position: "absolute",
                                                left: heartPosition.x - 75, // تركيز القلب على موقع النقر
                                                top: heartPosition.y - 75,
                                                transform: [
                                                    {
                                                        scale: heartAnim[
                                                            item.id
                                                        ],
                                                    },
                                                    {
                                                        translateY: heartAnim[
                                                            item.id
                                                        ].interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [
                                                                0, -20,
                                                            ],
                                                        }),
                                                    },
                                                    {
                                                        rotate: heartAnim[
                                                            item.id
                                                        ].interpolate({
                                                            inputRange: [
                                                                0, 0.3, 0.6, 1,
                                                            ],
                                                            outputRange: [
                                                                "0deg",
                                                                "-5deg",
                                                                "5deg",
                                                                "0deg",
                                                            ],
                                                        }),
                                                    },
                                                ],
                                                opacity: heartAnim[item.id],
                                            },
                                        ]}
                                    >
                                        <View style={styles.heartGlow}>
                                            <AntDesign
                                                name="heart"
                                                size={120}
                                                color="#ff3366"
                                                style={{
                                                    shadowColor: "#ff3366",
                                                    shadowOffset: {
                                                        width: 0,
                                                        height: 0,
                                                    },
                                                    shadowOpacity: 1,
                                                    shadowRadius: 15,
                                                }}
                                            />
                                        </View>
                                    </Animated.View>
                                )}

                                {/* القلوب الصغيرة المتطايرة */}
                                {miniHearts.map((heart) => (
                                    <Animated.View
                                        key={heart.id}
                                        style={{
                                            position: "absolute",
                                            left: heart.x,
                                            top: heart.y,
                                            opacity:
                                                heart.animValue.interpolate({
                                                    inputRange: [0, 0.7, 1],
                                                    outputRange: [0, 1, 0],
                                                }),
                                            transform: [
                                                {
                                                    translateY:
                                                        heart.animValue.interpolate(
                                                            {
                                                                inputRange: [
                                                                    0, 1,
                                                                ],
                                                                outputRange: [
                                                                    0, -150,
                                                                ],
                                                            }
                                                        ),
                                                },
                                                {
                                                    translateX:
                                                        heart.animValue.interpolate(
                                                            {
                                                                inputRange: [
                                                                    0, 0.5, 1,
                                                                ],
                                                                outputRange: [
                                                                    0,
                                                                    (Math.random() -
                                                                        0.5) *
                                                                        80,
                                                                    (Math.random() -
                                                                        0.5) *
                                                                        100,
                                                                ],
                                                            }
                                                        ),
                                                },
                                                {
                                                    rotate: heart.animValue.interpolate(
                                                        {
                                                            inputRange: [0, 1],
                                                            outputRange: [
                                                                "0deg",
                                                                `${(Math.random() - 0.5) * 90}deg`,
                                                            ],
                                                        }
                                                    ),
                                                },
                                                {
                                                    scale: heart.animValue.interpolate(
                                                        {
                                                            inputRange: [
                                                                0, 0.5, 1,
                                                            ],
                                                            outputRange: [
                                                                0.8, 1.2, 0.8,
                                                            ],
                                                        }
                                                    ),
                                                },
                                            ],
                                        }}
                                    >
                                        <AntDesign
                                            name="heart"
                                            size={heart.size}
                                            color={`rgba(255, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100) + 100}, 1)`}
                                        />
                                    </Animated.View>
                                ))}
                            </View>

                            {/* معلومات المستخدم والتفاعلات */}
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.8)"]}
                                style={styles.gradient}
                            >
                                <View
                                    style={[
                                        styles.userInfo,
                                        {
                                            flexDirection: isRTL
                                                ? "row"
                                                : "row-reverse",
                                        },
                                    ]}
                                >
                                    <View
                                        style={
                                            isRTL
                                                ? styles.DataContainer
                                                : styles.arabicDataContainer
                                        }
                                    >
                                        <Text style={styles.username}>
                                            {item.user.name}
                                        </Text>
                                        <Text style={styles.userHandle}>
                                            @{item.user.username}
                                        </Text>
                                        <Text style={styles.description}>
                                            {item.description}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            isRTL
                                                ? styles.ReactionContainerAr
                                                : styles.ReactionContainer
                                        }
                                    >
                                        {/* صورة المستخدم في المركز */}
                                        <TouchableOpacity
                                            style={[
                                                styles.avatarContainer,
                                                isRTL
                                                    ? {
                                                          left: 40,
                                                          right: "auto",
                                                      }
                                                    : {
                                                          right: 40,
                                                          left: "auto",
                                                      },
                                                isRTL
                                                    ? { marginLeft: 10 }
                                                    : { marginRight: 10 },
                                            ]}
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/(tabs)/profile",
                                                    params: {
                                                        id: item.user.id,
                                                    },
                                                })
                                            }
                                        >
                                            <Image
                                                source={{
                                                    uri: item.user
                                                        .profile_image,
                                                }}
                                                style={styles.avatar}
                                            />
                                            <View
                                                style={styles.addIconContainer}
                                            >
                                                <Ionicons
                                                    name="add"
                                                    size={16}
                                                    color="#fff"
                                                />
                                            </View>
                                        </TouchableOpacity>

                                        {/* زر الإعجاب */}
                                        <TouchableOpacity
                                            style={
                                                isRTL
                                                    ? styles.likeButton
                                                    : styles.likeButtonAr
                                            }
                                            onPress={() => handleLike(item.id)}
                                        >
                                            <Heart
                                                fill={
                                                    item.is_liked ||
                                                    item.has_liked
                                                        ? "#ff0000"
                                                        : "#fff"
                                                }
                                            />
                                            <Text style={styles.likeCount}>
                                                {item.likes_count}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* زر التعليق */}
                                        <TouchableOpacity
                                            style={
                                                isRTL
                                                    ? styles.commentButton
                                                    : styles.commentButtonAr
                                            }
                                            onPress={() =>
                                                router.push({
                                                    pathname:
                                                        "/(tabs)/comments",
                                                    params: { id: item.id },
                                                })
                                            }
                                        >
                                            <Comment fill="#fff" />
                                        </TouchableOpacity>

                                        {/* زر الحفظ */}
                                        <TouchableOpacity
                                            style={
                                                isRTL
                                                    ? styles.saveButton
                                                    : styles.saveButtonAr
                                            }
                                            onPress={() => handleSave(item.id)}
                                        >
                                            <MaterialCommunityIcons
                                                name={
                                                    item.is_saved
                                                        ? "bookmark"
                                                        : "bookmark-outline"
                                                }
                                                size={24}
                                                color="#fff"
                                            />
                                        </TouchableOpacity>

                                        {/* زر المشاركة */}
                                        <TouchableOpacity
                                            style={
                                                isRTL
                                                    ? styles.shareButton
                                                    : styles.shareButtonAr
                                            }
                                            onPress={() => handleShare(item.id)}
                                        >
                                            <MaterialCommunityIcons
                                                name="share"
                                                size={24}
                                                color="#fff"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    </TapGestureHandler>
                </TapGestureHandler>
            </LongPressGestureHandler>
        );
    }
);

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { t, isRTL } = useAppLanguage();
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isLive, setIsLive] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [hasMorePages, setHasMorePages] = useState(true);
    const flatListRef = useRef<FlatList<VideoItem>>(null);
    const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
    const [showHeart, setShowHeart] = useState<{ [key: number]: boolean }>({});
    const heartAnim = useRef<{ [key: number]: Animated.Value }>({});
    const appState = useRef(AppState.currentState);
    const [showPlayButton, setShowPlayButton] = useState<{
        [key: number]: boolean;
    }>({});
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);

    // تحميل الفيديوهات
    const loadVideos = async (page: number, refresh = false) => {
        try {
            setLoading(true);
            const response = await api.get<{ data: ApiResponse }>(
                `/videos/homePage?page=${page}`
            );

            if (response.data?.data) {
                const { rows, paginationLinks } = response.data.data;

                // التحقق من وجود صفحات إضافية
                setHasMorePages(
                    paginationLinks.currentPages <
                        parseInt(paginationLinks.links.last.split("page=")[1])
                );

                // إعداد القيم المتحركة مسبقًا لكل فيديو
                rows.forEach((video) => {
                    if (!heartAnim.current[video.id]) {
                        heartAnim.current[video.id] = new Animated.Value(0);
                    }
                });

                if (refresh) {
                    setVideos(rows);
                } else {
                    setVideos((prev) => [...prev, ...rows]);
                }
            }
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error loading videos:", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    // تحميل الفيديوهات عند بدء التطبيق
    useEffect(() => {
        loadVideos(1);
    }, []);

    // استخدام useFocusEffect للتحكم بالفيديو عند العودة إلى الشاشة
    useFocusEffect(
        useCallback(() => {
            // استئناف تشغيل الفيديو النشط عند العودة إلى الشاشة
            const activeVideo = videos[activeVideoIndex];
            if (activeVideo) {
                const videoId = activeVideo.id;
                // إعادة تعيين حالة الفيديو
                setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
            }

            return () => {
                // إيقاف جميع الفيديوهات عند مغادرة الشاشة
                setIsPlaying({});
            };
        }, [activeVideoIndex, videos])
    );

    // مراقبة حالة التطبيق (نشط/خلفية)
    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            (nextAppState) => {
                if (
                    appState.current === "active" &&
                    nextAppState.match(/inactive|background/)
                ) {
                    // التطبيق ذهب إلى الخلفية، يجب إيقاف الفيديو
                    if (videos[activeVideoIndex]) {
                        const videoId = videos[activeVideoIndex].id;
                        setIsPlaying((prev) => ({ ...prev, [videoId]: false }));
                    }
                } else if (
                    appState.current.match(/inactive|background/) &&
                    nextAppState === "active"
                ) {
                    // التطبيق عاد من الخلفية، يمكن استئناف الفيديو
                    if (videos[activeVideoIndex]) {
                        const videoId = videos[activeVideoIndex].id;
                        setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
                    }
                }

                appState.current = nextAppState;
            }
        );

        return () => {
            subscription.remove();
        };
    }, [activeVideoIndex, videos]);

    // معالجة الإعجاب
    const handleLike = async (
        videoId: number,
        tapLocation = { x: width / 2, y: height / 2 }
    ) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const video = videos.find((v) => v.id === videoId);
            if (!video) return;

            // إنشاء تأثير القلب النابض
            setShowHeart((prev) => ({
                ...prev,
                [videoId]: true,
            }));

            // تأثير حركي متطور للقلب
            heartAnim.current[videoId] = new Animated.Value(0);

            Animated.sequence([
                // التكبير مع ظهور القلب
                Animated.spring(heartAnim.current[videoId], {
                    toValue: 1.1,
                    tension: 80,
                    friction: 6,
                    useNativeDriver: true,
                }),
                // حركة اهتزاز صغيرة
                Animated.spring(heartAnim.current[videoId], {
                    toValue: 0.95,
                    tension: 120,
                    friction: 10,
                    useNativeDriver: true,
                }),
                // العودة إلى الحجم الطبيعي ثم التلاشي
                Animated.timing(heartAnim.current[videoId], {
                    toValue: 0,
                    duration: 500,
                    delay: 500,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowHeart((prev) => ({
                    ...prev,
                    [videoId]: false,
                }));
            });

            const updatedVideos = videos.map((v) => {
                if (v.id === videoId) {
                    return {
                        ...v,
                        is_liked: !v.is_liked,
                        has_liked: !v.has_liked,
                        likes_count: v.is_liked
                            ? v.likes_count - 1
                            : v.likes_count + 1,
                    };
                }
                return v;
            });
            setVideos(updatedVideos);

            if (video.is_liked) {
                await api.get(`videos/${videoId}/remove/like`);
            } else {
                await api.post(`videos/${videoId}/like`);
            }
        } catch (error) {
            console.error("Error handling like:", error);
        }
    };

    // معالجة الحفظ
    const handleSave = async (videoId: number) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const video = videos.find((v) => v.id === videoId);
            if (!video) return;

            const updatedVideos = videos.map((v) => {
                if (v.id === videoId) {
                    return { ...v, is_saved: !v.is_saved };
                }
                return v;
            });
            setVideos(updatedVideos);

            if (video.is_saved) {
                await api.get(`remove-to-saved-video/${videoId}`);
            } else {
                await api.get(`add-to-saved-video/${videoId}`);
            }
        } catch (error) {
            console.error("Error handling save:", error);
        }
    };

    // معالجة المشاركة
    const handleShare = async (videoId: number) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const video = videos.find((v) => v.id === videoId);
            if (!video) return;

            const shareMessage = `شاهد فيديو "${video.title}" من ${video.user.name} على تطبيق فارس الرؤية`;
            const shareUrl = `https://yourapp.com/videos/${videoId}`;

            await Share.share({
                message: shareMessage,
                url: shareUrl,
                title: video.title,
            });
        } catch (error) {
            console.error("Error sharing video:", error);
        }
    };

    // معالجة النقر على الفيديو
    const handleVideoPress = async (videoId: number) => {
        // أظهر أيقونة التشغيل/الإيقاف عند النقر
        setShowPlayButton((prev) => ({ ...prev, [videoId]: true }));

        // أخفِ أيقونة التشغيل/الإيقاف بعد ثانيتين
        setTimeout(() => {
            setShowPlayButton((prev) => ({ ...prev, [videoId]: false }));
        }, 2000);
    };

    // معالجة تبديل البث المباشر
    const handleLiveToggle = () => {
        if (!isLive) {
            setIsLive(true);
            setShowComingSoon(true);
            setTimeout(() => {
                setShowComingSoon(false);
                setIsLive(false);
            }, 2000);
        } else {
            setIsLive(false);
        }
    };

    // معالجة الضغط الطويل
    const handleLongPress = (video: VideoItem) => {
        // تأثير اهتزازي قوي
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // تحديد الفيديو وإظهار القائمة السفلية
        setSelectedVideo(video);
        setShowBottomSheet(true);
    };

    const renderVideo = ({
        item,
        index,
    }: {
        item: VideoItem;
        index: number;
    }) => {
        const isActive = index === activeVideoIndex;

        // إعداد القيم المتحركة عند تغيير العناصر المرئية
        if (!heartAnim.current[item.id]) {
            heartAnim.current[item.id] = new Animated.Value(0);
        }

        return (
            <VideoItem
                item={item}
                isActive={isActive}
                handleVideoPress={handleVideoPress}
                handleLike={handleLike}
                handleSave={handleSave}
                handleShare={handleShare}
                showHeart={showHeart}
                heartAnim={heartAnim.current}
                isRTL={isRTL}
                router={router}
                onLongPress={handleLongPress}
            />
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* الشريط العلوي */}
            <SafeAreaView style={styles.header}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            router.push("/(tabs)/search" as any);
                        }}
                    >
                        <Ionicons name="search" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toggleContainer}
                        onPress={handleLiveToggle}
                    >
                        <View style={styles.liveContainer}>
                            {isLive ? (
                                <>
                                    <View style={styles.liveIndicator} />
                                    <Text style={styles.liveText}>
                                        {t("content.live")}
                                    </Text>
                                    <Image
                                        source={require("../../assets/images/Logo.jpg")}
                                        style={styles.logoImage}
                                    />
                                </>
                            ) : (
                                <>
                                    <Image
                                        source={require("../../assets/images/fares-logo.png")}
                                        style={styles.faresLogo}
                                    />
                                    <Text style={styles.faresText}>
                                        {t("content.faresAlRoya")}
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* رسالة قريباً */}
                    {showComingSoon && (
                        <View style={styles.comingSoonContainer}>
                            <Text style={styles.comingSoonText}>
                                {t("content.comingSoon")}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            router.push("/(tabs)/notifications" as any);
                        }}
                    >
                        <Ionicons name="notifications" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* قائمة الفيديوهات */}
            <FlatList
                ref={flatListRef}
                data={videos}
                renderItem={renderVideo}
                keyExtractor={(item) => `video-${item.id}`}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    if (!loading && hasMorePages) {
                        setCurrentPage((prev) => prev + 1);
                        loadVideos(currentPage + 1);
                    }
                }}
                onEndReachedThreshold={0.5}
                onRefresh={() => {
                    setRefreshing(true);
                    setCurrentPage(1);
                    loadVideos(1, true);
                }}
                refreshing={refreshing}
                onScroll={(e) => {
                    const index = Math.round(
                        e.nativeEvent.contentOffset.y /
                            (height - BOTTOM_TAB_HEIGHT)
                    );
                    setActiveVideoIndex(index);
                }}
                getItemLayout={(data, index) => ({
                    length: height - BOTTOM_TAB_HEIGHT,
                    offset: (height - BOTTOM_TAB_HEIGHT) * index,
                    index,
                })}
                ListFooterComponent={() =>
                    loading && !refreshing ? (
                        <View style={styles.loader}>
                            <ActivityIndicator color="#fff" />
                        </View>
                    ) : null
                }
            />

            {/* Bottom Sheet للخيارات */}
            {selectedVideo && (
                <VideoOptionsBottomSheet
                    isVisible={showBottomSheet}
                    onClose={() => setShowBottomSheet(false)}
                    video={selectedVideo}
                    isRTL={isRTL}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === "android" ? 40 : 0,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    toggleContainer: {
        alignItems: "center",
    },
    liveContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ff0000",
        marginRight: 6,
    },
    liveText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-bold",
        marginRight: 6,
    },
    logoImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    faresLogo: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 6,
    },
    faresText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-bold",
    },
    videoContainer: {
        width,
        height: height - BOTTOM_TAB_HEIGHT,
    },
    videoWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    video: {
        width: "100%",
        height: "100%",
    },
    gradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    userInfo: {
        alignItems: "flex-end",
        justifyContent: "space-between",
        width: "100%",
    },
    DataContainer: {
        width: "63%",
        alignItems: "flex-start",
    },
    arabicDataContainer: {
        width: "63%",
        alignItems: "flex-end",
    },
    username: {
        color: "#fff",
        fontSize: 18,
        fontFamily: "somar-bold",
    },
    userHandle: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-medium",
        opacity: 0.8,
        marginBottom: 8,
    },
    description: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-regular",
        lineHeight: 20,
        marginBottom: 8,
    },
    views: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "somar-regular",
        opacity: 0.7,
    },
    ReactionContainer: {
        width: "37%",
        paddingVertical: 20,
        alignItems: "flex-end",
        position: "relative",
        height: 100,
    },
    ReactionContainerAr: {
        width: "37%",
        paddingVertical: 20,
        alignItems: "flex-start",
        position: "relative",
        height: 100,
    },
    avatarContainer: {
        position: "absolute",
        width: 60,
        height: 60,
        zIndex: 10,
        top: "70%", // توسيط عمودي
        marginTop: -30, // نصف الارتفاع للتوسيط
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: "#fff",
        backgroundColor: "#fff",
    },
    addIconContainer: {
        position: "absolute",
        bottom: -12,
        right: 10,
        backgroundColor: "#000",
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
        zIndex: 30,
    },
    loader: {
        padding: 20,
    },
    playIconContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    heartAnimContainer: {
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        width: 150,
        height: 150,
    },
    heartGlow: {
        shadowColor: "#ff0066",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    comingSoonContainer: {
        position: "absolute",
        top: Platform.OS === "ios" ? 100 : 80,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 100,
    },
    comingSoonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "somar-bold",
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    likeButton: {
        position: "absolute",
        height: 52,
        width: 35,
        alignItems: "center",
        justifyContent: "space-between",
        top: -51,
        right: 10,
    },
    commentButton: {
        position: "absolute",
        top: -35,
        right: 63,
    },
    saveButton: {
        position: "absolute",
        top: 10,
        right: 88,
    },
    shareButton: {
        position: "absolute",
        top: 60,
        right: 88,
        height: 52,
        alignItems: "center",
        justifyContent: "space-between",
    },
    likeCount: {
        fontSize: 12,
        fontWeight: "500",
        color: "#fff",
        marginTop: 5,
    },
    // أنماط أزرار التفاعل للعربية (RTL)
    likeButtonAr: {
        position: "absolute",
        height: 52,
        width: 35,
        alignItems: "center",
        justifyContent: "space-between",
        top: -51,
        left: 10,
    },
    commentButtonAr: {
        position: "absolute",
        top: -35,
        left: 63,
    },
    saveButtonAr: {
        position: "absolute",
        top: 10,
        left: 88,
    },
    shareButtonAr: {
        position: "absolute",
        top: 60,
        left: 88,
        height: 52,
        alignItems: "center",
        justifyContent: "space-between",
    },
    // أنماط Bottom Sheet
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    closeArea: {
        flex: 1,
    },
    bottomSheetContainer: {
        height: height * 0.65,
        width: "100%",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
    blurBackground: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    bottomSheetContent: {
        flex: 1,
        paddingBottom: Platform.OS === "ios" ? 40 : 20,
    },
    handle: {
        alignSelf: "center",
        width: 50,
        height: 5,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 3,
        marginTop: 10,
        marginBottom: 20,
    },
    videoInfo: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    bottomSheetAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    videoTextInfo: {
        marginLeft: 15,
        flex: 1,
    },
    videoTitle: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "somar-bold",
    },
    videoAuthor: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        fontFamily: "somar-regular",
    },
    primaryActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    actionButton: {
        alignItems: "center",
        justifyContent: "center",
        width: 80,
    },
    actionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    actionLabel: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "somar-regular",
        textAlign: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginHorizontal: 20,
        marginBottom: 20,
    },
    secondaryActions: {
        paddingHorizontal: 20,
    },
    secondaryAction: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
    },
    secondaryActionText: {
        color: "#fff",
        marginLeft: 15,
        fontSize: 16,
        fontFamily: "somar-regular",
    },
    toastContainer: {
        position: "absolute",
        top: height / 2,
        alignSelf: "center",
        borderRadius: 25,
        overflow: "hidden",
    },
    toastBlur: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
    },
    toastText: {
        color: "#fff",
        fontSize: 15,
        fontFamily: "somar-medium",
    },
});
