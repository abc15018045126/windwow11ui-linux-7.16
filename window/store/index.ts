import {configureStore} from '@reduxjs/toolkit';
import windowManagerReducer from './windowManager/slice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    windowManager: windowManagerReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // We are putting non-serializable values like React components into the store.
        // This is generally not recommended, but it's part of the existing architecture.
        // We will ignore the check for the specific action that loads this data,
        // and for the paths in the state where this data is stored.
        ignoredActions: ['windowManager/loadInitialData/fulfilled'],
        ignoredPaths: [
          'windowManager.appDefinitions',
          'windowManager.openApps',
        ],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
