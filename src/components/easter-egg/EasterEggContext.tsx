import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface EasterEggContextType {
    funnyMode: boolean;
    activateFunnyMode: () => void;
}

const EasterEggContext = createContext<EasterEggContextType | undefined>(undefined);

export const useEasterEgg = () => {
    const context = useContext(EasterEggContext);
    if (!context) {
        throw new Error('useEasterEgg must be used within an EasterEggProvider');
    }
    return context;
};

export const EasterEggProvider = ({ children }: { children: ReactNode }) => {
    const [funnyMode, setFunnyMode] = useState(false);

    const activateFunnyMode = useCallback(() => {
        setFunnyMode(true);
    }, []);

    return (
        <EasterEggContext.Provider value={{ funnyMode, activateFunnyMode }}>
            {children}
        </EasterEggContext.Provider>
    );
};
