import { Audio } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from './NotificationContext';

export default function GlobalNotification() {
    const { visible, message, hideNotification } = useNotification();
    const panY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let soundObject: Audio.Sound | null = null;

        async function playBuiltInSound() {
            try {
                // Enforce audio routing behavior to bypass physical silent/vibrate toggles
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    shouldRouteThroughEarpieceAndroid: false,
                });

                // Load and play a high-quality digital alarm ping straight via URL
                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://actions.google.com/sounds/v1/alerts/digital_watch_alarm_long.ogg' },
                    { shouldPlay: true }
                );
                soundObject = sound;
            } catch (error) {
                console.log('Error playing remote audio:', error);
            }
        }

        if (visible) {
            panY.setValue(0);
            playBuiltInSound();
        }

        return () => {
            if (soundObject) {
                soundObject.unloadAsync();
            }
        };
    }, [visible]);

    // Configure the PanResponder to handle vertical swipe gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -40) {
                    Animated.timing(panY, {
                        toValue: -150,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        hideNotification();
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <SafeAreaView style={styles.globalContainer} pointerEvents="box-none">
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.notificationCard,
                    { transform: [{ translateY: panY }] }
                ]}
            >
                {/* RIGHT SIDE: Icon Container */}
                <View style={styles.iconContainer}>
                    <View style={styles.redCircleOutline}>
                        <Text style={styles.exclamationMark}>!</Text>
                    </View>
                </View>

                {/* LEFT SIDE: Text Stack */}
                <View style={styles.textStack}>
                    <Text style={styles.titleText}>רחפן עיון נמצא בקרבתך!</Text>
                    <Text style={styles.distanceText}>מרחק 100 מ'</Text>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const screenWidth: number = Dimensions.get('window').width;
const GLOBAL_RED: string = '#FF0000';
const PURPLE_BG: string = '#6A0D91';

const styles = StyleSheet.create({
    globalContainer: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    notificationCard: {
        width: screenWidth * 0.92,
        backgroundColor: PURPLE_BG,
        borderColor: GLOBAL_RED,
        borderWidth: 2,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 10,
    },
    iconContainer: {
        marginLeft: 14,
    },
    redCircleOutline: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: GLOBAL_RED,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exclamationMark: {
        color: GLOBAL_RED,
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 26,
    },
    textStack: {
        flex: 1,
        alignItems: 'flex-start',
    },
    titleText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'right',
        width: '100%',
    },
    distanceText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '400',
        textAlign: 'right',
        width: '100%',
        marginTop: 2,
    },
});