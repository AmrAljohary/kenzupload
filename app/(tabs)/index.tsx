import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function IndexRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/(tabs)/home");
    }, [router]);
    return null;
}
