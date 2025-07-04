import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    Animated,
    StyleSheet,
    Platform,
    Keyboard,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useAppLanguage } from "@/hooks/useLanguage";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
    value: string;
    setValue: (val: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    cancelLabel?: string;
    onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    setValue,
    onSubmit,
    placeholder = "ابحث هنا...",
    cancelLabel = "إلغاء",
    onClear,
}) => {
    const { isRTL } = useAppLanguage();
    const animatedWidth = useRef(new Animated.Value(100)).current;
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: value ? 85 : 100,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const handleClear = () => {
        setValue("");
        if (onClear) onClear();
        // Focus the input after clearing
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        Keyboard.dismiss();
        onSubmit();
    };

    return (
        <View style={styles.Search}>
            <Animated.View
                style={[
                    styles.SearchBarContainer,
                    {
                        width: animatedWidth.interpolate({
                            inputRange: [0, 100],
                            outputRange: ["0%", "100%"],
                        }),
                    },
                ]}
            >
                <View style={isRTL ? styles.searchIconRTL : styles.searchIcon}>
                    <Ionicons name="search" size={20} color="#333" />
                </View>

                <TextInput
                    ref={inputRef}
                    style={[
                        styles.SearchBar,
                        isRTL ? styles.textRTL : styles.textLTR,
                    ]}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    onChangeText={(val) => setValue(val)}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {value ? (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClear}
                    >
                        <Ionicons name="close-circle" size={18} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </Animated.View>

            {value ? (
                <TouchableOpacity onPress={handleClear}>
                    <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default SearchBar;

export const styles = StyleSheet.create({
    Search: {
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 15,
        marginBottom: 10,
        zIndex: 10,
    },
    SearchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        gap: 5,
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchIconRTL: {
        marginLeft: 8,
    },
    SearchBar: {
        flex: 1,
        height: 48,
        fontSize: 15,
        fontFamily: Platform.OS === "ios" ? undefined : "somar-regular",
        color: "#333",
        padding: 0,
    },
    textRTL: {
        textAlign: "right",
    },
    textLTR: {
        textAlign: "left",
    },
    clearButton: {
        padding: 6,
    },
    cancelButtonText: {
        fontSize: 14,
        marginLeft: 12,
        color: "#333",
        fontFamily: Platform.OS === "ios" ? undefined : "somar-medium",
    },
});
