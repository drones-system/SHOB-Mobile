import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

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

    const showNotification = useCallback((msg: string) => {
        setMessage(msg);
        setVisible(true);
    }, []);

    const hideNotification = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification, visible, message }}>
            {children}
        </NotificationContext.Provider>
    );
};