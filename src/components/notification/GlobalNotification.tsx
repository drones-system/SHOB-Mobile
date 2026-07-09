import { Audio } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    const panY = useRef(new Animated.Value(0)).current;
    const activeSoundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        async function playAssetSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    playThroughEarpieceAndroid: false,
                });

                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/enemy_drone_popup.mp3')
                );

                activeSoundRef.current = sound;
                await sound.playAsync();
            } catch (error) {
                console.log('Error loading or playing the custom asset file:', error);
            }
        }

        if (visible) {
            panY.setValue(0);
            playAssetSound();
        }

        return () => {
            if (activeSoundRef.current) {
                activeSoundRef.current.unloadAsync().catch(() => { });
                activeSoundRef.current = null;
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
                    if (activeSoundRef.current) {
                        activeSoundRef.current.stopAsync().catch(() => { });
                        activeSoundRef.current.unloadAsync().catch(() => { });
                        activeSoundRef.current = null;
                    }

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