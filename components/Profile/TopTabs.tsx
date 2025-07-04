import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
    Platform,
} from "react-native";
import React from "react";
import { useAppLanguage } from "@/hooks/useLanguage";
import {
    MaterialCommunityIcons,
    MaterialIcons,
    Ionicons,
} from "@expo/vector-icons";
import VideoTab from "@/assets/icons/svgs/VideoTab";
import LikeTab from "@/assets/icons/svgs/LikeTab";
import SaveTab from "@/assets/icons/svgs/SaveTab";

const TopTabs = ({
    activeIndex,
    setActiveIndex,
}: {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
}) => {
    const { t, isRTL } = useAppLanguage();

    // عناوين التبويبات
    const tabLabels = [
        t("profile.myVideos") || "فيديوهاتي",
        t("profile.savedVideos") || "المحفوظات",
        t("profile.interactedVideos") || "التفاعلات",
    ];

    return (
        <View style={isRTL ? styles.arabicTopTabs : styles.TopTabs}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveIndex(0)}
                style={activeIndex == 0 ? styles.ActiveTab : styles.DeActiveTab}
            >
                <VideoTab fill={activeIndex == 0 ? "#1F2232" : "#8697AC"} />
                <Text
                    style={[
                        styles.tabLabel,
                        activeIndex == 0
                            ? styles.activeTabLabel
                            : styles.inactiveTabLabel,
                    ]}
                >
                    {tabLabels[0]}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveIndex(1)}
                style={activeIndex == 1 ? styles.ActiveTab : styles.DeActiveTab}
            >
                <SaveTab stroke={activeIndex == 1 ? "#1F2232" : "#8697AC"} />
                <Text
                    style={[
                        styles.tabLabel,
                        activeIndex == 1
                            ? styles.activeTabLabel
                            : styles.inactiveTabLabel,
                    ]}
                >
                    {tabLabels[1]}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveIndex(2)}
                style={activeIndex == 2 ? styles.ActiveTab : styles.DeActiveTab}
            >
                <LikeTab fill={activeIndex == 2 ? "#1F2232" : "#8697AC"} />
                <Text
                    style={[
                        styles.tabLabel,
                        activeIndex == 2
                            ? styles.activeTabLabel
                            : styles.inactiveTabLabel,
                    ]}
                >
                    {tabLabels[2]}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default TopTabs;

const styles = StyleSheet.create({
    TopTabs: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 0,
        marginHorizontal: 16,
        width: "100%",
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    arabicTopTabs: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 0,
        marginHorizontal: 16,
        width: "100%",
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    ActiveTab: {
        width: "30%",
        alignItems: "center",
        height: 56,
        borderBottomWidth: 2,
        borderBottomColor: "#1F2232",
        paddingBottom: 8,
        justifyContent: "center",
    },
    DeActiveTab: {
        width: "30%",
        alignItems: "center",
        height: 56,
        justifyContent: "center",
    },
    tabLabel: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
    activeTabLabel: {
        color: "#1F2232",
        fontWeight: "600",
    },
    inactiveTabLabel: {
        color: "#8697AC",
    },
});
