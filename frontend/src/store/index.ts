import { configureStore } from '@reduxjs/toolkit';
import timelineReducer from './slices/timelineSlice';

export const store = configureStore({
  reducer: {
    timeline: timelineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;