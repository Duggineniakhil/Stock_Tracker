import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { apiLogin, apiRegister, googleLogin, apiLogout, SESSION_EXPIRED_EVENT } from '../services/api';
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
    updateUserPlan: (newPlan: string, token?: string) => void;
    updateUser: (changes: Partial<BackendUser>, token?: string) => void;
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

export const AuthProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
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

    // signInWithGoogle and the onAuthStateChanged listener both fire right after the popup
    // closes; share one in-flight backend exchange so the server only sees a single login.
    const backendSyncRef = useRef<{ uid: string; promise: Promise<BackendUser> } | null>(null);

    const syncFirebaseUserWithBackend = (firebaseUser: any): Promise<BackendUser> => {
        const inFlight = backendSyncRef.current;
        if (inFlight && inFlight.uid === firebaseUser.uid) return inFlight.promise;

        const promise = (async () => {
            const idToken = await firebaseUser.getIdToken();
            const res = await googleLogin({ idToken });
            const backendUser = persistBackendAuth(res);
            return { ...firebaseUser, ...backendUser } as BackendUser;
        })().finally(() => {
            if (backendSyncRef.current?.promise === promise) backendSyncRef.current = null;
        });
        backendSyncRef.current = { uid: firebaseUser.uid, promise };
        return promise;
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

                // The Firestore profile is optional extra data; failing to read it (offline,
                // rules) must not throw away a valid backend session.
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        nextUser = { ...nextUser, ...userDoc.data() } as BackendUser;
                    }
                } catch (profileError) {
                    console.warn('Could not load Firestore profile:', profileError);
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

    // The API client fires this when the backend rejects the token and it can't be refreshed.
    // Signing out of Firebase too means a Google user gets a fresh backend token on next sign-in.
    useEffect(() => {
        const handleSessionExpired = () => {
            clearStoredAuth();
            setUser(null);
            signOut(auth).catch(() => {});
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await apiLogin(email, password);
        const authUser = persistBackendAuth(res);
        setUser(authUser);
        return authUser;
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await apiRegister(name, email, password);
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
            await apiLogout();
            await signOut(auth);
            clearStoredAuth();
            setUser(null);
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    // Apply profile changes locally and persist a re-issued token so they survive a reload
    const updateUser = (changes: Partial<BackendUser>, token?: string) => {
        if (token) {
            localStorage.setItem('token', token);
        }
        setUser((prev) => (prev ? { ...prev, ...changes } : prev));
    };

    const updateUserPlan = (newPlan: string, token?: string) => updateUser({ plan: newPlan }, token);

    return (
        <AuthContext.Provider value={{ user, login, register, signInWithGoogle, logout, updateUserPlan, updateUser, loading }}>
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
