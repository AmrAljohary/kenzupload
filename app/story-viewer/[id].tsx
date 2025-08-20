import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, StatusBar, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/services/axios";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";

interface Story { 
    id: number;
    url: string; 
    user: {
        id: number;
        name: string;
        username: string;
        profile_image: string;
    };
    created_at: string;
}

export default function StoryViewerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stories, setStories] = useState<Story[]>([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const userId = typeof id === 'string' ? parseInt(id) : null; 

    useEffect(() => {
        if (userId) {
            fetchUserStories(userId);
        } else {
            setLoading(false); 
            console.error("User ID is missing for story viewer.");
        }
    }, [userId]);

    const fetchUserStories = async (fetchId: number) => {
        try {
            setLoading(true);
            // This API endpoint assumes it returns stories for a specific user
            const response = await api.get(`/stories/user/${fetchId}`); // Adjust API endpoint as needed
            
            if (response.ok && response.data && Array.isArray(response.data)) {
                setStories(response.data);
            } else {
                setStories([]);
            }
        } catch (error) {
            console.error("Error fetching user stories:", error);
            setStories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextStory = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            router.back(); // Go back if no more stories
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            router.back(); // Go back if no previous stories
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>{t("stories.loadingStories")}</Text>
            </View>
        );
    }

    if (stories.length === 0) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Text style={styles.errorText}>{t("stories.noStoriesFound")}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    }

    const currentStory = stories[currentStoryIndex];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Video
                source={{ uri: currentStory.url }}
                style={styles.video}
                resizeMode="cover"
                shouldPlay
                isLooping={false} // Stories usually don't loop indefinitely
                onPlaybackStatusUpdate={(status) => {
                    if (status.didJustFinish) {
                        handleNextStory();
                    }
                }}
            />

            {/* Header with user info */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Image source={{ uri: currentStory.user.profile_image }} style={styles.profileImage} />
                    <Text style={styles.username}>{currentStory.user.name || currentStory.user.username}</Text>
                    {/* Add timestamp if needed */}
                    <Text style={styles.timestamp}>{currentStory.created_at}</Text>
                </View>
            </View>

            {/* Navigation buttons */}
            <View style={styles.navigationOverlay}>
                <TouchableOpacity style={styles.navButton} onPress={handlePrevStory} />
                <TouchableOpacity style={styles.navButton} onPress={handleNextStory} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#fff",
        marginTop: 20,
        fontSize: 16,
    },
    errorText: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
    },
    video: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        paddingTop: Platform.OS === "ios" ? 60 : 30,
        paddingHorizontal: 15,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.3)", // Semi-transparent background
        paddingBottom: 10,
    },
    closeButton: {
        padding: 5,
        marginRight: 10,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#fff",
    },
    username: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "somar-bold",
    },
    timestamp: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        marginLeft: 10,
    },
    navigationOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        zIndex: 5, // Below header, above video
    },
    navButton: {
        flex: 1,
    },
    backButton: { // Style for the back button in no stories state
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 30,
        right: 20,
        zIndex: 11, 
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
    }
});
