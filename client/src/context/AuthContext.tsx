"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "@/lib/firebase";
import { api } from "@/lib/api";

interface AppUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate cached user on mount (client-only) to avoid hydration mismatch
  useEffect(() => {
    try {
      const cached = localStorage.getItem("coderift_user");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // ignore corrupt cache
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await api.syncUser();
          setUser(appUser);
          localStorage.setItem("coderift_user", JSON.stringify(appUser));
        } catch (err) {
          console.error("Failed to sync user:", err);
          setUser(null);
          localStorage.removeItem("coderift_user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("coderift_user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    localStorage.removeItem("coderift_user");
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
