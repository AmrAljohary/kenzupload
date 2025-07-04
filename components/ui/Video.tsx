import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import React from "react";
import FastImage from "react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
const { width } = Dimensions.get("window");

const VideoComponent = ({ item }: { item: any }) => {
    const navigation = useNavigation<any>();

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("UserReels", { id: item?.id })}
            style={styles.VideoCard}
        >
            <View style={styles.Shadow} />
            <FastImage
                source={{
                    uri: item?.url,
                }}
                style={styles.Img}
            />
            <View style={styles.VideoSeenContainer}>
                {/* <SmallPlay /> */}
                <Text style={styles.VideoSeen}>
                    {item?.views > 1000
                        ? (item?.views / 1000).toFixed(1) + "K"
                        : item?.views}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default VideoComponent;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ArabicContainer: {
        flex: 1,
        direction: "rtl",
    },
    Back: {
        width: 45,
        height: 45,
        backgroundColor: "rgba(255, 255, 255, 0.20)",
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    ImgHead: {
        height: 215,
        width,
        alignSelf: "center",
        borderBottomEndRadius: 30,
        borderBottomStartRadius: 30,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingHorizontal: 20,
    },
    Fake: {
        width: 45,
        height: 45,
    },
    UserDataContainer: {
        alignItems: "center",
        paddingTop: 45,
        paddingHorizontal: 20,
    },
    AvatarContainer: {
        width: 94,
        height: 94,
        borderRadius: 90,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        bottom: -42,
        position: "absolute",
        borderWidth: 3,
        borderColor: "#eee",
    },
    LiveContainer: {
        position: "absolute",
        bottom: -10,
        zIndex: 20,
        paddingHorizontal: 10,
        borderRadius: 50,
    },
    LiveText: {
        fontSize: 10,
        fontWeight: "500",

    },
    Avatar: {
        height: 89,
        width: 89,
        borderRadius: 85,
    },
    Name: {
        fontSize: 20,
        fontWeight: "700",

        marginTop: 7,
    },
    UserName: {
        color: "#979797",
        fontSize: 12,
        fontWeight: "400",
        marginTop: -3,
    },
    DataContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
    },
    DataView: {
        width: "25%",
        alignItems: "center",
    },
    DataNumbers: {

        fontSize: 15,
        fontWeight: "700",
    },
    DataText: {
        color: "#616977",
        fontSize: 12,
        fontWeight: "400",
        marginTop: -2,
    },
    FollowButton: {
        width: "65%",
        alignSelf: "center",
        height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.1,
    },
    EditButtonText: {
        fontSize: 14,
        fontWeight: "600",

    },
    ButtonsContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 30,
    },
    TopTabs: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        marginTop: 25,
        width: "100%",
    },
    ActiveTab: {
        width: "50%",
        alignItems: "center",
        height: 40,
        borderBottomWidth: 2,
    },
    DeActiveTab: {
        width: "50%",
        alignItems: "center",
        height: 40,
    },
    RenderDataContainer: {
        width,
        alignSelf: "center",
        marginTop: 20,
        flex: 1,
        padding: 20,
        marginBottom: 35,
    },
    columnWrapperStyle: {
        justifyContent: "space-between",
        direction: "rtl",
    },
    VideoCard: {
        height: 170,
        width: (width - 40) / 3 - 7,
        backgroundColor: "#00000033",
        borderRadius: 10,
    },
    Shadow: {
        backgroundColor: "#00000033",
        width: (width - 40) / 3 - 7,
        height: 170,
        borderRadius: 10,
        position: "absolute",
        zIndex: 10,
    },
    Img: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
    },
    VideoSeenContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        position: "absolute",
        bottom: 7,
        right: 7,
        zIndex: 20,
    },
    VideoSeen: {
        fontSize: 12,
        fontWeight: "700",

    },
    Separator: {
        height: 11,
    },
    invisible: {
        width: "31%",
        height: 170,
    },
    CommentsContainer: {
        justifyContent: "flex-end",
        margin: 0,
    },
    TopComments: {
        height: 75,
        width: width,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#F6F8F9",
        gap: 15,
        alignSelf: "center",
        paddingHorizontal: 20,
    },
    SmallLine: {
        width: 50,
        height: 5,
        backgroundColor: "#E7ECF0",
    },
    ShareView: {
        height: 450,
        width: width,
        alignSelf: "center",
        borderTopRightRadius: 25,
        borderTopLeftRadius: 25,
        paddingHorizontal: 20,
    },
    TopShareView: {
        alignItems: "flex-end",
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 10,
        marginBottom: -5,
    },
    ShareText: {
        fontSize: 20,
        fontWeight: "700",

    },
    ShareIcons: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 20,
    },
    ShareIconItem: {
        alignItems: "center",
        gap: 5,
    },
    ShareIcon: {
        height: 40,
        width: 40,
    },
    ShareIconText: {
        fontSize: 14,
        fontWeight: "400",

    },
    hrLine: {
        width: "100%",
        height: 1,
        backgroundColor: "#E7ECF0",
    },
});
