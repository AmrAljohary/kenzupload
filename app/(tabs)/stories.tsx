import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    I18nManager,
    RefreshControl,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import FastImage from "react-native-fast-image";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "@/services/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { getStatusBarHeight } from "react-native-iphone-x-helper"; // Import getStatusBarHeight

// بيانات وهمية للمستخدمين
const FRIENDS_STORIES = [
    {
        id: 1,
        name: "فيصل الفهاد",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        hasNewStory: true,
    },
    {
        id: 2,
        name: "سعود الحربي",
        image: "https://randomuser.me/api/portraits/men/44.jpg",
        hasNewStory: true,
    },
    {
        id: 3,
        name: "عبدالله العتيبي",
        image: "https://randomuser.me/api/portraits/men/68.jpg",
        hasNewStory: true,
    },
    {
        id: 4,
        name: "محمد الزهراني",
        image: "https://randomuser.me/api/portraits/men/65.jpg",
        hasNewStory: true,
    },
    {
        id: 5,
        name: "يحيى",
        image: "https://randomuser.me/api/portraits/men/78.jpg",
        hasNewStory: true,
    },
];

const OTHERS = [
    {
        id: 1,
        name: "وائل الحارثي",
        image: "https://randomuser.me/api/portraits/men/92.jpg",
        followers: "87k",
    },
    {
        id: 2,
        name: "طلال المرواني",
        image: "https://randomuser.me/api/portraits/men/91.jpg",
        followers: "1.2k",
    },
    {
        id: 3,
        name: "صالح الزويد",
        image: "https://randomuser.me/api/portraits/men/90.jpg",
        followers: "10.7k",
    },
];

// سيتم تحديث بيانات المستخدم من AsyncStorage
const DEFAULT_USER = {
    id: 1,
    name: "حسابي",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
};

export default function StoriesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [friendsStories, setFriendsStories] = useState(FRIENDS_STORIES);
    const [others, setOthers] = useState(OTHERS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasApiData, setHasApiData] = useState(false);
    const [currentUser, setCurrentUser] = useState(DEFAULT_USER);
    const [currentUserHasStories, setCurrentUserHasStories] = useState(false); // New state to track if current user has stories

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadUserData();
        fetchStories();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem("USER_DATA");
            console.log("userData", userData);
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser({
                    id: user.id,
                    name: user.name || user.username,
                    image: user.profile_image || DEFAULT_USER.image,
                });
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    const fetchStories = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get("/stories");
            console.log("Stories API Response:", response.data);

            if (response.ok && response.data) {
                const storiesData = Array.isArray(response.data)
                    ? response.data
                    : [];

                // Check if current user has stories based on API response
                const userStories = storiesData.find((story: any) => story.user.id === currentUser.id); // Moved inside
                setCurrentUserHasStories(!!userStories); // Set true if userStories exists

                // Group stories by user to avoid duplicates
                const userStoriesMap = new Map();

                storiesData.forEach((story: any) => {
                    if (story.user && story.user.id) {
                        const userId = story.user.id;
                        if (!userStoriesMap.has(userId)) {
                            userStoriesMap.set(userId, {
                                user: story.user,
                                stories: [story],
                                hasNewStory: true, // Assuming new story if present
                                lastStoryTime:
                                    story.created_at ||
                                    new Date().toISOString(),
                            });
                        } else {
                            userStoriesMap.get(userId).stories.push(story);
                        }
                    }
                });

                // Convert to arrays for UI
                const allUsers = Array.from(userStoriesMap.values());

                // Friends stories (regular users)
                const apiFriendsStories = allUsers
                    .filter((userStory) => userStory.user.type !== "admin" && userStory.user.id !== currentUser.id) // Exclude current user
                    .map((userStory) => ({
                        id: userStory.user.id,
                        name:
                            userStory.user.name ||
                            userStory.user.username ||
                            t("common.user"), // Translated default
                        image:
                            userStory.user.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userStory.user.name || userStory.user.username || "User")}&background=000&color=fff`,
                        hasNewStory: true, // Assuming new story if present
                        storiesCount: userStory.stories.length,
                        lastStoryTime: userStory.lastStoryTime,
                    }))
                    .sort(
                        (a, b) =>
                            new Date(b.lastStoryTime).getTime() -
                            new Date(a.lastStoryTime).getTime()
                    );

                // Others (admin users or featured)
                const apiOthers = allUsers
                    .filter((userStory) => userStory.user.type === "admin" && userStory.user.id !== currentUser.id) // Exclude current user
                    .map((userStory) => ({
                        id: userStory.user.id,
                        name:
                            userStory.user.name ||
                            userStory.user.username ||
                            t("common.user"), // Translated default
                        image:
                            userStory.user.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userStory.user.name || userStory.user.username || "User")}&background=000&color=fff`,
                        followers:
                            userStory.stories.length > 5
                                ? "10k+"
                                : userStory.stories.length > 2
                                  ? "5k+"
                                  : "1k+",
                        storiesCount: userStory.stories.length,
                        isVerified: userStory.user.is_verified || false,
                    }));

                // Update state with API data or keep mock data if empty
                const hasData = apiFriendsStories.length > 0 || apiOthers.length > 0 || currentUserHasStories;
                setHasApiData(hasData);

                if (hasData) {
                    setFriendsStories(
                        apiFriendsStories.length > 0 ? apiFriendsStories : []
                    );
                    setOthers(apiOthers.length > 0 ? apiOthers : []);
                    console.log(
                        `✅ Loaded ${apiFriendsStories.length} friends stories and ${apiOthers.length} others`
                    );
                } else {
                    // No stories found from API
                    setFriendsStories([]);
                    setOthers([]);
                    console.log("📭 No stories found from API");
                }
            }
        } catch (error) {
            console.error("❌ Error fetching stories:", error);
            // Set empty arrays on error
            setFriendsStories([]);
            setOthers([]);
            setHasApiData(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchStories(true);
    };

    const renderEmptyState = () => (
        <Animated.View
            style={styles.emptyStateContainer}
            entering={FadeInDown.delay(300)}
        >
            <View style={styles.emptyStateIcon}>
                <Ionicons name="camera-outline" size={80} color="#ccc" />
            </View>
            <Text style={styles.emptyStateTitle}>{t("stories.noStoriesTitle")}</Text>
            <Text style={styles.emptyStateDescription}>
                {t("stories.noStoriesDescription")}
            </Text>
            <View style={styles.emptyStateActions}>
                <TouchableOpacity
                    style={styles.createStoryButton}
                    onPress={() => {
                        router.push({
                            pathname: "/(tabs)/add",
                            params: { mode: "story" },
                        });
                    }}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.createStoryButtonText}>{t("stories.createStoryButton")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => fetchStories()}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={20}
                        color="#000"
                        style={styles.retryIcon}
                    />
                    <Text style={[styles.retryButtonText, { color: "#000" }]}>
                        {t("common.refresh")}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
                <Ionicons name="camera-outline" size={40} color="#000" />
            </View>
            <Text style={styles.loadingText}>{t("stories.loadingStories")}</Text>
        </View>
    );

    const renderStoryRing = (hasStory: boolean, isMine: boolean = false) => {
        if (!hasStory && !isMine) return null; // Only render ring if there's a story or it's my own add button

        return (
            <View style={hasStory ? styles.storyRingActive : styles.storyRingAdd}>
                {hasStory ? (
                    <View style={styles.storyRingInnerActive} />
                ) : (
                    <View style={styles.storyRingInnerAdd} />
                )}
            </View>
        );
    };
    console.log("currentUser", currentUser);
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* رأس الصفحة */}
            <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? getStatusBarHeight() + 40 : 10}]}> {/* Adjusted paddingTop significantly more */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons
                        name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                        size={24}
                        color="#000"
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("stories.title")}</Text>
            </View>

            {loading ? (
                renderLoadingState()
            ) : friendsStories.length === 0 && others.length === 0 && !currentUserHasStories ? ( // Updated condition
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#000"]}
                            tintColor="#000"
                        />
                    }
                >
                    {/* قسم حالتي - يظهر دائماً */}
                    {/* Removed myStatusSection View */}
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <TouchableOpacity
                            style={styles.simpleMyStatusCard}
                            onPress={() => {
                                if (currentUserHasStories) {
                                    router.push({pathname: "/(tabs)/story-viewer/[id]" as any, params: {id: currentUser.id}});
                                } else {
                                    router.push({
                                        pathname: "/(tabs)/add",
                                        params: { mode: "story" },
                                    });
                                }
                            }}
                        >
                            <View style={styles.simpleStatusLeft}>
                                <View style={styles.simpleImageContainer}>
                                    <FastImage
                                        source={{ uri: currentUser.image }}
                                        style={styles.simpleStatusImage}
                                    />
                                    {currentUserHasStories ? (
                                        renderStoryRing(true, true)
                                    ) : (
                                        <View style={styles.simpleAddIcon}>
                                            <Ionicons
                                                name="add"
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.simpleStatusInfo}>
                                    <Text style={styles.simpleStatusTitle}>
                                        {currentUser.name}
                                    </Text>
                                    <Text style={styles.simpleStatusSubtitle}>
                                        {t(
                                            currentUserHasStories ? "stories.myStoryExists" : "stories.addStory"
                                        )}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.simpleCameraIcon}>
                                <Ionicons
                                    name="camera"
                                    size={20}
                                    color="#666"
                                />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                    {renderEmptyState()}
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#000"]}
                            tintColor="#000"
                        />
                    }
                >
                    {/* قسم حالتي */}
                    {/* Removed myStatusSection View */}
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <TouchableOpacity
                            style={styles.simpleMyStatusCard}
                            onPress={() => {
                                if (currentUserHasStories) {
                                    router.push({pathname: "/(tabs)/story-viewer/[id]" as any, params: {id: currentUser.id}});
                                } else {
                                    router.push({
                                        pathname: "/(tabs)/add",
                                        params: { mode: "story" },
                                    });
                                }
                            }}
                        >
                            <View style={styles.simpleStatusLeft}>
                                <View style={styles.simpleImageContainer}>
                                    <FastImage
                                        source={{ uri: currentUser.image }}
                                        style={styles.simpleStatusImage}
                                    />
                                    {currentUserHasStories ? (
                                        renderStoryRing(true, true)
                                    ) : (
                                        <View style={styles.simpleAddIcon}>
                                            <Ionicons
                                                name="add"
                                                size={16}
                                                color="#fff"
                                            />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.simpleStatusInfo}>
                                    <Text style={styles.simpleStatusTitle}>
                                        {currentUser.name}
                                    </Text>
                                    <Text style={styles.simpleStatusSubtitle}>
                                        {t(
                                            currentUserHasStories ? "stories.myStoryExists" : "stories.addStory"
                                        )}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.simpleCameraIcon}>
                                <Ionicons
                                    name="camera"
                                    size={20}
                                    color="#666"
                                />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* قسم الأصدقاء */}
                    {friendsStories.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {t("stories.friends")}
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.friendsContainer}
                            >
                                {friendsStories.map((friend) => (
                                    <TouchableOpacity
                                        key={friend.id}
                                        style={styles.friendItem}
                                        onPress={() => {
                                            router.push({pathname: "/(tabs)/story-viewer/[id]" as any, params: {id: friend.id}});
                                        }}
                                    >
                                        <Animated.View
                                            style={styles.friendImageContainer}
                                            entering={FadeInDown.delay(
                                                friend.id * 100
                                            )}
                                        >
                                            {renderStoryRing(friend.hasNewStory)}
                                            <FastImage
                                                source={{ uri: friend.image }}
                                                style={styles.friendImage}
                                            />
                                        </Animated.View>
                                        <Text style={styles.friendName}>
                                            {friend.name}
                                        </Text>
                                        {(friend as any).storiesCount &&
                                            (friend as any).storiesCount >
                                                1 && (
                                                <View
                                                    style={
                                                        styles.storiesCountBadge
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.storiesCountText
                                                        }
                                                    >
                                                        {
                                                            (friend as any)
                                                                .storiesCount
                                                        }
                                                    </Text>
                                                </View>
                                            )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* قسم آخرون */}
                    {others.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {t("stories.others")}
                            </Text>
                            {others.map((person) => (
                                <Animated.View
                                    key={person.id}
                                    style={styles.otherPersonCard}
                                    entering={FadeInDown.delay(person.id * 200)}
                                >
                                    <BlurView
                                        intensity={80}
                                        style={styles.otherPersonContent}
                                    >
                                        <View style={styles.otherPersonLeft}>
                                            <TouchableOpacity
                                                style={styles.eyeButton}
                                                onPress={() => {router.push({pathname: "/(tabs)/story-viewer/[id]" as any, params: {id: person.id}})}} // Navigate to story viewer
                                            >
                                                <Ionicons
                                                    name="eye-outline"
                                                    size={24}
                                                    color="#666"
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.followButton}
                                            >
                                                <Text
                                                    style={
                                                        styles.followButtonText
                                                    }
                                                >
                                                    {t("common.follow")}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.otherPersonRight}>
                                            <View
                                                style={styles.otherPersonInfo}
                                            >
                                                <Text
                                                    style={
                                                        styles.otherPersonName
                                                    }
                                                >
                                                    {person.name}
                                                </Text>
                                                <Text
                                                    style={
                                                        styles.otherPersonFollowers
                                                    }
                                                >
                                                    {person.followers}{" "}
                                                    {t("stories.followers")}
                                                </Text>
                                            </View>
                                            <FastImage
                                                source={{ uri: person.image }}
                                                style={styles.otherPersonImage}
                                            />
                                        </View>
                                    </BlurView>
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FBFBFB", // Light background
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    header: {
        flexDirection: "row-reverse", // Align items to the right in RTL
        alignItems: "center",
        justifyContent: "space-between", // Space out title and back button
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        // marginTop: 25, // Handled by paddingTop in component
        backgroundColor: "#fff", // Ensure header background is white
        shadowColor: "#000", // Subtle shadow for header
        shadowOffset: { width: 0, height: 2 }, // Changed height to 2 for more depth
        shadowOpacity: 0.1, // Increased shadow opacity
        shadowRadius: 4, // Increased shadow radius
        elevation: 2, // Increased elevation
        zIndex: 10, // Ensure header is on top
    },
    headerTitle: {
        flex: 1, // Take available space
        fontSize: 20,
        color: "#000",
        fontFamily: "somar-bold",
        textAlign: "center", // Center title
    },
    backButton: {
        padding: 8,
        position: "absolute", // Re-added absolute positioning
        left: I18nManager.isRTL ? undefined : 10, // Adjusted for RTL
        right: I18nManager.isRTL ? 10 : undefined, // Adjusted for RTL
        zIndex: 1, // Ensure it's clickable
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    // Removed myStatusSection style as the View was removed
    myStatusCard: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginHorizontal: 16, // Ensure horizontal margin is here
        marginVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, // Subtle shadow for cards (reverted slightly)
        shadowRadius: 6, // Slightly larger radius (reverted slightly)
        elevation: 3, // Increased elevation (reverted slightly)
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },
    myStatusRight: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
    },
    myStatusImageContainer: {
        position: "relative",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    myStatusImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: "#fff",
    },
    addStatusButton: {
        position: "absolute",
        bottom: -4,
        left: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FBFBFB",
        overflow: "hidden",
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    myStatusInfo: {
        alignItems: "flex-end",
    },
    myStatusTitle: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-bold",
    },
    myStatusSubtitle: {
        fontSize: 12,
        color: "#000",
        fontFamily: "somar-regular",
    },
    myStatusActions: {
        flexDirection: "row-reverse",
        gap: 3,
    },
    statusAction: {
        padding: 8,
    },
    section: {
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        color: "#000",
        fontFamily: "somar-bold",
        marginBottom: 16,
        paddingHorizontal: 16,
        textAlign: "right",
    },
    friendsContainer: {
        paddingHorizontal: 12,
        gap: 12, // Increased gap for better spacing
        paddingBottom: 8,
        paddingTop: 10,
    },
    friendItem: {
        alignItems: "center",
        width: 85, // Slightly wider for better spacing
    },
    friendImageContainer: {
        position: "relative",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18, // Slightly more opaque for friend images
        shadowRadius: 10, // Larger radius
        elevation: 6, // Increased elevation
    },
    storyRing: {
        position: "absolute",
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 35,
        backgroundColor: "#000",
        padding: 2,
    },
    storyRingInner: {
        flex: 1,
        backgroundColor: "#FBFBFB",
        borderRadius: 33,
    },
    friendImage: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        borderWidth: 2,
        borderColor: "#fff",
    },
    friendName: {
        fontSize: 12,
        color: "#000",
        fontFamily: "somar-medium",
        textAlign: "center",
        marginTop: 4,
    },
    otherPersonCard: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    otherPersonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 14, // Slightly larger border radius for consistency
        padding: 14, // Increased padding
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, // Increased height
        shadowOpacity: 0.1, // Increased opacity
        shadowRadius: 4, // Increased radius
        elevation: 3,
    },
    otherPersonLeft: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
    },
    eyeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#f0f0f0", // Light background
        shadowColor: "#000", // Subtle shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    followButton: {
        backgroundColor: "#000",
        paddingHorizontal: 22, // Slightly more padding
        paddingVertical: 10, // Slightly more padding
        borderRadius: 22, // Adjusted radius
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, // Increased height
        shadowOpacity: 0.2, // Increased opacity
        shadowRadius: 6, // Increased radius
        elevation: 4,
    },
    followButtonText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "somar-regular",
    },
    otherPersonRight: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
    },
    otherPersonImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#fff",
    },
    otherPersonInfo: {
        alignItems: "flex-end",
    },
    otherPersonName: {
        fontSize: 12,
        color: "#000",
        fontFamily: "somar-bold",
    },
    otherPersonFollowers: {
        fontSize: 12,
        color: "#666",
        fontFamily: "somar-regular",
        marginTop: 2,
    },
    statusBar: {
        // This component style is generally not needed if StatusBar is handled globally or inline
    },
    statusBarLeft: {},
    timeText: {},
    statusBarRight: {},
    batteryContainer: {},
    batteryText: {},
    signalContainer: {},
    storiesCountBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#000",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FBFBFB",
    },
    storiesCountText: {
        color: "#fff",
        fontSize: 10,
        fontFamily: "somar-bold",
    },
    nameWithVerified: {},
    verifiedIcon: {},
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingVertical: 45, // Increased padding
        marginHorizontal: 16,
        backgroundColor: "#fff",
        borderRadius: 18, // Slightly larger radius
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, // Increased height
        shadowOpacity: 0.1, // Increased opacity
        shadowRadius: 6, // Increased radius
        elevation: 3,
        marginBottom: 20,
    },
    emptyStateIcon: {
        marginBottom: 24,
        opacity: 0.6,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontFamily: "somar-bold",
        color: "#333",
        marginBottom: 12,
        textAlign: "center",
    },
    emptyStateDescription: {
        fontSize: 16,
        fontFamily: "somar-regular",
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    retryButton: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 28, // Increased padding
        paddingVertical: 14, // Increased padding
        borderRadius: 28, // Adjusted radius
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, // Increased height
        shadowOpacity: 0.1, // Increased opacity
        shadowRadius: 4, // Increased radius
        elevation: 2,
    },
    retryIcon: {
        marginLeft: 4,
    },
    retryButtonText: {
        color: "#000",
        fontSize: 16,
        fontFamily: "somar-medium",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        minHeight: 300,
    },
    loadingSpinner: {
        marginBottom: 16,
        opacity: 0.7,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: "somar-regular",
        color: "#666",
        textAlign: "center",
    },
    emptyMyStatusCard: {
        borderWidth: 2,
        borderColor: "#000",
        borderStyle: "dashed",
        backgroundColor: "rgba(0,0,0,0.02)",
    },
    encourageText: {},
    primaryActionButton: {},
    secondaryActionButton: {},
    emptyStoriesContainer: {
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 32,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: "#fff",
        borderRadius: 18, // Slightly larger radius
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, // Increased height
        shadowOpacity: 0.1, // Increased opacity
        shadowRadius: 6, // Increased radius
        elevation: 3,
        marginHorizontal: 16,
    },
    emptyStoriesIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyStoriesTitle: {
        fontSize: 18,
        fontFamily: "somar-bold",
        color: "#333",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStoriesDescription: {
        fontSize: 14,
        fontFamily: "somar-regular",
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    refreshButton: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 18, // Increased padding
        paddingVertical: 10, // Increased padding
        borderRadius: 22, // Adjusted radius
        gap: 6,
        borderWidth: 1,
        borderColor: "#eee",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, // Increased height
        shadowOpacity: 0.1, // Increased opacity
        shadowRadius: 4, // Increased radius
        elevation: 2,
    },
    refreshButtonText: {
        color: "#000",
        fontSize: 14,
        fontFamily: "somar-medium",
    },
    emptyStateActions: {
        flexDirection: "row-reverse",
        gap: 12,
        alignItems: "center",
    },
    createStoryButton: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#000",
        paddingHorizontal: 24, // Slightly more padding
        paddingVertical: 14, // Slightly more padding
        borderRadius: 28, // Adjusted radius
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, // Increased height
        shadowOpacity: 0.15, // Increased opacity
        shadowRadius: 10, // Increased radius
        elevation: 4,
    },
    createStoryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "somar-medium",
    },
    // Simple My Status Styles
    simpleMyStatusCard: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20, // Slightly more padding
        marginHorizontal: 16,
        marginVertical: 14, // Slightly more vertical margin
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 }, // Increased height
        shadowOpacity: 0.35, // More opaque shadow
        shadowRadius: 5, // Slightly larger radius
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },
    simpleStatusLeft: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
    },
    simpleImageContainer: {
        position: "relative",
    },
    simpleStatusImage: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: "#f0f0f0",
        borderWidth: 2,
        borderColor: "#fff",
    },
    simpleAddIcon: {
        position: "absolute",
        bottom: -3,
        left: -3,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    simpleStatusInfo: {
        alignItems: "flex-end",
    },
    simpleStatusTitle: {
        fontSize: 17,
        color: "#000",
        fontFamily: "somar-bold",
        marginBottom: 4,
    },
    simpleStatusSubtitle: {
        fontSize: 14,
        color: "#000",
        fontFamily: "somar-medium",
    },
    simpleCameraIcon: {
        padding: 10,
        backgroundColor: "#f8f9fa",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e9ecef",
    },
    storyRingActive: { // New style for active story ring (black)
        position: "absolute",
        top: -5, // Adjusted for more prominent ring
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 38, // Adjusted for new ring size
        backgroundColor: "#000",
        padding: 2,
    },
    storyRingAdd: { // New style for add story ring (dashed gray)
        position: "absolute",
        top: -5, // Adjusted for more prominent ring
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 38, // Adjusted for new ring size
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: "#ccc",
        borderStyle: "dashed",
        padding: 0,
    },
    storyRingInnerActive: {
        flex: 1,
        backgroundColor: "#FBFBFB",
        borderRadius: 36, // Adjusted for new ring size
    },
    storyRingInnerAdd: {
        flex: 1,
        backgroundColor: "transparent",
        borderRadius: 36, // Adjusted for new ring size
    },
});
