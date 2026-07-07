import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface NotificationContextType {
    visible: boolean;
    message: string;
    showNotification: (msg: string) => void;
    hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    // Internal queue — holds messages waiting to be shown
    const queueRef = useRef<string[]>([]);
    // Prevents showing a new item before the dismiss animation finishes
    const isShowingRef = useRef(false);

    /** Pop the next item from the queue and display it */
    const showNext = useCallback(() => {
        if (queueRef.current.length === 0) {
            isShowingRef.current = false;
            return;
        }
        const next = queueRef.current.shift()!;
        setMessage(next);
        setVisible(true);
        isShowingRef.current = true;
    }, []);

    /**
     * Called by consumers (e.g. shobMap) to schedule a notification.
     * If nothing is currently showing, display immediately.
     * Otherwise, enqueue so it shows after the current one is dismissed.
     */
    const showNotification = useCallback((msg: string) => {
        if (!isShowingRef.current) {
            // Nothing visible — show straight away
            setMessage(msg);
            setVisible(true);
            isShowingRef.current = true;
        } else {
            // Something is already on screen — add to queue
            queueRef.current.push(msg);
        }
    }, []);

    /**
     * Called by GlobalNotification when the user swipes the card away.
     * Hides the current card, then (after a short gap) shows the next queued one.
     */
    const hideNotification = useCallback(() => {
        setVisible(false);
        // Small delay so the swipe-out animation can finish before next card appears
        setTimeout(() => {
            showNext();
        }, 350);
    }, [showNext]);

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification, visible, message }}>
            {children}
        </NotificationContext.Provider>
    );
};