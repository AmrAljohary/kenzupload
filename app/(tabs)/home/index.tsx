import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    forwardRef,
    useImperativeHandle,
} from "react";
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
    TextInput,
    Keyboard,
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
import { Text } from "../../../components/ui/Text";
import { LinearGradient } from "expo-linear-gradient";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView, VideoSource } from "expo-video";
import {
    useRouter,
    useNavigation,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useAppLanguage } from "../../../hooks/useLanguage";
import { api } from "../../../services/axios";
import { useAuth } from "../../../hooks/useAuth";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { State } from "react-native-gesture-handler";
import {
    LongPressGestureHandler,
    TapGestureHandler,
} from "react-native-gesture-handler";
import Heart from "../../../assets/icons/svgs/Heart";
import Comment from "../../../assets/icons/svgs/Comment";
import Save from "../../../assets/icons/svgs/Save";
import ShareIcon from "../../../assets/icons/svgs/Share";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
    BottomSheetScrollView,
    BottomSheetTextInput,
    BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
const { width, height } = Dimensions.get("window");
const BOTTOM_TAB_HEIGHT = 40;
const DOUBLE_CLICK_DELAY = 300;
const PRELOAD_VIDEO_COUNT = 10; // عدد الفيديوهات المحملة مسبقاً

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
    user: VideoUser & {
        is_following?: boolean;
    };
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
    handleFollow: (userId: number) => void;
    showHeart: { [key: number]: boolean };
    heartAnim: { [key: number]: Animated.Value };
    isRTL: boolean;
    router: any;
    onLongPress: (video: VideoItem) => void;
    handleShowComments: (videoId: number) => void;
    user: any;
}
// واجهة للتعليقات
interface CommentItem {
    id: number;
    user: {
        id: number;
        name: string;
        username: string;
        profile_image: string;
    };
    content: string;
    created_at: string;
    parent_id?: number;
    reactions: {
        count: number;
        is_liked: boolean;
    };
    main_comments?: CommentItem[];
}

// واجهة لرد API التعليقات
interface CommentsApiResponse {
    status: string;
    main_comments: CommentItem[];
}

// واجهة لمكون شاشة التعليقات
interface CommentsBottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    videoId: number;
    isRTL: boolean;
}
const VideoOptionsBottomSheet = ({
    isVisible,
    onClose,
    video,
    isRTL,
}: VideoOptionsBottomSheetProps) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // نقاط التثبيت للبوتوم شيت
    const snapPoints = useMemo(() => ["65%"], []);

    // رسم الخلفية المعتمة
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.8}
            />
        ),
        []
    );

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
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.optionsSheetIndicator}
            backgroundStyle={styles.optionsSheetBackground}
            enablePanDownToClose={true}
            onDismiss={onClose}
        >
            <View style={styles.optionsContainer}>
                {/* معلومات الفيديو والمستخدم */}
                <View style={styles.videoInfo}>
                    <Image
                        source={{ uri: video.user.profile_image }}
                        style={styles.bottomSheetAvatar}
                    />
                    <View style={styles.videoTextInfo}>
                        <Text style={styles.videoTitle} numberOfLines={1}>
                            {video.title || "فيديو رائع"}
                        </Text>
                        <Text style={styles.videoAuthor} numberOfLines={1}>
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
                            <AntDesign name="flag" size={22} color="#E17055" />
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
                        onPress={() => handleAction("notInterested")}
                    >
                        <AntDesign name="dislike2" size={22} color="#777" />
                        <Text style={styles.secondaryActionText}>غير مهتم</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryAction}
                        onPress={() => handleAction("dontRecommend")}
                    >
                        <Feather name="slash" size={22} color="#777" />
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
                        <Feather name="maximize" size={22} color="#777" />
                        <Text style={styles.secondaryActionText}>
                            تشغيل بوضع الشاشة الكاملة
                        </Text>
                    </TouchableOpacity>
                </View>

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
        </BottomSheetModal>
    );
};

// مكون منفصل للفيديو لحل مشكلة استخدام Hooks
export const VideoItem = React.memo(
    ({
        item,
        isActive,
        handleVideoPress,
        handleLike,
        handleSave,
        handleShare,
        handleFollow,
        showHeart,
        heartAnim,
        isRTL,
        router,
        onLongPress,
        handleShowComments,
        user,
    }: VideoItemProps) => {
        console.log("item", item.url);
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
        // إضافة حالة تحميل الفيديو
        const [isVideoLoading, setIsVideoLoading] = useState(true);

        // مكان ظهور القلب عند النقر المزدوج
        const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

        // متغير محلي لتتبع حالة القلب
        const [localShowHeart, setLocalShowHeart] = useState<boolean>(false);

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

        // تأثير رسوم متحركة لمؤشر التحميل
        const loadingBarAnim = useRef(new Animated.Value(0)).current;

        // إعداد تأثير وميض شريط التحميل
        useEffect(() => {
            if (isVideoLoading && isActive) {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(loadingBarAnim, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.linear,
                        }),
                        Animated.timing(loadingBarAnim, {
                            toValue: 0.3,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.linear,
                        }),
                    ])
                ).start();
            } else {
                // إيقاف التأثير عند اكتمال التحميل
                loadingBarAnim.stopAnimation();
                loadingBarAnim.setValue(0);
            }

            // تأخير إيقاف التحميل للعرض التجريبي
            if (isActive) {
                const timeout = setTimeout(() => {
                    setIsVideoLoading(false);
                }, 2000);

                return () => clearTimeout(timeout);
            }
        }, [isVideoLoading, isActive]);

        // تحديث حالة التشغيل عند تغيير الفيديو النشط
        useEffect(() => {
            if (isActive) {
                if (isPaused) {
                    videoPlayer.pause();
                } else {
                    videoPlayer.play();
                    // إعادة تعيين حالة التحميل عند تغيير الفيديو النشط
                    setIsVideoLoading(true);
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

            // إذا كان الفيديو معجب به بالفعل، نعرض الرسوم المتحركة فقط
            if (item.is_liked || item.has_liked) {
                // إنشاء تأثير القلب النابض للعرض فقط
                setLocalShowHeart(true);

                // تأثير حركي محسن للقلب
                if (!heartAnim[item.id]) {
                    heartAnim[item.id] = new Animated.Value(0);
                } else {
                    heartAnim[item.id].setValue(0);
                }

                // تأثير نبض أكثر نعومة وتدرجاً
                Animated.sequence([
                    // ظهور وتكبير سريع
                    Animated.spring(heartAnim[item.id], {
                        toValue: 1.2,
                        tension: 80,
                        friction: 3,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setLocalShowHeart(false);
                });
            } else {
                // إذا لم يكن معجب به، قم بتنفيذ وظيفة الإعجاب
                handleLike(item.id, tapLocation);
            }
        };

        // متغيرات للتحريك
        const followBtnScale = useRef(new Animated.Value(1)).current;
        const [isFollowing, setIsFollowing] = useState(
            item.user.is_following || false
        );
        const [followBtnAnimation, setFollowBtnAnimation] = useState(false);

        // دالة معالجة النقر على زر المتابعة
        const onFollowPress = () => {
            if (isFollowing) return; // منع النقر المتكرر

            setFollowBtnAnimation(true);

            // تأثير حركي جميل
            Animated.sequence([
                Animated.timing(followBtnScale, {
                    toValue: 0.7,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(followBtnScale, {
                    toValue: 1.3,
                    friction: 3,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.spring(followBtnScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setFollowBtnAnimation(false);
                setIsFollowing(true);
                handleFollow(item.user.id);
            });

            // اهتزاز للتغذية الراجعة
            if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        };

        return (
            <View
                style={[
                    styles.videoContainer,
                    { height: height - BOTTOM_TAB_HEIGHT },
                ]}
            >
                <View style={styles.videoWrapper}>
                    <LongPressGestureHandler
                      
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
                                <VideoView
                                    style={styles.video}
                                    player={videoPlayer}
                                    allowsFullscreen
                                    allowsPictureInPicture
                                    nativeControls={false}
                                />
                            </TapGestureHandler>
                        </TapGestureHandler>
                    </LongPressGestureHandler>
                    {/* أيقونة التشغيل/الإيقاف - تظهر فقط عند الإيقاف */}
                    {isPaused && isActive && (
                        <View style={styles.playIconContainer}>
                            <Ionicons name="play" size={40} color="#fff" />
                        </View>
                    )}

                    {/* رسوم متحركة للقلب الرئيسي */}
                    {(showHeart[item.id] || localShowHeart) && (
                        <Animated.View
                            style={[
                                styles.heartAnimContainer,
                                {
                                    position: "absolute",
                                    left: heartPosition.x - 75, // تركيز القلب على موقع النقر
                                    top: heartPosition.y - 75,
                                    transform: [
                                        {
                                            scale: heartAnim[item.id],
                                        },
                                        {
                                            translateY: heartAnim[
                                                item.id
                                            ].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -20],
                                            }),
                                        },
                                        {
                                            rotate: heartAnim[
                                                item.id
                                            ].interpolate({
                                                inputRange: [0, 0.3, 0.6, 1],
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
                                opacity: heart.animValue.interpolate({
                                    inputRange: [0, 0.7, 1],
                                    outputRange: [0, 1, 0],
                                }),
                                transform: [
                                    {
                                        translateY: heart.animValue.interpolate(
                                            {
                                                inputRange: [0, 1],
                                                outputRange: [0, -150],
                                            }
                                        ),
                                    },
                                    {
                                        translateX: heart.animValue.interpolate(
                                            {
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [
                                                    0,
                                                    (Math.random() - 0.5) * 80,
                                                    (Math.random() - 0.5) * 100,
                                                ],
                                            }
                                        ),
                                    },
                                    {
                                        rotate: heart.animValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [
                                                "0deg",
                                                `${(Math.random() - 0.5) * 90}deg`,
                                            ],
                                        }),
                                    },
                                    {
                                        scale: heart.animValue.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0.8, 1.2, 0.8],
                                        }),
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

                    {/* مؤشر تحميل الفيديو */}
                    {isVideoLoading && isActive && (
                        <Animated.View
                            style={[
                                styles.loadingBar,
                                {
                                    opacity: loadingBarAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                },
                            ]}
                        />
                    )}
                </View>

                {/* معلومات المستخدم والتفاعلات */}
                <LinearGradient
                    colors={[
                        "transparent",
                        "rgba(0,0,0,0.5)",
                        "rgba(0,0,0,0.9)",
                    ]}
                    locations={[0, 0.5, 0.9]}
                    style={styles.gradient}
                >
                    <View
                        style={[
                            styles.userInfo,
                            {
                                flexDirection: isRTL ? "row" : "row-reverse",
                            },
                        ]}
                    >
                        {/* معلومات المستخدم */}
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
                            {/* صورة المستخدم والزر */}
                            <TouchableOpacity
                                style={[
                                    styles.avatarContainer,
                                    isRTL
                                        ? {
                                              left: 70,
                                              right: "auto",
                                          }
                                        : {
                                              right: 70,
                                              left: "auto",
                                          },
                                    isRTL
                                        ? { marginLeft: 10 }
                                        : { marginRight: 10 },
                                ]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/Profile",
                                        params: {
                                            id: item.user.id,
                                        },
                                    })
                                }
                            >
                                <Image
                                    source={{
                                        uri: item.user.profile_image,
                                    }}
                                    style={styles.avatar}
                                />

                                {/* زر المتابعة */}
                                {item.user.id !== user?.id && (
                                    <TouchableOpacity
                                        style={[
                                            {
                                                position: "absolute",
                                                bottom: -12,
                                                right: 10,
                                                backgroundColor: isFollowing
                                                    ? "#333"
                                                    : "#000",
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 2,
                                                borderColor: "#fff",
                                                zIndex: 30,
                                                transform: [
                                                    {
                                                        scale: followBtnAnimation
                                                            ? followBtnScale
                                                            : 1,
                                                    },
                                                ],
                                            },
                                        ]}
                                        onPress={onFollowPress}
                                        disabled={isFollowing}
                                        activeOpacity={0.7}
                                    >
                                        {isFollowing ? (
                                            <Ionicons
                                                name="checkmark"
                                                size={16}
                                                color="#fff"
                                            />
                                        ) : (
                                            <Ionicons
                                                name="add"
                                                size={18}
                                                color="#fff"
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
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
                                        item.is_liked || item.has_liked
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
                                onPress={() => handleShowComments(item.id)}
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
                                <Save
                                    fill={item.is_saved ? "#FFE400" : "#fff"}
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
                                <ShareIcon />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    }
);

// مكون شاشة التعليقات كـ Bottom Sheet
const CommentsBottomSheet = forwardRef(
    ({ isVisible, onClose, videoId, isRTL }: CommentsBottomSheetProps, ref) => {
        const bottomSheetModalRef = useRef<BottomSheet>(null);
        const [comments, setComments] = useState<CommentItem[]>([]);
        const [loading, setLoading] = useState(true);
        const [newComment, setNewComment] = useState("");
        const [submitting, setSubmitting] = useState(false);
        const { user } = useAuth();
        const inputRef = useRef<any>(null);
        const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
        const [keyboardHeight, setKeyboardHeight] = useState(0);
        const [keyboardVisible, setKeyboardVisible] = useState(false);
        const [commentsSheetHeight, setCommentsSheetHeight] = useState(0);

        // نقاط التثبيت للبوتوم شيت - استخدم ارتفاع أكبر ليأخذ أغلب الشاشة
        const snapPoints = useMemo(() => ["70%"], []);

        // إضافة مستمعات لارتفاع لوحة المفاتيح
        useEffect(() => {
            const keyboardDidShowListener = Keyboard.addListener(
                Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
                (e) => {
                    setKeyboardHeight(e.endCoordinates.height);
                    setKeyboardVisible(true);
                }
            );

            const keyboardDidHideListener = Keyboard.addListener(
                Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
                () => {
                    setKeyboardHeight(0);
                    setKeyboardVisible(false);
                }
            );

            return () => {
                keyboardDidShowListener.remove();
                keyboardDidHideListener.remove();
            };
        }, []);

        // قياس ارتفاع شاشة التعليقات
        const handleBottomSheetLayout = (event: {
            nativeEvent: { layout: { height: number } };
        }) => {
            const { height } = event.nativeEvent.layout;
            setCommentsSheetHeight(height);
        };

        // رسم الخلفية المعتمة
        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.8}
                />
            ),
            []
        );

        // تحميل التعليقات
        const loadComments = async () => {
            try {
                setLoading(true);

                // طلب API حقيقي
                const response = await api.get(
                    `https://kenzback.rascoda.com/api/videos/${videoId}/main/comments`
                );
                console.log("response?.data", response?.data);

                // تصحيح نوع البيانات المستلمة
                if (response?.data) {
                    // استخدام معامل 'as any' لتجنب خطأ التحقق من النوع
                    const data = response.data as any;
                    const commentData = data.main_comments || [];
                    setComments(commentData);
                } else {
                    setComments([]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error loading comments:", error);
                setLoading(false);
            }
        };

        // إرسال تعليق جديد
        const handleSendComment = async () => {
            if (!newComment.trim()) return;

            try {
                setSubmitting(true);

                // بناء بيانات التعليق للإرسال
                const commentData = {
                    content: newComment,
                    parent_id: replyingTo ? replyingTo.id : null,
                };

                // إضافة التعليق محلياً للتجربة السريعة
                const mockNewComment: CommentItem = {
                    id: Date.now(),
                    user: {
                        id: user?.id || 4,
                        name: user?.full_name || "أنت",
                        username: user?.username || "you",
                        profile_image:
                            user?.profile_image ||
                            "https://i.pravatar.cc/150?img=4",
                    },
                    content: newComment,
                    created_at: "الآن",
                    parent_id: replyingTo ? replyingTo.id : undefined,
                    reactions: {
                        count: 0,
                        is_liked: false,
                    },
                };

                if (replyingTo) {
                    // في حالة الرد نضيف التعليق إلى التعليق الأصلي
                    setComments((prevComments) =>
                        prevComments.map((comment) => {
                            if (comment.id === replyingTo.id) {
                                return {
                                    ...comment,
                                    main_comments: [
                                        mockNewComment,
                                        ...(comment.main_comments || []),
                                    ],
                                };
                            }
                            return comment;
                        })
                    );
                } else {
                    // في حالة تعليق عادي
                    setComments((prev) => [mockNewComment, ...prev]);
                }

                // إعادة تعيين حالة التعليق
                setNewComment("");
                setReplyingTo(null);

                // إرسال طلب API باستخدام العنوان المحدد
                await api.post(
                    `https://kenzback.rascoda.com/api/videos/${videoId}/comments`,
                    {
                        content: newComment,
                        parent_id: replyingTo ? replyingTo.id : null,
                    }
                );

                // إعادة تحميل التعليقات بعد النشر لتحديث البيانات الفعلية
                await loadComments();

                setSubmitting(false);
            } catch (error) {
                console.error("Error sending comment:", error);
                setSubmitting(false);
            }
        };

        // ضبط الرد على تعليق
        const handleReplyToComment = (comment: CommentItem) => {
            setReplyingTo(comment);
            setNewComment(`رد على @${comment.user.username}: `);
            inputRef.current?.focus();
        };

        // إلغاء الرد
        const cancelReply = () => {
            setReplyingTo(null);
            setNewComment("");
        };

        // الإعجاب بتعليق
        const handleLikeComment = async (commentId: number) => {
            try {
                // تحديث واجهة المستخدم فورًا
                setComments((prev) =>
                    prev.map((comment) => {
                        // للتعليقات الرئيسية
                        if (comment.id === commentId) {
                            const newIsLiked = !comment.reactions.is_liked;
                            return {
                                ...comment,
                                reactions: {
                                    ...comment.reactions,
                                    is_liked: newIsLiked,
                                    count: newIsLiked
                                        ? comment.reactions.count + 1
                                        : comment.reactions.count - 1,
                                },
                            };
                        }

                        // للردود على التعليقات
                        if (
                            comment.main_comments &&
                            comment.main_comments.length > 0
                        ) {
                            return {
                                ...comment,
                                main_comments: comment.main_comments.map(
                                    (reply) => {
                                        if (reply.id === commentId) {
                                            const newIsLiked =
                                                !reply.reactions.is_liked;
                                            return {
                                                ...reply,
                                                reactions: {
                                                    ...reply.reactions,
                                                    is_liked: newIsLiked,
                                                    count: newIsLiked
                                                        ? reply.reactions
                                                              .count + 1
                                                        : reply.reactions
                                                              .count - 1,
                                                },
                                            };
                                        }
                                        return reply;
                                    }
                                ),
                            };
                        }

                        return comment;
                    })
                );

                // إرسال طلب التفاعل إلى الـ API
                await api.post(
                    `https://kenzback.rascoda.com/api/comments/${commentId}/react`,
                    {
                        reaction: "like",
                    }
                );

                // إعادة تحميل التعليقات للتأكد من البيانات الدقيقة
                await loadComments();
            } catch (error) {
                console.error("Error liking comment:", error);
                // في حالة الخطأ نعيد تحميل التعليقات للحصول على الحالة الصحيحة
                await loadComments();
            }
        };

        // عرض عنصر التعليق الفرعي/الرد
        const renderReply = ({ item }: { item: CommentItem }) => (
            <View style={[styles.commentItem, styles.replyItem]}>
                <Image
                    source={{ uri: item.user.profile_image }}
                    style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                            {item.user.name}
                        </Text>
                        <Text style={styles.commentTime}>
                            {item.created_at}
                        </Text>
                    </View>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity
                            style={styles.commentLikeBtn}
                            onPress={() => handleLikeComment(item.id)}
                        >
                            <AntDesign
                                name={
                                    item.reactions.is_liked ? "heart" : "hearto"
                                }
                                size={16}
                                color={
                                    item.reactions.is_liked ? "#ff3366" : "#888"
                                }
                            />
                            <Text style={styles.commentLikesCount}>
                                {item.reactions.count}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );

        // عرض عنصر تعليق
        const renderComment = ({ item }: { item: CommentItem }) => (
            <View>
                <View style={styles.commentItem}>
                    <Image
                        source={{ uri: item.user.profile_image }}
                        style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>
                                {item.user.name}
                            </Text>
                            <Text style={styles.commentTime}>
                                {item.created_at}
                            </Text>
                        </View>
                        <Text style={styles.commentText}>{item.content}</Text>
                        <View style={styles.commentActions}>
                            <TouchableOpacity
                                style={styles.commentLikeBtn}
                                onPress={() => handleLikeComment(item.id)}
                            >
                                <AntDesign
                                    name={
                                        item.reactions.is_liked
                                            ? "heart"
                                            : "hearto"
                                    }
                                    size={16}
                                    color={
                                        item.reactions.is_liked
                                            ? "#ff3366"
                                            : "#888"
                                    }
                                />
                                <Text style={styles.commentLikesCount}>
                                    {item.reactions.count}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.commentReplyBtn}
                                onPress={() => handleReplyToComment(item)}
                            >
                                <Text style={styles.commentActionText}>
                                    الرد
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* عرض الردود على هذا التعليق إن وجدت */}
                {item.main_comments && item.main_comments.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {item.main_comments.map((reply) => (
                            <View key={`reply-${reply.id}`}>
                                {renderReply({ item: reply })}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );

        useImperativeHandle(ref, () => ({
            open: () => bottomSheetModalRef.current?.expand(),
            close: () => bottomSheetModalRef.current?.close(),
        }));

        useEffect(() => {
            setComments([]); // تفريغ التعليقات مؤقتًا
            if (videoId) {
                loadComments();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [videoId]);

        return (
            <BottomSheet
                ref={bottomSheetModalRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
            >
                <BottomSheetScrollView>
                    <View style={styles.commentsContainer}>
                        {/* عنوان التعليقات */}
                        <View style={styles.commentsHeader}>
                            <Text style={styles.commentsTitle}>
                                التعليقات
                                <Text style={styles.commentsCount}>
                                    {comments.length}
                                </Text>
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <AntDesign
                                    name="close"
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                        {/* قائمة التعليقات */}
                        {loading ? (
                            <View style={styles.loadingCommentsContainer}>
                                <ActivityIndicator size="large" color="#666" />
                            </View>
                        ) : (
                            <BottomSheetFlatList
                                data={comments}
                                keyExtractor={(item) => `comment-${item.id}`}
                                renderItem={renderComment}
                                contentContainerStyle={[
                                    styles.commentsList,
                                    { paddingBottom: replyingTo ? 160 : 100 },
                                ]}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                        {/* بار إظهار حالة الرد على تعليق */}
                        {replyingTo && (
                            <View style={styles.replyBar}>
                                <Text style={styles.replyingToText}>
                                    رد على
                                    <Text style={styles.replyingToName}>
                                        @{replyingTo.user.username}
                                    </Text>
                                </Text>
                                <TouchableOpacity
                                    onPress={cancelReply}
                                    style={styles.cancelReplyButton}
                                >
                                    <AntDesign
                                        name="close"
                                        size={16}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </BottomSheetScrollView>
                <View style={[styles.newCommentContainer]}>
                    <Image
                        source={{
                            uri:
                                user?.profile_image ||
                                "https://i.pravatar.cc/150?img=4",
                        }}
                        style={styles.userCommentAvatar}
                    />
                    <BottomSheetTextInput
                        ref={inputRef}
                        style={styles.commentInput}
                        placeholder="اكتب تعليقاً..."
                        placeholderTextColor="#888"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline={true}
                        maxLength={200}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !newComment.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendComment}
                        disabled={!newComment.trim() || submitting}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={newComment.trim() ? "#0984E3" : "#888"}
                            style={{ transform: [{ rotate: "180deg" }] }}
                        />
                    </TouchableOpacity>
                </View>
            </BottomSheet>
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
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["25%", "50%", "70%"], []);
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
    const [showUploadBadge, setShowUploadBadge] = useState(false);
    const commentsSheetRef = useRef<any>(null);

    // إضافة استخدام params للتحقق من وجود معرف فيديو محدد
    const params = useLocalSearchParams();
    const videoIdParam = params.id ? Number(params.id) : null;

    // إظهار شارة رفع الفيديو إذا تم رفع فيديو جديد
    useEffect(() => {
        if (params.uploadedVideo === "1" || params.uploadedVideo === "true") {
            setShowUploadBadge(true);
            setTimeout(() => setShowUploadBadge(false), 2000);
        }
    }, [params.uploadedVideo]);

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
                if (paginationLinks) {
                    setHasMorePages(
                        paginationLinks.currentPages <
                            parseInt(paginationLinks.links.last.split("page=")[1])
                    );
                } else {
                    setHasMorePages(false); // Default to no more pages if paginationLinks is missing
                }

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

    // إضافة وظيفة تحميل الفيديوهات من معرف محدد
    const loadVideosFromId = async (id: number) => {
        try {
            setLoading(true);
            const response = await api.get(`/videos/from/${id}`);

            const resData = response.data as any;
            if (resData && resData.status === 200 && resData.data) {
                const videosData = resData.data;

                // إعداد القيم المتحركة مسبقًا لكل فيديو
                videosData.forEach((video: VideoItem) => {
                    if (!heartAnim.current[video.id]) {
                        heartAnim.current[video.id] = new Animated.Value(0);
                    }
                });

                setVideos(videosData);

                // تمرير إلى الفيديو الأول الذي يطابق المعرف
                const index = videosData.findIndex(
                    (v: VideoItem) => v.id === id
                );
                if (index !== -1) {
                    setActiveVideoIndex(index);
                    // تأخير قصير للتأكد من أن القائمة تم تحميلها
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({
                            index,
                            animated: false,
                        });
                    }, 300);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error("Error loading videos from ID:", error);
            setLoading(false);
            // في حالة الخطأ، تحميل الفيديوهات العادية
            loadVideos(1, true);
        }
    };

    // التحقق من وجود معرف فيديو في params
    useEffect(() => {
        if (videoIdParam) {
            loadVideosFromId(videoIdParam);
        } else {
            loadVideos(1);
        }
    }, [videoIdParam]);

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
            const video = videos.find((v) => v.id === videoId);
            if (!video) return;

            // منع النقرات المتعددة المتتالية
            if (showHeart[videoId]) return;

            // تحديث الواجهة فوراً للتفاعل السريع
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

            // إرسال الطلب إلى API
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
            // await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log("videoId", videoId);
            const video = videos.find((v) => v.id === videoId);
            console.log("video", video);
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
        // فقط فتح الـ BottomSheet للفيديو المحدد
        setSelectedVideo(video);
        setShowBottomSheet(true);
    };

    // تحسين دالة معالجة المتابعة
    const handleFollow = async (userId: number) => {
        try {
            // تأثير لمسي
            if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            // تحديث الواجهة فورًا لتجربة مستخدم أفضل
            const updatedVideos = videos.map((video) => {
                if (video.user.id === userId) {
                    return {
                        ...video,
                        user: {
                            ...video.user,
                            is_following: true,
                        },
                    };
                }
                return video;
            });

            setVideos(updatedVideos);

            // إظهار رسالة نجاح مؤقتة
            const username =
                videos.find((v) => v.user.id === userId)?.user.name || "";
            const toastMessage = username
                ? `تمت متابعة ${username}`
                : "تمت المتابعة بنجاح";

            // عرض رسالة في الكونسول
            console.log(toastMessage);

            // عرض رسالة للمستخدم على التطبيق
            if (Platform.OS === "android") {
                ToastAndroid.show(toastMessage, ToastAndroid.SHORT);
            } else if (Platform.OS === "ios") {
                // يمكن استخدام مكتبة للإشعارات على iOS
                Alert.alert(
                    "",
                    toastMessage,
                    [{ text: "حسناً", style: "cancel" }],
                    { cancelable: true }
                );
            }

            // طلب API للمتابعة
            await api.post(`users/${userId}/follow`);
        } catch (error) {
            console.error("خطأ في متابعة المستخدم:", error);

            // عكس التغييرات في حالة الخطأ
            const revertedVideos = videos.map((video) => {
                if (video.user.id === userId) {
                    return {
                        ...video,
                        user: {
                            ...video.user,
                            is_following: false,
                        },
                    };
                }
                return video;
            });

            setVideos(revertedVideos);

            // عرض رسالة خطأ
            if (Platform.OS === "android") {
                ToastAndroid.show("فشلت عملية المتابعة", ToastAndroid.SHORT);
            } else if (Platform.OS === "ios") {
                Alert.alert(
                    "خطأ",
                    "فشلت عملية المتابعة، حاول مرة أخرى لاحقًا.",
                    [{ text: "حسناً", style: "cancel" }]
                );
            }
        }
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
                handleFollow={handleFollow}
                showHeart={showHeart}
                heartAnim={heartAnim.current}
                isRTL={isRTL}
                router={router}
                onLongPress={handleLongPress}
                handleShowComments={handleShowComments}
                user={user}
            />
        );
    };

    // عرض التعليقات
    const handleShowComments = (videoId: number) => {
        setCurrentVideoId(videoId);
        setCommentsVisible(true);
        setTimeout(() => {
            commentsSheetRef.current?.open();
        }, 50);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {/* شارة رفع الفيديو */}
            {showUploadBadge && (
                <View style={styles.uploadBadge}>
                    <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#25D366"
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.uploadBadgeText}>
                        {t("addContent.uploadedBadge")}
                    </Text>
                </View>
            )}

            {/* الشريط العلوي */}
            <SafeAreaView style={styles.header}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            router.push("/(tabs)/home/search");
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
                                        source={require("../../../assets/images/Logo.jpg")}
                                        style={styles.logoImage}
                                    />
                                </>
                            ) : (
                                <>
                                    <Image
                                        source={require("../../../assets/images/fares-logo.png")}
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
                            router.push("/(tabs)/home/notifications" as any);
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
                ListEmptyComponent={() =>
                    !loading && videos.length === 0 ? (
                        <View style={styles.noVideosContainer}>
                            <Ionicons
                                name="videocam-off-outline"
                                size={60}
                                color="#999"
                            />
                            <Text style={styles.noVideosText}>
                                {t("home.noVideosTitle")}
                            </Text>
                            <Text style={styles.noVideosDescription}>
                                {t("home.noVideosDescription")}
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push("/(tabs)/add")}
                                style={styles.createVideoButton}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="#000" />
                                <Text style={styles.createVideoButtonText}>
                                    {t("home.createFirstVideo")}
                                </Text>
                            </TouchableOpacity>
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

            {/* Bottom Sheet للتعليقات */}
            {currentVideoId && (
                <CommentsBottomSheet
                    ref={commentsSheetRef}
                    isVisible={commentsVisible}
                    onClose={() => setCommentsVisible(false)}
                    videoId={currentVideoId}
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
        shadowColor: "#000", // إضافة ظل
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
        zIndex: 100,
        height: 205,
        paddingTop: 30,
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    userInfo: {
        alignItems: "flex-end",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 120,
    },
    DataContainer: {
        width: "63%",
        alignItems: "flex-start",
        bottom: -50,
    },
    arabicDataContainer: {
        width: "63%",
        alignItems: "flex-end",
        marginBottom: -100,
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
        height: 20,
        bottom: -50,
    },
    ReactionContainerAr: {
        width: "37%",
        paddingVertical: 20,
        alignItems: "flex-start",
        position: "relative",
        height: 20,
    },
    avatarContainer: {
        position: "absolute",
        width: 60,
        height: 60,
        zIndex: 10,
        top: "70%",
        marginTop: 0,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
        zIndex: 30,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        position: "absolute",
        bottom: 0,
        right: 0,
    },
    followingIconContainer: {
        backgroundColor: "#333",
    },
    followButtonTouchable: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
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
    // أنماط شاشة التعليقات
    commentSheetIndicator: {
        backgroundColor: "#999",
        width: 40,
        height: 5,
    },
    commentSheetBackground: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    commentsContainer: {
        flex: 1,
        position: "relative",
    },
    commentsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
        zIndex: 10,
    },
    commentsTitle: {
        fontSize: 18,
        fontFamily: "somar-bold",
        color: "#333",
    },
    commentsCount: {
        color: "#666",
        fontSize: 16,
    },
    loadingCommentsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    commentsList: {
        paddingHorizontal: 15,
        paddingBottom: 80, // اترك مساحة لمربع التعليق
    },
    commentItem: {
        flexDirection: "row",
        marginTop: 20,
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    commentContent: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 10,
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    commentAuthor: {
        fontSize: 14,
        fontFamily: "somar-bold",
        color: "#333",
    },
    commentTime: {
        fontSize: 12,
        color: "#888",
        fontFamily: "somar-regular",
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#333",
        fontFamily: "somar-regular",
        marginBottom: 5,
    },
    commentActions: {
        flexDirection: "row",
        marginTop: 5,
    },
    commentLikeBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 15,
    },
    commentLikesCount: {
        fontSize: 12,
        color: "#888",
        marginLeft: 5,
        fontFamily: "somar-regular",
    },
    commentReplyBtn: {},
    commentActionText: {
        fontSize: 12,
        color: "#888",
        fontFamily: "somar-regular",
    },
    newCommentContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#fff",
        position: "absolute",
        width: "100%",
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 100,
    },
    userCommentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    commentInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: "somar-regular",
        color: "#333",
        marginRight: 10,
        textAlign: I18nManager.isRTL ? "right" : "left",
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    replyBar: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        backgroundColor: "#f9f9f9",
        position: "absolute",
        bottom: 56, // ضبط موضع البار فوق مربع التعليق
        left: 0,
        right: 0,
        zIndex: 99,
    },
    replyingToText: {
        flex: 1,
        color: "#333",
        fontSize: 14,
        fontFamily: "somar-regular",
    },
    replyingToName: {
        fontWeight: "bold",
        color: "#0984E3",
    },
    cancelReplyButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    repliesContainer: {
        marginLeft: 20,
    },
    replyItem: {
        marginLeft: 20,
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 0,
    },
    loadingBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#fff",
    },
    // أنماط صفحة الخيارات
    optionsSheetIndicator: {
        backgroundColor: "#999",
        width: 40,
        height: 5,
    },
    optionsSheetBackground: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    optionsContainer: {
        flex: 1,
        paddingBottom: Platform.OS === "ios" ? 40 : 20,
    },
    addButtonWrapper: {
        position: "absolute",
        bottom: -12,
        right: 10,
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
    },
    rippleEffect: {
        position: "absolute",
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        zIndex: 29,
    },
    uploadBadge: {
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 30,
        left: 0,
        right: 0,
        zIndex: 1000,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 8,
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
    uploadBadgeText: {
        color: "#222",
        fontSize: 15,
        fontFamily: "somar-bold",
    },
    noVideosContainer: {
        flex: 1,
        justifyContent: "center", // تم التعديل ليصبح في المنتصف عموديًا
        alignItems: "center",
        height: height * 0.7,
        paddingHorizontal: 20,
    },
    noVideosText: {
        color: "#fff",
        fontSize: 20,
        fontFamily: "somar-bold",
        marginTop: 20,
        textAlign: "center",
    },
    noVideosDescription: {
        color: "#ccc",
        fontSize: 14,
        fontFamily: "somar-regular",
        marginTop: 10,
        textAlign: "center",
        lineHeight: 20,
    },
    createVideoButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff", // تم التعديل إلى اللون الأبيض
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        marginTop: 30,
        shadowColor: "#000", // إضافة ظل
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    createVideoButtonText: {
        color: "#000", // تم التعديل إلى اللون الأسود
        fontSize: 16,
        fontFamily: "somar-bold",
        marginLeft: 10,
    },
});
