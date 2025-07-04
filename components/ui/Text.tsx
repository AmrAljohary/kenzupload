import {
    Text as RNText,
    TextProps as RNTextProps,
    StyleSheet,
    I18nManager,
} from "react-native";
import React from "react";
import { useAppLanguage } from "../../hooks/useLanguage";
import { FONTS, getFont } from "../../constants/Fonts";

interface TextProps extends RNTextProps {
    variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "button";
    color?: string;
    align?: "auto" | "left" | "right" | "center" | "justify";
    fontWeight?:
        | "thin"
        | "extralight"
        | "light"
        | "regular"
        | "medium"
        | "semibold"
        | "bold"
        | "extrabold"
        | "black";
    italic?: boolean;
    children: React.ReactNode;
}

export const Text = ({
    variant = "body",
    style,
    color,
    align,
    fontWeight,
    italic = false,
    children,
    ...props
}: TextProps) => {
    const { isRTL } = useAppLanguage();

    // ضبط محاذاة النص بناءً على اتجاه اللغة
    const getTextAlign = () => {
        if (align) return align;
        if (align === "left") return isRTL ? "right" : "left";
        if (align === "right") return isRTL ? "left" : "right";
        return isRTL ? "right" : "left"; // القيمة الافتراضية
    };

    // تحديد الخط المناسب بناءً على نوع النص ووزنه
    const getFontFamily = () => {
        if (fontWeight) {
            return getFont(fontWeight, italic);
        }

        // إذا لم يتم تحديد وزن، استخدم القيم الافتراضية حسب النوع
        switch (variant) {
            case "h1":
                return getFont("black", italic);
            case "h2":
                return getFont("bold", italic);
            case "h3":
                return getFont("semibold", italic);
            case "h4":
                return getFont("medium", italic);
            case "button":
                return getFont("bold", italic);
            case "caption":
                return getFont("light", italic);
            case "body":
            default:
                return getFont("regular", italic);
        }
    };

    return (
        <RNText
            style={[
                styles[variant],
                {
                    color: color,
                    textAlign: getTextAlign(),
                    writingDirection: isRTL ? "rtl" : "ltr",
                    fontFamily: getFontFamily(),
                },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};

const styles = StyleSheet.create({
    h1: {
        fontSize: 32,
        marginBottom: 10,
    },
    h2: {
        fontSize: 28,
        marginBottom: 8,
    },
    h3: {
        fontSize: 24,
        marginBottom: 6,
    },
    h4: {
        fontSize: 20,
        marginBottom: 4,
    },
    body: {
        fontSize: 16,
        marginBottom: 2,
    },
    caption: {
        fontSize: 14,
        color: "#666",
    },
    button: {
        fontSize: 16,
    },
});
