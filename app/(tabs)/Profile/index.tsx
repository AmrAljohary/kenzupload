import TopTabs from "@/components/Profile/TopTabs";
import UserData from "@/components/Profile/userData";
import RenderData from "@/components/Profile/RenderData";
import { useAuth } from "@/hooks/useAuth";
import { useAppLanguage } from "@/hooks/useLanguage";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    StyleSheet,
    ActivityIndicator,
    Alert,
    Share,
    TouchableOpacity,
    Platform,
    View,
    Text,
} from "react-native";
import FastImage from "react-native-fast-image";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import axios from "axios";

// تعريف أنواع البيانات
type VideoDataType = "owned" | "saved" | "interacted";

// تعريف هيكل الاستجابة من API
interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
    success?: boolean;
}

// تعريف نوع المستخدم
interface UserProfile {
    id: number;
    full_name?: string;
    name?: string;
    username: string;
    profile_image?: string;
    cover_image?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    is_following?: boolean;
    videos_count?: number;
    likes_count?: number;
    total_likes?: number;
}

// تعريف نوع بيانات الفيديو
interface VideoData {
    rows: any[];
    paginationLinks?: {
        currentPages: number;
        links: {
            first: string;
            last: string;
        };
        perPage: number;
        total: number;
    };
}

// المكون الرئيسي للملف الشخصي
export default function ProfileScreen() {
    const { user } = useAuth();
    const { t, isRTL } = useAppLanguage();
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.id ? Number(params.id) : undefined;

    const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(true);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [profileLoading, setProfileLoading] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [videoData, setVideoData] = useState<any[]>([]);
    const [videoLoading, setVideoLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    // تنظيف المكون عند الخروج
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // حل مشكلة تسريب الذاكرة عند تحميل الفيديوهات
    const safeSetState = useCallback((setter: Function, value: any) => {
        if (isMounted.current) {
            setter(value);
        }
    }, []);

    // تحميل معلومات الملف الشخصي
    const loadProfileData = useCallback(async () => {
        try {
            setProfileLoading(true);
            setError(null);

            // إذا تم تحديد معرف مستخدم، قم بتحميل بيانات ذلك المستخدم
            if (userId && userId !== user?.id) {
                console.log(`Loading profile for user ID: ${userId}`);
                const response = await api.get<ApiResponse<UserProfile>>(
                    `/user/profile/${userId}`
                );

                if (response?.data?.data) {
                    // التحويل إلى كائن UserProfile
                    const userData = response.data.data;
                    setProfileUser(userData);
                    setIsMyProfile(false);
                    setIsFollowing(userData.is_following || false);
                } else {
                    setError(t("errors.userNotFound"));
                    setIsMyProfile(true);
                    // تحويل بيانات المستخدم الحالي إلى نوع UserProfile
                    const userDataResponse =
                        await api.get<ApiResponse<UserProfile>>(`/profile`);
                    if (userDataResponse?.data?.data) {
                        setProfileUser(userDataResponse.data.data);
                    }
                }
            } else {
                // استخدم بيانات المستخدم الحالي
                const userDataResponse =
                    await api.get<ApiResponse<UserProfile>>(`/profile`);
                if (userDataResponse?.data?.data) {
                    setProfileUser(userDataResponse.data.data);
                }
                setIsMyProfile(true);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            setError(t("errors.loadingFailed"));
            setIsMyProfile(true);
            // استخدام بيانات المستخدم المتاحة في حالة فشل API
            if (user) {
                setProfileUser(user as unknown as UserProfile);
            }
        } finally {
            setProfileLoading(false);
        }
    }, [userId, user]);

    // تحديد نوع البيانات بناءً على التبويب النشط
    const getDataTypeFromIndex = (index: number): VideoDataType => {
        switch (index) {
            case 0:
                return "owned";
            case 1:
                return "saved";
            case 2:
                return "interacted";
            default:
                return "owned";
        }
    };

    // تحميل بيانات الفيديو من API للمستخدم الحالي
    const loadMyVideoData = useCallback(
        async (
            type: VideoDataType,
            page: number = 1,
            refresh: boolean = false
        ) => {
            try {
                setError(null);
                setVideoLoading(true);

                const endpoint = `/videos/profile`;
                const payload = { type, page };

                console.log(
                    `Loading ${type} videos - page ${page} for my profile`
                );

                const response = await api.post<ApiResponse<VideoData>>(
                    endpoint,
                    payload
                );

                console.log("API Response status:", response.status);

                // تحقق من وجود البيانات والصفوف
                if (response?.data?.data?.rows) {
                    const videoResponseData = response.data.data;
                    const { rows, paginationLinks } = videoResponseData;

                    // التحقق من وجود صفحات إضافية
                    if (paginationLinks?.links?.last) {
                        try {
                            const lastPageStr =
                                paginationLinks.links.last.split("page=")[1];
                            const lastPage = parseInt(lastPageStr || "1");
                            setHasMoreData(
                                paginationLinks.currentPages < lastPage
                            );
                        } catch (parseError) {
                            console.warn(
                                "Error parsing pagination:",
                                parseError
                            );
                            setHasMoreData(false);
                        }
                    } else {
                        setHasMoreData(false);
                    }

                    // تحديث البيانات
                    const safeRows = Array.isArray(rows) ? rows : [];

                    // تحسين عرض الفيديوهات: تعديل هنا لإضافة معرّف فريد لكل فيديو
                    const processedRows = safeRows.map((video, index) => ({
                        ...video,
                        uniqueId: `${video.id || "video"}-${Date.now()}-${index}`,
                    }));

                    if (refresh || page === 1) {
                        setVideoData(processedRows);
                    } else {
                        setVideoData((prev) => [...prev, ...processedRows]);
                    }
                } else {
                    console.log("No rows found in response");
                    // في حالة عدم وجود بيانات
                    if (refresh || page === 1) {
                        setVideoData([]);
                    }
                    setHasMoreData(false);
                }
            } catch (error: any) {
                console.error(`Error loading ${type} videos:`, error);
                setError(t("errors.loadingFailed"));

                if (refresh || page === 1) {
                    setVideoData([]);
                }
                setHasMoreData(false);
            } finally {
                setVideoLoading(false);
                setIsLoading(false);
            }
        },
        []
    );

    // تحميل فيديوهات المستخدم الآخر
    const loadUserVideos = useCallback(
        async (page: number = 1, refresh: boolean = false) => {
            if (!userId) return;

            try {
                setError(null);
                setVideoLoading(true);

                const endpoint = `get-videos-by-user/${userId}`;

                console.log(`Loading other user videos - user ${userId}`);

                const response =
                    await api.get<ApiResponse<VideoData>>(endpoint);

                if (response?.data?.data) {
                    const videosData = response.data.data;

                    // تأكد من أن لدينا مصفوفة للعمل معها
                    const rows = Array.isArray(videosData)
                        ? videosData
                        : videosData.rows && Array.isArray(videosData.rows)
                          ? videosData.rows
                          : [];

                    // تحسين عرض الفيديوهات: تعديل هنا لإضافة معرّف فريد لكل فيديو
                    const processedRows = rows.map((video, index) => ({
                        ...video,
                        uniqueId: `${video.id || "video"}-${Date.now()}-${index}`,
                    }));

                    if (refresh || page === 1) {
                        setVideoData(processedRows);
                    } else {
                        setVideoData((prev) => [...prev, ...processedRows]);
                    }

                    // المزيد من البيانات؟
                    setHasMoreData(rows.length > 0);
                } else {
                    if (refresh || page === 1) {
                        setVideoData([]);
                    }
                    setHasMoreData(false);
                }
            } catch (error) {
                console.error("Error loading user videos:", error);
                setError(t("errors.loadingFailed"));

                if (refresh || page === 1) {
                    setVideoData([]);
                }
                setHasMoreData(false);
            } finally {
                setVideoLoading(false);
                setIsLoading(false);
            }
        },
        [userId]
    );

    // معالجة تغيير التبويب (فقط في حالة الملف الشخصي الخاص بي)
    const handleTabChange = useCallback(
        (index: number) => {
            // تنظيف البيانات الحالية قبل تحميل بيانات جديدة
            setVideoData([]);
            setActiveIndex(index);
            setCurrentPage(1);
            setHasMoreData(true);

            // تحميل البيانات حسب التبويب المختار
            const videoType = getDataTypeFromIndex(index);
            loadMyVideoData(videoType, 1, true);
        },
        [loadMyVideoData]
    );

    // تحميل المزيد من البيانات عند الوصول إلى نهاية القائمة
    const handleLoadMore = useCallback(() => {
        if (!videoLoading && hasMoreData) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);

            if (isMyProfile) {
                loadMyVideoData(getDataTypeFromIndex(activeIndex), nextPage);
            } else {
                loadUserVideos(nextPage);
            }
        }
    }, [
        videoLoading,
        hasMoreData,
        currentPage,
        activeIndex,
        isMyProfile,
        loadMyVideoData,
        loadUserVideos,
    ]);

    // معالج متابعة/إلغاء متابعة المستخدم
    const handleFollowToggle = useCallback(async () => {
        if (!profileUser || isMyProfile) return;

        try {
            setIsFollowing((prev) => !prev); // تحديث واجهة المستخدم فوراً للاستجابة السريعة

            if (!isFollowing) {
                // متابعة المستخدم
                await api.post(`users/${profileUser.id}/follow`);
            } else {
                // إلغاء متابعة المستخدم
                await api.post(`users/${profileUser.id}/unfollow`);
            }

            // تحديث بيانات المستخدم
            loadProfileData();
        } catch (error) {
            console.error("Error toggling follow:", error);
            // إعادة الحالة السابقة في حالة الفشل
            setIsFollowing((prev) => !prev);
            Alert.alert(t("errors.general"));
        }
    }, [profileUser, isMyProfile, isFollowing]);

    // مشاركة الملف الشخصي
    const handleShareProfile = useCallback(async () => {
        if (!profileUser) return;

        try {
            await Share.share({
                message:
                    t("profile.checkOutProfile") + `: ${profileUser.username}`,
                // يمكن استخدام URL إذا كان متاحاً
                url: `https://yourapp.com/profile/${profileUser.id}`,
            });
        } catch (error) {
            console.error("Error sharing profile:", error);
        }
    }, [profileUser]);

    // العودة إلى الملف الشخصي الخاص بالمستخدم
    const handleBackToMyProfile = useCallback(() => {
        router.back();
    }, []);

    // الانتقال إلى صفحة الإشعارات
    const handleGoToNotifications = useCallback(() => {
        router.push("/(tabs)/home/notifications");
    }, []);

    // مراسلة المستخدم
    const handleMessageUser = useCallback(() => {
        if (!profileUser) return;

        // انتقل إلى شاشة المحادثة مع المستخدم المحدد
        router.push({
            pathname: "/(tabs)/chat" as any,
            params: { userId: profileUser.id },
        });
    }, [profileUser]);

    // الإبلاغ عن المستخدم
    const handleReportUser = useCallback(() => {
        if (!profileUser) return;

        Alert.alert(
            t("profile.report"),
            `${t("profile.report")} ${profileUser.username}?`,
            [
                {
                    text: t("common.cancel"),
                    style: "cancel",
                },
                {
                    text: t("profile.report"),
                    onPress: () => {
                        // عادة ما يوجد نموذج للإبلاغ، ولكن هنا سنعرض رسالة نجاح فقط
                        Alert.alert(t("common.appName"), "تم الإبلاغ بنجاح");
                    },
                },
            ]
        );
    }, [profileUser]);

    // تحميل البيانات الأولية عند تهيئة المكون
    useEffect(() => {
        loadProfileData().then(() => {
            if (userId && userId !== user?.id) {
                // تحميل فيديوهات المستخدم الآخر
                loadUserVideos(1, true);
            } else {
                // تحميل فيديوهات المستخدم الحالي
                loadMyVideoData(getDataTypeFromIndex(activeIndex), 1, true);
            }
        });
    }, [userId, user?.id]);

    // عرض رسالة الخطأ
    useEffect(() => {
        if (error) {
            Alert.alert(t("errors.general"), error, [
                { text: t("common.close"), onPress: () => setError(null) },
            ]);
        }
    }, [error]);

    // تحسين إدارة دورة حياة المكون
    useEffect(() => {
        // تحميل البيانات المناسبة حسب الملف الشخصي
        if (isMyProfile) {
            loadMyVideoData(getDataTypeFromIndex(activeIndex), 1, true);
        } else if (userId) {
            loadUserVideos(1, true);
        }

        return () => {
            // تنظيف الموارد عند إزالة المكون
            console.log("Profile screen unmounted - cleaning up resources");

            // إفراغ البيانات عند الخروج لتحرير الذاكرة
            if (isMounted.current) {
                setVideoData([]);
            }
        };
    }, [activeIndex, userId, isMyProfile]);

    // عرض مؤشر التحميل عند تحميل صفحة الملف الشخصي
    if (profileLoading && !profileUser) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>{t("common.loading")}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={isMyProfile ? [2] : []} // جعل التبويبات ثابتة فقط في ملفي الشخصي
            >
                <View style={styles.coverContainer}>
                    <FastImage
                        source={{
                            uri:
                                profileUser?.cover_image ||
                                "https://www.dotefl.com/wp-content/uploads/2023/07/Road-vs-street.jpg",
                        }}
                        style={styles.coverImage}
                    />

                    {!isMyProfile ? (
                        // أزرار ملف المستخدم الآخر
                        <>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackToMyProfile}
                            >
                                <View style={styles.backButtonContent}>
                                    <Ionicons
                                        name={
                                            isRTL
                                                ? "chevron-forward"
                                                : "chevron-back"
                                        }
                                        size={22}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.reportButton}
                                onPress={handleReportUser}
                            >
                                <View style={styles.actionButtonContent}>
                                    <FontAwesome
                                        name="flag-o"
                                        size={18}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackToMyProfile}
                            >
                                <View style={styles.backButtonContent}>
                                    <Ionicons
                                        name={
                                            isRTL
                                                ? "chevron-forward"
                                                : "chevron-back"
                                        }
                                        size={22}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.notificationButton}
                                onPress={handleGoToNotifications}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons
                                        name="notifications-outline"
                                        size={22}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.avatarContainer}>
                        <FastImage
                            source={{
                                uri: profileUser?.profile_image,
                            }}
                            style={styles.avatar}
                        />
                    </View>
                </View>

                <UserData
                    profile={profileUser as any}
                    isMyProfile={isMyProfile}
                    onFollowToggle={handleFollowToggle}
                    onMessagePress={handleMessageUser}
                    onSharePress={handleShareProfile}
                    onReportPress={handleReportUser}
                    isFollowing={isFollowing}
                />

                <View style={styles.tabsContainer}>
                    <TopTabs
                        activeIndex={activeIndex}
                        setActiveIndex={handleTabChange}
                    />
                </View>

                <RenderData
                    userVideo={videoData}
                    isLoading={videoLoading}
                    onEndReached={handleLoadMore}
                    hasMoreData={hasMoreData}
                    isShowUserData={isMyProfile}
                    headerTitle={isMyProfile ? undefined : ""}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    coverContainer: {
        position: "relative",
        height: 215,
        width: "100%",
    },
    coverImage: {
        height: 215,
        width: "100%",
        alignSelf: "center",
        borderBottomEndRadius: 30,
        borderBottomStartRadius: 30,
    },
    avatarContainer: {
        width: 94,
        height: 94,
        borderRadius: 90,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        bottom: -42,
        position: "absolute",
        borderWidth: 3,
        borderColor: "#fff",
        backgroundColor: "#fff",
    },
    avatar: {
        height: 89,
        width: 89,
        borderRadius: 85,
    },
    backButton: {
        position: "absolute",
        top: 12,
        left: 16,
        zIndex: 10,
    },
    notificationButton: {
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 10,
    },
    reportButton: {
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 10,
    },
    backButtonContent: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtonContent: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    tabsContainer: {
        backgroundColor: "#fff",
        paddingTop: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 10,
    },
});
