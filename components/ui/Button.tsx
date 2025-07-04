import React from "react";
import {
    TouchableOpacity,
    TouchableOpacityProps,
    StyleSheet,
    ActivityIndicator,
    View,
} from "react-native";
import { Text } from "./Text";
import { useAppLanguage } from "../../hooks/useLanguage";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: "primary" | "secondary" | "outline" | "text";
    size?: "small" | "medium" | "large";
    loading?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = ({
    title,
    variant = "primary",
    size = "medium",
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    style,
    disabled,
    ...props
}: ButtonProps) => {
    const { isRTL } = useAppLanguage();

    // تبديل مواضع الأيقونات بناءً على اللغة
    const leftIcon = isRTL ? iconRight : iconLeft;
    const rightIcon = isRTL ? iconLeft : iconRight;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[variant],
                styles[size],
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === "primary" ? "#fff" : "#333"}
                    size="small"
                />
            ) : (
                <View
                    style={[
                        styles.buttonContainer,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                >
                    {leftIcon && (
                        <View style={styles.iconLeft}>{leftIcon}</View>
                    )}
                    <Text
                        variant="button"
                        color={variant === "primary" ? "#fff" : "#333"}
                        align="center"
                    >
                        {title}
                    </Text>
                    {rightIcon && (
                        <View style={styles.iconRight}>{rightIcon}</View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    primary: {
        backgroundColor: "#2563EB",
    },
    secondary: {
        backgroundColor: "#E5E7EB",
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#2563EB",
    },
    text: {
        backgroundColor: "transparent",
    },
    small: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    medium: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    large: {
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    fullWidth: {
        width: "100%",
    },
    disabled: {
        opacity: 0.6,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});
