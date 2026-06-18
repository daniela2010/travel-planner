import React, { createContext, useState, useContext, useEffect } from 'react';

// Auth Context
// Context lets us share the logged-in user's info across the whole app
// WITHOUT passing props down through every component ("prop drilling").
// We use Context (not Redux) for this because auth data is read in many
// places but changes rarely - the classic use case for Context.

// Create the context object.
const AuthContext = createContext();

// The Provider wraps the app and supplies the value to everything inside.
export const AuthProvider = ({ children }) => {
    // We keep a small user object in state. On first load we try to restore
    // it from localStorage (so a refresh doesn't "log the user out" in the UI).
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName');
        if (token && userName) {
            setUser({ name: userName });
        }
    }, []);

    // Called from the login/register pages after a successful request.
    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userName', userData.name);
        setUser({ name: userData.name });
    };

    // Called from the logout button.
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        setUser(null);
    };

    // Everything passed in "value" becomes available to consumers.
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// A small custom hook so components can read the context cleanly:
//    const { user, login, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);

export default AuthContext;