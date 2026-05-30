import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import api from '../services/api';
import { auth, db, googleProvider } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface BackendUser {
    id: number;
    email: string;
    name?: string;
    plan?: string;
    photoURL?: string;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

interface AuthContextState {
    user: BackendUser | null;
    login: (email: string, password: string) => Promise<BackendUser>;
    register: (name: string, email: string, password: string) => Promise<BackendUser>;
    signInWithGoogle: () => Promise<BackendUser>;
    logout: () => Promise<void>;
    updateUserPlan: (newPlan: string) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

const clearStoredAuth = () => {
    localStorage.removeItem('token');
};

const getStoredBackendUser = (): BackendUser | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const decoded = jwtDecode<JwtPayload & BackendUser>(token);
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
            clearStoredAuth();
            return null;
        }
        return decoded as BackendUser;
    } catch (e) {
        console.error('Invalid token', e);
        clearStoredAuth();
        return null;
    }
};

const unwrapAuthPayload = (res: any) => {
    if (res?.data?.token) return res.data;
    if (res?.token) return res;
    return null;
};

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [user, setUser] = useState<BackendUser | null>(null);
    const [loading, setLoading] = useState(true);

    const persistBackendAuth = (res: any): BackendUser => {
        const authPayload = unwrapAuthPayload(res);
        if (!authPayload?.token) {
            throw new Error('Backend did not return an auth token');
        }

        localStorage.setItem('token', authPayload.token);
        const decoded = jwtDecode<JwtPayload & BackendUser>(authPayload.token);
        return { ...decoded, ...authPayload.user } as BackendUser;
    };

    const syncFirebaseUserWithBackend = async (firebaseUser: any) => {
        const res = await api.googleLogin({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
        });

        const backendUser = persistBackendAuth(res);
        return { ...firebaseUser, ...backendUser } as BackendUser;
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
                    nextUser = { ...firebaseUser, ...nextUser } as BackendUser;
                }

                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    nextUser = { ...nextUser, ...userDoc.data() } as BackendUser;
                }
                setUser(nextUser);
            } catch (error) {
                console.error('Error syncing authenticated user:', error);
                clearStoredAuth();
                await signOut(auth).catch(() => {});
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.login(email, password);
        const authUser = persistBackendAuth(res);
        setUser(authUser);
        return authUser;
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await api.register(name, email, password);
        const authUser = persistBackendAuth(res);
        setUser(authUser);
        return authUser;
    };

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const authUser = await syncFirebaseUserWithBackend(firebaseUser);
            setUser(authUser);
            return authUser;
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.logout();
            await signOut(auth);
            clearStoredAuth();
            setUser(null);
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    const updateUserPlan = (newPlan: string) => {
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
