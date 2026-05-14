import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { auth, db, googleProvider } from '../firebase/config';
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check LocalStorage for legacy JWT
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (e) {
                console.error("Invalid token", e);
                localStorage.removeItem('token');
            }
        }

        // 2. Listen to Firebase Auth State
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // User is signed in via Firebase
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUser({ ...firebaseUser, ...userDoc.data() });
                    } else {
                        // This case is handled in signInWithGoogle, but as a fallback:
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // If offline, still set the basic firebase user so they can see cached data if available
                    setUser(firebaseUser);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const res = await api.login(email, password);
        const { token, user: userData } = res.data;
        
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ ...decoded, ...userData });
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.register(name, email, password);
        const { token, user: userData } = res.data;
        
        if (token) {
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ ...decoded, ...userData });
        }
        return res.data;
    };

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            // Sync with backend
            const res = await api.googleLogin({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
            });

            const { token, refreshToken, user: userData } = res.data;
            
            if (token) {
                localStorage.setItem('token', token);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            }

            setUser({ ...firebaseUser, ...userData });
            return firebaseUser;
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('token');
            setUser(null);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const updateUserPlan = (newPlan) => {
        if (user) {
            setUser({ ...user, plan: newPlan });
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, signInWithGoogle, logout, updateUserPlan, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);
