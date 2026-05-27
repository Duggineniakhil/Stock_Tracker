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
    getDoc
} from 'firebase/firestore';

const AuthContext = createContext(null);

const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
};

const getStoredBackendUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
            clearStoredAuth();
            return null;
        }
        return decoded;
    } catch (e) {
        console.error("Invalid token", e);
        clearStoredAuth();
        return null;
    }
};

const unwrapAuthPayload = (res) => {
    if (res?.data?.token) return res.data;
    if (res?.token) return res;
    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const persistBackendAuth = (res) => {
        const authPayload = unwrapAuthPayload(res);
        if (!authPayload?.token) {
            throw new Error('Backend did not return an auth token');
        }

        localStorage.setItem('token', authPayload.token);
        if (authPayload.refreshToken) {
            localStorage.setItem('refreshToken', authPayload.refreshToken);
        }

        const decoded = jwtDecode(authPayload.token);
        return { ...decoded, ...authPayload.user };
    };

    const syncFirebaseUserWithBackend = async (firebaseUser) => {
        const res = await api.googleLogin({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
        });
        const backendUser = persistBackendAuth(res);
        return { ...firebaseUser, ...backendUser };
    };

    useEffect(() => {
        const storedUser = getStoredBackendUser();
        if (storedUser) {
            setUser(storedUser);
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (!firebaseUser) {
                    if (!getStoredBackendUser()) {
                        setUser(null);
                    }
                    return;
                }

                let nextUser = getStoredBackendUser();
                if (!nextUser) {
                    nextUser = await syncFirebaseUserWithBackend(firebaseUser);
                } else {
                    nextUser = { ...firebaseUser, ...nextUser };
                }

                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    nextUser = { ...nextUser, ...userDoc.data() };
                }
                setUser(nextUser);
            } catch (error) {
                console.error("Error syncing authenticated user:", error);
                clearStoredAuth();
                await signOut(auth).catch(() => {});
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const res = await api.login(email, password);
        const authUser = persistBackendAuth(res);
        setUser(authUser);
        return unwrapAuthPayload(res);
    };

    const register = async (name, email, password) => {
        const res = await api.register(name, email, password);
        const authUser = persistBackendAuth(res);
        setUser(authUser);
        return unwrapAuthPayload(res);
    };

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            const authUser = await syncFirebaseUserWithBackend(firebaseUser);
            setUser(authUser);
            return authUser;
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            clearStoredAuth();
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
