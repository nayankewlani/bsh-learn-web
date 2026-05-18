import { create } from "zustand";
import { persist } from "zustand/middleware";
import client from "../api/client";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "educator" | "admin";
  avatar?: string;
  bio?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await client.post("/auth/login", { email, password });
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Login failed";
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      register: async (name, email, password, role = "student") => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await client.post("/auth/register", { name, email, password, role });
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Registration failed";
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        try {
          await client.post("/auth/logout");
        } catch {}
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null });
      },

      updateProfile: async (data) => {
        const { data: res } = await client.put("/auth/profile", data);
        set({ user: res.user });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "bsh-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
