import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Helper function to get stored user data
const getStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing stored user:", error);
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem("authToken"),
  isAuthenticated: !!localStorage.getItem("authToken") && !!getStoredUser(),
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state: AuthState,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
    },
    setUser: (state: AuthState, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("authUser", JSON.stringify(action.payload));
    },
    logout: (state: AuthState) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
    setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    restoreUser: (state: AuthState, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("authUser", JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, setUser, logout, setLoading, restoreUser } =
  authSlice.actions;
export default authSlice.reducer;
