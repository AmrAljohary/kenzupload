import {
    View,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    RefreshControl,
    Animated,
    I18nManager,
    Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppLanguage } from "../../../hooks/useLanguage";
import { api } from "../../../services/axios";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as VideoThumbnails from "expo-video-thumbnails";

import SearchBar from "../../../components/Search/SearchBar";
import List from "../../../components/Search/List";
import TabBar from "../../../components/Search/TabBar";
import UsersList from "../../../components/Search/UsersList";
import RenderData from "../../../components/Search/RenderData";
import { Text } from "../../../components/ui/Text";
import Header from "@/components/ui/Header";
import VideoItem from "../../../components/Search/VideoItem";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

interface SearchResponse {
    data: any[];
    meta?: any;
    paginationLinks?: {
        currentPages: number;
        links: {
            first: string;
            last: string;
        };
        perPage: number;
        total: number;
    };
    rows?: any[];
}

// Make sure this matches what the hook returns
interface AppLanguageReturn {
    t: (key: string) => string;
    isRTL: boolean;
    currentLanguage: "ar" | "en";
    language?: string;
    switchLanguage: (
        lang: "ar" | "en"
    ) => Promise<{ success: boolean; needsRestart: boolean } | undefined>;
}

const RECENT_SEARCHES_KEY = "recent_searches";

// مكون صورة مصغرة لفيديو هاشتاج
const HashtagVideoThumbnail = ({
    videoUrl,
    style,
}: {
    videoUrl: string;
    style?: any;
}) => {
    const [thumb, setThumb] = useState<string | null>(null);
    useEffect(() => {
        let isMounted = true;
        const generate = async () => {
            try {
                const { uri } = await VideoThumbnails.getThumbnailAsync(
                    videoUrl,
                    { time: 2000 }
                );
                if (isMounted) setThumb(uri);
            } catch {}
        };
        if (videoUrl) generate();
        return () => {
            isMounted = false;
        };
    }, [videoUrl]);
    if (!thumb)
        return (
            <View
                style={[{ backgroundColor: "#eee", borderRadius: 10 }, style]}
            />
        );
    return <Image source={{ uri: thumb }} style={style} resizeMode="cover" />;
};

const HashtagVideoItem = ({
    video,
    thumbnail,
    setThumbnail,
    onPress,
}: {
    video: any;
    thumbnail?: string;
    setThumbnail: (id: string, uri: string) => void;
    onPress?: () => void;
}) => {
    useEffect(() => {
        let isMounted = true;
        if (!video.thumbnail && video.url && !thumbnail) {
            VideoThumbnails.getThumbnailAsync(video.url, { time: 2000 })
                .then(({ uri }) => {
                    if (isMounted) setThumbnail(video.id, uri);
                })
                .catch(() => {});
        }
        return () => {
            isMounted = false;
        };
    }, [video.thumbnail, video.url, thumbnail]);

    return (
        <VideoItem
            video={{ ...video, thumbnail: video.thumbnail || thumbnail }}
            onPress={onPress}
        />
    );
};

const SearchScreen = () => {
    // Cast the return value of useAppLanguage to our interface
    const { t, isRTL, currentLanguage } = useAppLanguage() as AppLanguageReturn;
    const [value, setValue] = useState("");
    const [activeTab, setActiveTab] = useState<"videos" | "users">("videos");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [videosSearch, setVideosSearch] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hashtags, setHashtags] = useState<{ [key: string]: any }>({});
    const [refreshing, setRefreshing] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(true);
    const totalHashtags = Object.keys(hashtags);
    const router = useRouter();
    const navigation = useNavigation();
    const scrollY = useRef(new Animated.Value(0)).current;
    // حالة لتخزين الصور المصغرة لفيديوهات الهاشتاجات
    const [hashtagThumbnails, setHashtagThumbnails] = useState<{
        [videoId: string]: string;
    }>({});

    // Keep the index tab active
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            // This makes the UI reflect the index tab as active
            try {
                // Native way to handle active tab highlight
                // DOM manipulation is for web only and won't work in React Native
            } catch (error) {
                console.error("Error highlighting home tab:", error);
            }
        });

        return unsubscribe;
    }, [navigation]);

    // Fetch popular hashtags on component mount
    useEffect(() => {
        fetchHashtags();
        loadRecentSearches();
    }, []);

    const fetchHashtags = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/hashtags/top");
            const data = response.data || {};
            if (data && typeof data === "object" && "data" in data) {
                setHashtags(data.data as { [key: string]: any });
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching hashtags:", error);
            setIsLoading(false);
        }
    };

    const loadRecentSearches = async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            } else {
                setRecentSearches([]);
            }
        } catch (e) {
            setRecentSearches([]);
        }
    };

    const saveRecentSearch = async (query: string) => {
        if (!query.trim()) return;
        let updatedSearches = [
            query,
            ...recentSearches.filter((q) => q !== query),
        ];
        updatedSearches = updatedSearches.slice(0, 5);
        setRecentSearches(updatedSearches);
        try {
            await AsyncStorage.setItem(
                RECENT_SEARCHES_KEY,
                JSON.stringify(updatedSearches)
            );
        } catch (e) {}
    };

    const clearRecentSearches = async () => {
        setRecentSearches([]);
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (e) {}
    };

    const extractVideosAndTitles = () => {
        if (totalHashtags?.length > 0) {
            return totalHashtags.map((hashtag: string) => ({
                title: hashtag,
                videos: hashtags[hashtag]?.videos || [],
            }));
        }
        return [];
    };

    const handleSearch = async (loadMore = false) => {
        if (!value.trim() && !loadMore) {
            setIsSearching(false);
            setSearchResults([]);
            setVideosSearch([]);
            return;
        }

        // تحديد الصفحة بناءً على تحميل المزيد
        const page = loadMore ? currentPage + 1 : 1;

        if (!loadMore) {
            setIsLoading(true);
            setIsSearching(true);
            await saveRecentSearch(value.trim());

            // إعادة تعيين نتائج البحث فقط إذا كان بحثًا جديدًا
            if (!loadMore) {
                // للفيديوهات فقط، سنقوم بتحميل المزيد أثناء التمرير
                setVideosSearch([]);
                // للمستخدمين، دائمًا نعيد تعيين البيانات
                setSearchResults([]);
            }
        }

        try {
            // البحث في المستخدمين والفيديوهات معًا
            const [usersPromise, videosPromise] = [
                // بحث المستخدمين
                api.post(`/users/searsh`, {
                    query: value.trim(),
                    page: 1, // دائمًا الصفحة 1 للمستخدمين
                    lang: currentLanguage || "ar",
                }),

                // بحث الفيديوهات
                api.get(`/videos/homePage/${currentLanguage || "ar"}`, {
                    params: {
                        search: value.trim(),
                        page: page,
                    },
                }),
            ];

            // انتظار نتائج كلا الطلبين
            const [usersResponse, videosResponse] = await Promise.all([
                usersPromise,
                videosPromise,
            ]);

            console.log("Search completed in both categories");

            // معالجة نتائج المستخدمين
            const userData = usersResponse?.data || {};
            let users: any[] = [];

            if (userData && typeof userData === "object") {
                if ("data" in userData) {
                    users = userData.data as any[];
                } else if ("rows" in userData) {
                    users = userData.rows as any[];
                }
            }

            // تخزين نتائج المستخدمين
            setSearchResults(users);

            // معالجة نتائج الفيديوهات
            const apiData = (videosResponse?.data as any) || {};
            const videoData = (apiData.data as any) || {};
            let videos: any[] = [];

            if (videoData && typeof videoData === "object") {
                if ("rows" in videoData) {
                    videos = videoData.rows as any[];
                } else if (Array.isArray(videoData)) {
                    videos = videoData;
                }
            }

            // تخزين نتائج الفيديو بالطريقة المناسبة (تحميل المزيد أو استبدال)
            if (loadMore) {
                setVideosSearch((prev) => [...prev, ...videos]);
            } else {
                setVideosSearch(videos);
            }

            // التحقق من وجود المزيد من البيانات للفيديوهات
            const paginationLinks = videoData.paginationLinks;
            if (paginationLinks) {
                const { currentPages, links } = paginationLinks;
                const lastPage = links.last.split("page=")[1];
                setHasMoreData(currentPages < parseInt(lastPage));
            } else {
                setHasMoreData(videos.length > 0);
            }

            // تحديث رقم الصفحة للفيديوهات فقط
            if (loadMore) {
                setCurrentPage(page);
            } else {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Search error:", error);
            if (!loadMore) {
                setSearchResults([]);
                setVideosSearch([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (
        tab: "videos" | "users" | "quran" | "poetry" | "saudi"
    ) => {
        if (tab === "videos" || tab === "users") {
            setActiveTab(tab);

            // إذا كان هناك نص بحث، قم بتنفيذ البحث فوراً
            if (value.trim()) {
                setCurrentPage(1);
                setHasMoreData(true);
                setIsLoading(true); // إظهار مؤشر التحميل
                setIsSearching(true); // تحديث حالة البحث

                // تأخير قصير جداً للسماح للحالة بالتحديث أولاً
                setTimeout(() => {
                    handleSearch(false);
                }, 50);
            }
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMoreData && activeTab === "videos") {
            handleSearch(true);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchHashtags();
        setRefreshing(false);
    };

    const handleClearSearch = () => {
        setValue("");
        setIsSearching(false);
        setCurrentPage(1);
        setHasMoreData(true);
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const renderSearchResults = () => {
        if (isLoading && !videosSearch.length && !searchResults.length) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#333" />
                    <Text style={styles.loadingText}>
                        {t("search.searching")}
                    </Text>
                </View>
            );
        }

        if (
            (activeTab === "videos" && videosSearch.length === 0) ||
            (activeTab === "users" && searchResults.length === 0)
        ) {
            return (
                <View style={styles.container}>
                    <TabBar
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                    />
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrapper}>
                            <FontAwesome5
                                name="search"
                                size={60}
                                color="#ddd"
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {t("search.noResults")}
                        </Text>
                        <Text style={styles.tryAgainText}>
                            {t("search.tryAgain")}
                        </Text>
                        <View style={styles.emptyLine} />
                    </View>
                </View>
            );
        }

        return (
            <>
                <TabBar activeTab={activeTab} setActiveTab={handleTabChange} />
                {activeTab === "videos" ? (
                    <RenderData
                        userVideo={videosSearch}
                        isLoading={isLoading}
                        onEndReached={handleLoadMore}
                        hasMoreData={hasMoreData}
                    />
                ) : (
                    <UsersList
                        users={searchResults}
                        isLoading={isLoading}
                        onEndReached={handleLoadMore}
                        hasMoreData={hasMoreData}
                    />
                )}
            </>
        );
    };

    const renderRecentSearches = () => {
        if (recentSearches.length === 0) return null;

        // دالة بحث مباشرة تتجاوز التعقيدات
        const searchDirectly = async (searchTerm: string) => {
            console.log("Executing direct search for:", searchTerm);

            // تعيين القيم الأساسية
            setValue(searchTerm);
            setIsSearching(true);
            setIsLoading(true);
            setCurrentPage(1);

            try {
                // حفظ في البحث الأخير
                await saveRecentSearch(searchTerm);

                // تنفيذ البحث حسب التبويب النشط
                if (activeTab === "users") {
                    // بحث المستخدمين
                    setSearchResults([]); // مسح النتائج القديمة

                    const usersResponse = await api.post(`/users/searsh`, {
                        query: searchTerm.trim(),
                        page: 1,
                        lang: currentLanguage || "ar",
                    });

                    console.log("Search users response:", usersResponse?.data);

                    const userData = usersResponse?.data || {};
                    let users: any[] = [];

                    if (userData && typeof userData === "object") {
                        if ("data" in userData) {
                            users = userData.data as any[];
                        } else if ("rows" in userData) {
                            users = userData.rows as any[];
                        }
                    }

                    setSearchResults(users);
                    setHasMoreData(false);
                } else {
                    // بحث الفيديوهات
                    setVideosSearch([]); // مسح النتائج القديمة

                    const videosResponse = await api.get(
                        `/videos/homePage/${currentLanguage || "ar"}`,
                        {
                            params: {
                                search: searchTerm.trim(),
                                page: 1,
                            },
                        }
                    );

                    console.log(
                        "Search videos response:",
                        videosResponse?.data
                    );

                    const apiData = (videosResponse?.data as any) || {};
                    const videoData = (apiData.data as any) || {};
                    let videos: any[] = [];

                    if (videoData && typeof videoData === "object") {
                        if ("rows" in videoData) {
                            videos = videoData.rows as any[];
                        } else if (Array.isArray(videoData)) {
                            videos = videoData;
                        }
                    }

                    setVideosSearch(videos);

                    // تحقق من وجود المزيد من البيانات
                    const paginationLinks = videoData.paginationLinks;
                    if (paginationLinks) {
                        const { currentPages, links } = paginationLinks;
                        setHasMoreData(
                            currentPages <
                                parseInt(links.last.split("page=")[1])
                        );
                    } else {
                        setHasMoreData(videos.length > 0);
                    }
                }
            } catch (error) {
                console.error("Direct search error:", error);
                // في حالة الخطأ، نعيد تعيين النتائج لتجنب عرض نتائج قديمة
                setSearchResults([]);
                setVideosSearch([]);
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <View style={styles.recentSearchesContainer}>
                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionTitle}>
                        {t("search.recentSearches")}
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                        <Text style={styles.clearAllText}>
                            {t("search.clearAll")}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                    {recentSearches.map((item, index) => (
                        <TouchableOpacity
                            key={`recent-${index}`}
                            style={styles.tagButton}
                            onPress={() => searchDirectly(item)}
                        >
                            <MaterialIcons
                                name="history"
                                size={16}
                                color="#666"
                                style={styles.tagIcon}
                            />
                            <Text style={styles.tagText}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const handleHashtagVideoPress = (video: any) => {
        console.log("Hashtag video ID:", video.id);
        // توجيه المستخدم إلى صفحة الفيديو
        router.push({
            pathname: "/(tabs)/home",
            params: { id: video.id },
        });
    };

    const renderHashtags = () => {
        if (isLoading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#333" />
                </View>
            );
        }

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.ScrollView}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={["#333"]}
                        tintColor="#333"
                    />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {renderRecentSearches()}

                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionTitle}>
                        {t("search.popular")}
                    </Text>
                </View>

                {/* عرض فيديوهات الهاشتاجات مع مراعاة اتجاه اللغة */}
                {extractVideosAndTitles()?.map((item: any, index: number) => (
                    <View
                        key={index}
                        style={[
                            styles.hashtagSection,
                            { direction: I18nManager.isRTL ? "ltr" : "rtl" },
                        ]}
                    >
                        <Text
                            style={[
                                styles.hashtagTitle,
                                {
                                    textAlign: I18nManager.isRTL
                                        ? "right"
                                        : "left",
                                },
                            ]}
                        >
                            {item.title}
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                flexDirection: I18nManager.isRTL
                                    ? "row-reverse"
                                    : "row-reverse",
                                direction: I18nManager.isRTL ? "ltr" : "rtl",
                                paddingHorizontal: 5,
                            }}
                            style={styles.hashtagVideosScroll}
                        >
                            {item.videos.map((video: any) => (
                                <View
                                    key={video.id}
                                    style={[
                                        styles.hashtagVideoItem,
                                        {
                                            marginRight: isRTL ? 0 : 12,
                                            marginLeft: isRTL ? 12 : 0,
                                            direction: I18nManager.isRTL
                                                ? "ltr"
                                                : "rtl",
                                        },
                                    ]}
                                >
                                    <HashtagVideoItem
                                        video={video}
                                        thumbnail={hashtagThumbnails[video.id]}
                                        setThumbnail={(id, uri) =>
                                            setHashtagThumbnails((prev) => ({
                                                ...prev,
                                                [id]: uri,
                                            }))
                                        }
                                        onPress={() =>
                                            handleHashtagVideoPress(video)
                                        }
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ))}
                <View style={styles.Foot} />
            </ScrollView>
        );
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={isRTL ? styles.ArabicContainer : styles.container}
        >
            <StatusBar barStyle={"dark-content"} backgroundColor={"#fff"} />

            {/* Header with back button */}
            <Header title={t("search.title")} />

            {/* Search Bar */}
            <SearchBar
                value={value}
                setValue={setValue}
                onSubmit={() => handleSearch(false)}
                cancelLabel={t("search.cancel")}
                placeholder={t("search.placeholder")}
                onClear={handleClearSearch}
            />

            {/* Main Content */}
            {isSearching ? renderSearchResults() : renderHashtags()}
        </SafeAreaView>
    );
};

export default SearchScreen;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 5,
        backgroundColor: "#fff",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    ArabicContainer: {
        flex: 1,
        paddingHorizontal: 20,
        direction: "rtl",
        paddingTop: 5,
        backgroundColor: "#fff",
    },
    headerBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        zIndex: 5,
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
    },
    solidHeaderBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    scrollViewContent: {
        paddingBottom: 30,
    },
    Search: {
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
    },
    SearchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 45,
        width: "100%",
        backgroundColor: "#F8F8F8",
        borderRadius: 15,
        paddingHorizontal: 15,
        gap: 10,
        marginTop: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    SearchBar: {
        height: 45,
        width: "90%",
        textAlign: "right",
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "400",
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    ScrollView: {
        flex: 1,
        width: "100%",
        alignSelf: "center",
    },
    sectionHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    clearAllText: {
        fontSize: 14,
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    recentSearchesContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 5,
    },
    tagButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    tagIcon: {
        marginRight: 5,
    },
    tagText: {
        fontSize: 14,
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    CategoryTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    RowBetween: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 25,
        paddingHorizontal: 20,
    },
    More: {
        fontSize: 14,
        fontWeight: "400",
    },
    CardImage: {
        height: 165,
        width: 110,
        borderRadius: 10,
    },
    Separator: {
        width: 10,
    },
    List: {
        marginTop: 16,
        width: "100%",
        alignSelf: "center",
    },
    Footer: {
        width: 20,
    },
    Foot: {
        height: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 30,
        paddingHorizontal: 20,
    },
    emptyIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
        marginTop: 15,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
        textAlign: "center",
    },
    tryAgainText: {
        fontSize: 14,
        color: "#666",
        marginTop: 5,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
        textAlign: "center",
    },
    emptyLine: {
        width: 40,
        height: 3,
        backgroundColor: "#333",
        marginTop: 20,
        borderRadius: 1.5,
    },
    resultsContainer: {
        paddingBottom: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    placeholder: {
        width: 40,
    },
    hashtagSection: {
        marginBottom: 24,
        width: "100%",
    },
    hashtagTitle: {
        fontSize: 16,
        fontFamily: Platform.OS === "ios" ? "System" : "somar-bold",
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    hashtagVideosScroll: {
        width: "100%",
    },
    hashtagVideoItem: {
        // تحديد عرض ثابت وهوامش متناسبة مع اتجاه اللغة
        width: ITEM_WIDTH,
    },
});
