"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SafeUser } from "@/lib/auth";
import { RoleType } from "@/models/User";
import { NotificationItem } from "@/types";
import { toast } from "sonner";

interface UserContextType {
  user: SafeUser | null;
  role: RoleType | null;
  currentRole: string; // compatibility with existing components
  isAuthenticated: boolean;
  isLoading: boolean;
  isStudent: boolean;
  isCR: boolean;
  isFaculty: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshData: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("You have been logged out.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const refreshData = async () => {
    try {
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch(`/api/notifications?all=true`, { method: "PATCH" });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const role = user?.role || null;
  const currentRole = (role ? role.toLowerCase() : "student") as string;
  const isStudent = role === "STUDENT";
  const isCR = role === "CR";
  const isFaculty = role === "FACULTY";
  const isAdmin = role === "ADMIN";

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        currentRole,
        isAuthenticated: !!user,
        isLoading,
        isStudent,
        isCR,
        isFaculty,
        isAdmin,
        logout,
        refreshUser,
        notifications,
        unreadCount,
        refreshData,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserSession must be used within a UserProvider");
  }
  return context;
}
