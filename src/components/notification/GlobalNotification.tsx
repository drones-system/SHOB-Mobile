import { Audio } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, PanResponder, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEasterEgg } from '../easter-egg/EasterEggContext';
import { useNotification } from './NotificationContext';

const EASTER_EGG_NAMES = ['סשה', 'עומר', 'שחר', 'איתן'] as const;
const RAINBOW_COLORS = [
    '#FF0000', '#FF7700', '#FFFF00', '#00FF00',
    '#0000FF', '#8B00FF', '#FF0000',
];

function getRandomName(): string {
    return EASTER_EGG_NAMES[Math.floor(Math.random() * EASTER_EGG_NAMES.length)];
}

export default function GlobalNotification() {
    // Destructure message, body, and text to catch whatever property name your custom context file uses
    const context = useNotification() as any;
    const visible = context?.visible;
    const hideNotification = context?.hideNotification;

    // Safeguard: Fallback to whatever string exists in your context hook
    const displayMessage = context?.message || context?.body || context?.text || "";

    const { funnyMode } = useEasterEgg();

    const panY = useRef(new Animated.Value(0)).current;
    const activeSoundRef = useRef<Audio.Sound | null>(null);

    // Rainbow border animation
    const rainbowProgress = useRef(new Animated.Value(0)).current;
    const rainbowColorRef = useRef(RAINBOW_COLORS[0]);
    const rainbowAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    // Random name chosen at notification show time
    const easterEggNameRef = useRef<string>(getRandomName());

    useEffect(() => {
        async function playAssetSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
                });

                const soundFile = funnyMode
                    ? require('../../assets/easter_egg/sound/DUBISTGUTGENUG.mp3')
                    : require('../../assets/sounds/enemy_drone_popup.mp3');

                const { sound } = await Audio.Sound.createAsync(soundFile);

                activeSoundRef.current = sound;
                await sound.playAsync();
            } catch (error) {
                console.log('Error loading or playing the custom asset file:', error);
            }
        }

        if (visible) {
            panY.setValue(0);
            // Pick a new random name each time the notification shows
            easterEggNameRef.current = getRandomName();
            playAssetSound();

            if (funnyMode) {
                // Start the looping rainbow animation
                rainbowProgress.setValue(0);
                rainbowAnimRef.current = Animated.loop(
                    Animated.timing(rainbowProgress, {
                        toValue: 1,
                        duration: 1200,
                        easing: Easing.linear,
                        useNativeDriver: false,
                    })
                );
                rainbowAnimRef.current.start();
            }
        } else {
            // Stop rainbow when hidden
            if (rainbowAnimRef.current) {
                rainbowAnimRef.current.stop();
                rainbowAnimRef.current = null;
            }
        }

        return () => {
            if (activeSoundRef.current) {
                activeSoundRef.current.unloadAsync().catch(() => { });
                activeSoundRef.current = null;
            }
            if (rainbowAnimRef.current) {
                rainbowAnimRef.current.stop();
                rainbowAnimRef.current = null;
            }
        };
    }, [visible]);

    // Interpolate the rainbow progress into a border color
    const rainbowBorderColor = rainbowProgress.interpolate({
        inputRange: RAINBOW_COLORS.map((_, i) => i / (RAINBOW_COLORS.length - 1)),
        outputRange: RAINBOW_COLORS,
    });

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
                    if (activeSoundRef.current) {
                        activeSoundRef.current.stopAsync().catch(() => { });
                        activeSoundRef.current.unloadAsync().catch(() => { });
                        activeSoundRef.current = null;
                    }

                    Animated.timing(panY, {
                        toValue: -150,
                        duration: 200,
                        useNativeDriver: false,
                    }).start(() => {
                        hideNotification();
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    // Build the funny-mode title: replace "רחפן" with the random name
    const titleText = funnyMode
        ? `${easterEggNameRef.current} עיון נמצא בקרבתך!`
        : 'רחפן עיון נמצא בקרבתך!';

    return (
        <SafeAreaView style={styles.globalContainer} pointerEvents="box-none">
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.notificationCard,
                    { transform: [{ translateY: panY }] },
                    funnyMode && { borderColor: rainbowBorderColor, borderWidth: 3 },
                ]}
            >
                {/* RIGHT SIDE: Icon Container */}
                <View style={styles.iconContainer}>
                    <Animated.View
                        style={[
                            styles.redCircleOutline,
                            funnyMode && { borderColor: rainbowBorderColor },
                        ]}
                    >
                        <Text
                            style={[
                                styles.exclamationMark,
                                funnyMode && { color: '#FFFFFF' },
                            ]}
                        >
                            !
                        </Text>
                    </Animated.View>
                </View>

                {/* LEFT SIDE: Text Stack */}
                <View style={styles.textStack}>
                    <Text style={styles.titleText}>{titleText}</Text>
                    {/* Dynamically fallback to whatever valid text string came out of your context state */}
                    {displayMessage ? <Text style={styles.distanceText}>{displayMessage}</Text> : null}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const screenWidth: number = Dimensions.get('window').width;
const GLOBAL_RED: string = '#FF0000';
const PURPLE_BG: string = '#000000';

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
        marginTop: 4,
    },
});
