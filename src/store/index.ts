import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { performanceReviewApi } from "../services/api";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [performanceReviewApi.reducerPath]: performanceReviewApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(performanceReviewApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
