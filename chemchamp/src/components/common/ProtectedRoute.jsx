import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AppInitialSkeleton } from "./SkeletonLoader";

export const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <AppInitialSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // যদি স্টুডেন্ট হয় এবং অনবোর্ডিং বাকি থাকে
  if (profile?.role !== "admin" && !profile?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <AppInitialSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== "admin") {
    // সাধারণ স্টুডেন্ট যদি সরাসরি /admin ইউআরএলে ঢোকার চেষ্টা করে
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
