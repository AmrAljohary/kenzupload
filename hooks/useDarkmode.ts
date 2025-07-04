import { useColorScheme } from "react-native";
import { useStorageState } from "./useStorageState";

type Theme = "light" | "dark" | "system";

export function useDarkmode() {
    const systemTheme = useColorScheme() || "light";
    const { state: storedTheme, setValue: setStoredTheme } =
        useStorageState<Theme>("ui-theme", "system");

    const toggleTheme = () => {
        if (storedTheme === "system") {
            setStoredTheme("dark");
        } else if (storedTheme === "dark") {
            setStoredTheme("light");
        } else {
            setStoredTheme("system");
        }
    };

    const setTheme = (theme: Theme) => {
        setStoredTheme(theme);
    };

    const getTheme = (): "light" | "dark" => {
        if (storedTheme === "system") {
            return systemTheme as "light" | "dark";
        }
        return storedTheme as "light" | "dark";
    };

    const isDarkTheme = getTheme() === "dark";

    return {
        theme: storedTheme,
        isDarkTheme,
        toggleTheme,
        setTheme,
        getTheme,
    };
}
