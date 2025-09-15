"use client";
import { useState, createContext, useContext } from "react";

const UserContext = createContext(null);

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
}

export default function UserProvider({ initialUser, children }) {
    const [user, setUser] = useState(initialUser);

    const updateUser = (newUserData) => {
        setUser(prev => ({
            ...prev,
            ...newUserData
        }));
    };

    const contextValue = {
        user,
        setUser,
        updateUser
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
}