import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, logoutUser, type User } from '../lib/firebase';
import { syncUserProfile } from '../lib/api';
import { UserProfile } from '../types';


interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSyncProfile = async (firebaseUser: User) => {
    try {
      const synced = await syncUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
      setProfile(synced);
    } catch (err) {
      console.error('Profile synchronization error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        await handleSyncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const signIn = async () => {
    try {
      setLoading(true);
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        await handleSyncProfile(loggedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await handleSyncProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
