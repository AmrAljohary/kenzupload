import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useStorageState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // تحميل القيمة من التخزين
    useEffect(() => {
        async function loadStoredValue() {
            try {
                const storedValue = await AsyncStorage.getItem(key);

                if (storedValue !== null) {
                    setState(JSON.parse(storedValue));
                }
            } catch (e) {
                setError(e instanceof Error ? e : new Error(String(e)));
            } finally {
                setIsLoading(false);
            }
        }

        loadStoredValue();
    }, [key]);

    // تحديث القيمة في التخزين
    const setValue = async (value: T) => {
        try {
            const valueToStore =
                value instanceof Function ? value(state) : value;
            setState(valueToStore);
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
            console.error("Error setting value in storage:", e);
        }
    };

    // حذف القيمة من التخزين
    const removeValue = async () => {
        try {
            setState(initialValue);
            await AsyncStorage.removeItem(key);
        } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
            console.error("Error removing value from storage:", e);
        }
    };

    return {
        state,
        setValue,
        removeValue,
        isLoading,
        error,
    };
}
