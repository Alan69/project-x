import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { RootState, AppDispatch } from "../store";
import {
  setCredentials,
  setUser,
  logout as logoutAction,
  setLoading,
  restoreUser,
} from "../store/authSlice";
import { useLoginMutation, useGetCurrentUserQuery } from "../services/api";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  const [loginMutation] = useLoginMutation();
  const { refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  // Restore user data on mount if token exists but user is null
  useEffect(() => {
    if (token && !user) {
      console.log(
        "Token exists but user is null, attempting to restore user..."
      );
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("Restoring user from localStorage:", userData);
          dispatch(restoreUser(userData));
        } catch (error) {
          console.error("Error restoring user from localStorage:", error);
          // If stored user is corrupted, clear everything
          dispatch(logoutAction());
        }
      }
    }
  }, [token, user, dispatch]);

  const login = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      const result = await loginMutation({ email, password }).unwrap();

      console.log("Login successful:", result);

      // Handle successful login
      dispatch(setCredentials({ token: result.token, user: result.user }));
      navigate("/dashboard");
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error:
          error?.message ||
          error?.data?.message ||
          "Login failed. Please check your credentials.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    navigate("/login");
  };

  const updateUser = (userData: any) => {
    dispatch(setUser(userData));
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refetchCurrentUser,
  };
};
