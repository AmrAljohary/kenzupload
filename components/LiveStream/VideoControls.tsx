import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";

interface VideoControlsProps {
    onTogglePlayPause: () => void;
    onPlayPreviousVideo: () => void;
    onPlayNextVideo: () => void;
    onToggleMute: () => void;
    onTogglePlaybackSpeed: () => void;
    onSeek: (value: number) => void;
    onToggleFullscreen: () => void;
    duration: number;
    currentTime: number;
    rate: number;
    isMuted: boolean;
    shouldPlay: boolean;
    fullScreenValue: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
    onTogglePlayPause,
    onPlayPreviousVideo,
    onPlayNextVideo,
    onToggleMute,
    onTogglePlaybackSpeed,
    onSeek,
    onToggleFullscreen,
    duration,
    currentTime: time,
    rate,
    isMuted,
    shouldPlay,
    fullScreenValue,
}) => {
    const formatTime = (timeInMillis: number) => {
        if (!isNaN(timeInMillis)) {
            const totalSeconds = Math.floor(timeInMillis / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            return `${minutes < 10 ? "0" : ""}${minutes}:${
                seconds < 10 ? "0" : ""
            }${seconds}`;
        }

        return "00:00";
    };

    return (
        <>
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={onTogglePlayPause}
                    style={styles.controlButton}
                >
                    <Ionicons
                        name={shouldPlay ? "pause" : "play-sharp"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onPlayPreviousVideo}
                    style={styles.controlButton}
                >
                    <AntDesign name="stepbackward" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onPlayNextVideo}
                    style={styles.controlButton}
                >
                    <AntDesign name="stepforward" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onToggleMute}
                    style={styles.controlButton}
                >
                    <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onTogglePlaybackSpeed}
                    style={styles.controlButton}
                >
                    <Text style={styles.playbackSpeedText}>{`${rate}x`}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onToggleFullscreen}
                    style={styles.controlButton}
                >
                    <MaterialIcons
                        name={
                            fullScreenValue ? "fullscreen-exit" : "fullscreen"
                        }
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(time)}</Text>
                <Slider
                    containerStyle={styles.slider}
                    minimumValue={0}
                    maximumValue={duration * 1000}
                    value={time}
                    onValueChange={onSeek}
                    onSlidingComplete={onSeek}
                    minimumTrackTintColor="#FFF"
                    maximumTrackTintColor="#AAA"
                    thumbTintColor="#FFF"
                />
                <Text style={styles.timeText}>
                    {formatTime(duration * 1000)}
                </Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    controlButton: {
        marginHorizontal: 10,
    },
    playbackSpeedText: {
        color: "white",
        fontSize: 16,
        fontFamily: "somar-medium",
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 10,
    },
    slider: {
        flex: 1,
        marginHorizontal: 10,
    },
    timeText: {
        color: "white",
        fontSize: 12,
        fontFamily: "somar-regular",
    },
});

export default VideoControls;
