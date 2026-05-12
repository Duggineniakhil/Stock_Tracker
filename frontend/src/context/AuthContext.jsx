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
                // User is signed in via Firebase
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    setUser({ ...firebaseUser, ...userDoc.data() });
                } else {
                    // This case is handled in signInWithGoogle, but as a fallback:
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

            // Store/Update user info in Firestore
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            const userData = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                updatedAt: serverTimestamp()
            };

            if (!userSnap.exists()) {
                userData.createdAt = serverTimestamp();
                await setDoc(userRef, userData);
            } else {
                await setDoc(userRef, userData, { merge: true });
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
