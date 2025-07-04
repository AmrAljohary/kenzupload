import React, { createContext, useState, useEffect, useContext } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
    forcedTheme?: "light" | "dark";
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "theme",
    forcedTheme,
}: ThemeProviderProps) {
    const systemTheme = useColorScheme() as "light" | "dark";
    const [theme, setThemeState] = useState<Theme>(defaultTheme);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(storageKey);
                if (savedTheme) {
                    setThemeState(savedTheme as Theme);
                }
            } catch (error) {
                console.error("Failed to load theme", error);
            }
        };

        loadTheme();
    }, [storageKey]);

    const setTheme = async (theme: Theme) => {
        try {
            await AsyncStorage.setItem(storageKey, theme);
            setThemeState(theme);
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    };

    const resolvedTheme =
        forcedTheme || (theme === "system" ? systemTheme : theme);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                resolvedTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
