import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useLayoutEffect,
} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    I18nManager,
    LayoutChangeEvent,
} from "react-native";
import { useAppLanguage } from "@/hooks/useLanguage";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TabBarProps {
    activeTab: "videos" | "users" | "quran" | "poetry" | "saudi";
    setActiveTab: (
        tab: "videos" | "users" | "quran" | "poetry" | "saudi"
    ) => void;
    tabs?: Array<{
        key: "videos" | "users" | "quran" | "poetry" | "saudi";
        title: string;
    }>;
}

const TabBar = ({
    activeTab,
    setActiveTab,
    tabs = [
        { key: "videos", title: "search.videos" },
        { key: "users", title: "search.users" },
    ],
}: TabBarProps) => {
    const { t, isRTL } = useAppLanguage();
    const [tabMeasurements, setTabMeasurements] = useState<{
        [key: string]: { width: number; x: number };
    }>({});
    const [containerWidth, setContainerWidth] = useState(0);

    // Refs for animations
    const indicatorPosition = useRef(new Animated.Value(0)).current;
    const indicatorWidth = useRef(new Animated.Value(0)).current;
    const indicatorOpacity = useRef(new Animated.Value(0)).current;

    // Refs for measuring tabs
    const tabRefs = useRef<{ [key: string]: React.RefObject<View> }>({});
    const containerRef = useRef<View>(null);
    const initialized = useRef(false);

    // Create refs for each tab
    useEffect(() => {
        tabs.forEach((tab) => {
            if (!tabRefs.current[tab.key]) {
                tabRefs.current[tab.key] = React.createRef<View>();
            }
        });
    }, [tabs]);

    // Measure container width
    const handleContainerLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    // Measure individual tab width and position - ensure this isn't in a loop
    const measureTab = (tabKey: string) => {
        if (!containerRef.current || !tabRefs.current[tabKey]?.current) return;

        tabRefs.current[tabKey].current?.measureLayout(
            // @ts-ignore - React Native types are incomplete
            containerRef.current,
            (x: number, y: number, width: number, height: number) => {
                setTabMeasurements((prev) => {
                    // Only update if measurements changed to avoid loops
                    if (
                        prev[tabKey]?.width === width &&
                        prev[tabKey]?.x === x
                    ) {
                        return prev;
                    }
                    return {
                        ...prev,
                        [tabKey]: { width, x },
                    };
                });
            },
            () => console.log("Failed to measure tab")
        );
    };

    // Measure all tabs once container is ready
    useEffect(() => {
        if (containerWidth > 0 && !initialized.current) {
            tabs.forEach((tab) => measureTab(tab.key));
            initialized.current = true;
        }
    }, [containerWidth, tabs]);

    // Update indicator when activeTab changes or measurements are ready
    useEffect(() => {
        const currentTabMeasurement = tabMeasurements[activeTab];

        if (currentTabMeasurement && containerWidth > 0) {
            const { width, x } = currentTabMeasurement;
            const indicatorWidthValue = width * 0.7;
            const xPosition = x + (width - indicatorWidthValue) / 2;

            Animated.parallel([
                Animated.timing(indicatorPosition, {
                    toValue: xPosition,
                    duration: 250,
                    useNativeDriver: false,
                }),
                Animated.timing(indicatorWidth, {
                    toValue: indicatorWidthValue,
                    duration: 250,
                    useNativeDriver: false,
                }),
                Animated.timing(indicatorOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [activeTab, tabMeasurements, containerWidth]);

    return (
        <View
            ref={containerRef}
            style={styles.container}
            onLayout={handleContainerLayout}
        >
            <View
                style={[
                    styles.tabsContainer,
                    isRTL ? { flexDirection: "row-reverse" } : {},
                ]}
            >
                {/* Tab Buttons */}
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tab}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <View
                            ref={tabRefs.current[tab.key]}
                            style={styles.tabInner}
                            onLayout={() => measureTab(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab.key &&
                                        styles.activeTabText,
                                ]}
                            >
                                {t(tab.title)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bottom Line */}
            <View style={styles.bottomLine} />

            {/* Animated Indicator */}
            {containerWidth > 0 && (
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            width: indicatorWidth,
                            transform: [{ translateX: indicatorPosition }],
                            opacity: indicatorOpacity,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={["#333", "#000"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.indicatorLine}
                    />
                </Animated.View>
            )}
        </View>
    );
};

export default TabBar;

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
        paddingHorizontal: 10,
        position: "relative",
        alignItems: "center",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
    },
    tabsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 48,
        width: "100%",
    },
    tab: {
        flex: 1,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    tabInner: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    indicator: {
        position: "absolute",
        direction: I18nManager.isRTL ? "ltr" : "rtl",
        left: I18nManager.isRTL ? 0 : undefined,
        bottom: 0,
        height: 3,
        borderRadius: 3,
        overflow: "hidden",
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    indicatorLine: {
        width: "100%",
        height: "100%",
        borderRadius: 3,
    },
    bottomLine: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#eaeaea",
        zIndex: 0,
    },
    tabText: {
        fontSize: 15,
        color: "#888",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
        textAlign: "center",
    },
    activeTabText: {
        color: "#000",
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-bold",
    },
    ArabicContainer: {
        flex: 1,
        paddingHorizontal: 20,
        direction: "rtl",
        paddingTop: 5,
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
        borderRadius: 10,
        paddingHorizontal: 10,
        gap: 10,
        marginTop: 25,
    },
    SearchBar: {
        height: 45,
        width: "90%",
        textAlign: "right",
        fontSize: 14,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "400",
        marginTop: 45 / 2,
    },
    ScrollView: {
        flex: 1,
        width: "100%",
        alignSelf: "center",
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
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    userInfo: {
        flex: 1,
        alignContent: "flex-start",
        alignItems: "flex-start",
        marginLeft: 15,
    },
    userName: {
        fontSize: 16,
    },
    userHandle: {
        fontSize: 14,
        marginTop: 2,
    },
    followButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButtonText: {
        fontSize: 14,
    },
    usersListContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    placeholderImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#e0e0e0",
        marginRight: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    listContainer: {
        paddingBottom: 20,
    },
    followingButton: {},
});
