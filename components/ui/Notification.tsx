import React, { useEffect, useRef } from "react";
import {
    Modal,
    StyleSheet,
    View,
    Animated,
    Dimensions,
    StatusBar,
} from "react-native";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
export type NotificationType = "success" | "error" | "loading" | "info";

interface NotificationProps {
    type: NotificationType;
    mainText: string;
    subText?: string;
    visible: boolean;
    onClose?: () => void;
    autoClose?: boolean;
    duration?: number;
}

export const Notification = ({
    type,
    mainText,
    subText,
    visible,
    onClose,
    autoClose = true,
    duration = 3000,
}: NotificationProps) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start();

            if (type === "loading") {
                Animated.loop(
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ).start();
            }

            if (type !== "loading" && autoClose) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, type, duration, autoClose]);

    const handleClose = () => {
        if (onClose) onClose();
    };

    const getIconName = () => {
        switch (type) {
            case "success":
                return "checkmark-circle";
            case "error":
                return "close-circle";
            case "loading":
                return "hourglass";
            case "info":
            default:
                return "information-circle";
        }
    };

    const getIconColor = () => {
        switch (type) {
            case "success":
                return "#25D366";
            case "error":
                return "#FE3A46";
            case "loading":
                return "#000";
            case "info":
            default:
                return "#0088FF";
        }
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    if (!visible) return null;

    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                {
                    width: "100%",
                    height: "100%",
                    backgroundColor: "black",
                    opacity: 0.05,
                    zIndex: 2147483647,
                },
            ]}
        >
            <StatusBar backgroundColor="rgba(0,0,0,0.5)" translucent />
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.centeredView}>
                        <Animated.View
                            style={[
                                styles.modalView,
                                {
                                    opacity,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrapper,
                                    { backgroundColor: getIconColor() },
                                ]}
                            >
                                {type === "loading" ? (
                                    <Animated.View
                                        style={{
                                            transform: [{ rotate: spin }],
                                        }}
                                    >
                                        <Ionicons
                                            name="refresh-outline"
                                            size={40}
                                            color="#fff"
                                        />
                                    </Animated.View>
                                ) : (
                                    <Ionicons
                                        name={getIconName()}
                                        size={40}
                                        color="#fff"
                                    />
                                )}
                            </View>
                            <Text style={styles.mainText}>{mainText}</Text>
                            {subText && (
                                <Text style={styles.subText}>{subText}</Text>
                            )}
                        </Animated.View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    modalView: {
        width: width * 0.85,
        maxWidth: 340,
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 15,
    },
    iconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    mainText: {
        fontSize: 22,
        fontFamily: "somar-bold",
        marginBottom: 10,
        color: "#000",
        textAlign: "center",
    },
    subText: {
        fontSize: 16,
        fontFamily: "somar-regular",
        color: "#555",
        textAlign: "center",
        marginBottom: 5,
    },
    loadingIndicator: {
        marginTop: 15,
        height: 24,
    },
});
