import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {OpenApp, AppDefinition} from '../../types';
import {getAppDefinitions} from '../../../components/apps';
import {
  fetchPinnedApps,
  savePinnedApps as savePinnedAppsAPI,
} from '../../../services/filesystemService';
import {RootState} from '..';
import {
  TASKBAR_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
} from '../../constants';

// Define the shape of the window manager's state
export interface WindowManagerState {
  openApps: OpenApp[];
  activeAppInstanceId: string | null;
  pinnedApps: string[];
  nextZIndex: number;
  appDefinitions: AppDefinition[];
  appsLoading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: WindowManagerState = {
  openApps: [],
  activeAppInstanceId: null,
  pinnedApps: [],
  nextZIndex: 10, // Starting z-index
  appDefinitions: [],
  appsLoading: true,
  error: null,
};

// Helper function to calculate window position
const getNextPosition = (
  openApps: OpenApp[],
  desktopSize: {width: number; height: number},
  appSize: {width: number; height: number},
) => {
  const baseOffset = 20;
  const openAppCount = openApps.filter(app => !app.isMinimized).length;
  const xOffset =
    (openAppCount * baseOffset) %
    (desktopSize.width - appSize.width - baseOffset * 2);
  const yOffset =
    (openAppCount * baseOffset) %
    (desktopSize.height - appSize.height - baseOffset * 2);

  return {
    x: Math.max(0, Math.min(xOffset + baseOffset, desktopSize.width - appSize.width)),
    y: Math.max(
      0,
      Math.min(yOffset + baseOffset, desktopSize.height - appSize.height),
    ),
  };
};

// --- ASYNC THUNKS ---

export const loadInitialData = createAsyncThunk(
  'windowManager/loadInitialData',
  async (_, {rejectWithValue}) => {
    try {
      const [definitions, fetchedPinnedApps] = await Promise.all([
        getAppDefinitions(),
        fetchPinnedApps(),
      ]);
      return {
        definitions,
        pinnedApps: fetchedPinnedApps || [],
      };
    } catch (error) {
      console.error('Failed to load initial app data:', error);
      return rejectWithValue('Failed to load initial app data');
    }
  },
);

export const savePinnedApps = createAsyncThunk(
  'windowManager/savePinnedApps',
  async (pinnedApps: string[], {rejectWithValue}) => {
    try {
      await savePinnedAppsAPI(pinnedApps);
      return pinnedApps;
    } catch (error) {
      console.error('Failed to save pinned apps:', error);
      return rejectWithValue('Failed to save pinned apps');
    }
  },
);

// --- SLICE DEFINITION ---

const windowManagerSlice = createSlice({
  name: 'windowManager',
  initialState,
  reducers: {
    openApp: (
      state,
      action: PayloadAction<{
        appIdentifier: string | AppDefinition;
        initialData?: any;
        desktopSize: {width: number; height: number};
      }>,
    ) => {
      const {appIdentifier, initialData, desktopSize} = action.payload;
      let baseAppDef: AppDefinition | undefined;
      let appOverrides: Partial<AppDefinition> = {};

      if (typeof appIdentifier === 'string') {
        baseAppDef = state.appDefinitions.find(app => app.id === appIdentifier);
      } else {
        const appInfo = appIdentifier as any;
        if (appInfo.appId) {
          baseAppDef = state.appDefinitions.find(
            app => app.id === appInfo.appId,
          );
          appOverrides = appInfo;
        } else if (appInfo.id) {
          baseAppDef = state.appDefinitions.find(app => app.id === appInfo.id);
          appOverrides = appInfo;
        }
      }

      if (!baseAppDef) return;
      const appDef: AppDefinition = {...baseAppDef, ...appOverrides};
      if (!appDef.id) return;

      if (!appDef.allowMultipleInstances && !initialData) {
        const existingInstance = state.openApps.find(
          app => app.id === appDef.id,
        );
        if (existingInstance) {
          state.activeAppInstanceId = existingInstance.instanceId;
          state.nextZIndex += 1;
          const appToFocus = state.openApps.find(
            app => app.instanceId === existingInstance.instanceId,
          );
          if (appToFocus) {
            appToFocus.zIndex = state.nextZIndex;
            appToFocus.isMinimized = false;
          }
          return;
        }
      }

      const instanceId = `${appDef.id}-${Date.now()}`;
      state.nextZIndex += 1;
      const defaultWidth = appDef.defaultSize?.width || DEFAULT_WINDOW_WIDTH;
      const defaultHeight = appDef.defaultSize?.height || DEFAULT_WINDOW_HEIGHT;

      const newApp: OpenApp = {
        ...appDef,
        instanceId,
        zIndex: state.nextZIndex,
        position: getNextPosition(state.openApps, desktopSize, {width: defaultWidth, height: defaultHeight}),
        size: {width: defaultWidth, height: defaultHeight},
        isMinimized: false,
        isMaximized: false,
        title: appDef.name,
        initialData,
      };

      state.openApps.push(newApp);
      state.activeAppInstanceId = instanceId;
    },
    closeApp: (state, action: PayloadAction<string>) => {
      const instanceId = action.payload;
      state.openApps = state.openApps.filter(
        app => app.instanceId !== instanceId,
      );
      if (state.activeAppInstanceId === instanceId) {
        const nextActiveApp =
          state.openApps.length > 0
            ? state.openApps.sort((a, b) => a.zIndex - b.zIndex)[
                state.openApps.length - 1
              ]?.instanceId
            : null;
        state.activeAppInstanceId = nextActiveApp;
      }
    },
    focusApp: (state, action: PayloadAction<string>) => {
      const instanceId = action.payload;
      const app = state.openApps.find(a => a.instanceId === instanceId);
      if (app && state.activeAppInstanceId !== instanceId) {
        state.nextZIndex += 1;
        app.zIndex = state.nextZIndex;
        state.activeAppInstanceId = instanceId;
      }
      if (app && app.isMinimized) {
        app.isMinimized = false;
      }
    },
    toggleMinimizeApp: (state, action: PayloadAction<string>) => {
      const instanceId = action.payload;
      const app = state.openApps.find(a => a.instanceId === instanceId);
      if (app) {
        app.isMinimized = !app.isMinimized;
        if (!app.isMinimized) {
          state.nextZIndex += 1;
          app.zIndex = state.nextZIndex;
          state.activeAppInstanceId = instanceId;
        } else if (state.activeAppInstanceId === instanceId) {
          state.activeAppInstanceId = null;
        }
      }
    },
    toggleMaximizeApp: (
      state,
      action: PayloadAction<{
        instanceId: string;
        desktopSize: {width: number; height: number};
      }>,
    ) => {
      const {instanceId, desktopSize} = action.payload;
      const app = state.openApps.find(a => a.instanceId === instanceId);
      if (app) {
        if (app.isMaximized) {
          app.isMaximized = false;
          app.position = app.previousPosition || {x: 20, y: 20};
          app.size = app.previousSize || {width: 600, height: 400};
        } else {
          state.nextZIndex += 1;
          app.zIndex = state.nextZIndex;
          state.activeAppInstanceId = instanceId;
          app.isMaximized = true;
          app.previousPosition = app.position;
          app.previousSize = app.size;
          app.position = {x: 0, y: 0};
          app.size = desktopSize;
        }
      }
    },
    updateAppPosition: (
      state,
      action: PayloadAction<{instanceId: string; position: {x: number; y: number}}>,
    ) => {
      const app = state.openApps.find(a => a.instanceId === action.payload.instanceId);
      if (app) {
        app.position = action.payload.position;
      }
    },
    updateAppSize: (
      state,
      action: PayloadAction<{
        instanceId: string;
        size: {width: number; height: number};
      }>,
    ) => {
      const app = state.openApps.find(a => a.instanceId === action.payload.instanceId);
      if (app) {
        app.size = action.payload.size;
      }
    },
    updateAppTitle: (
      state,
      action: PayloadAction<{instanceId: string; title: string}>,
    ) => {
      const app = state.openApps.find(a => a.instanceId === action.payload.instanceId);
      if (app) {
        app.title = action.payload.title;
      }
    },
    pinApp: (state, action: PayloadAction<string>) => {
      const appId = action.payload;
      if (!state.pinnedApps.includes(appId)) {
        state.pinnedApps.push(appId);
      }
    },
    unpinApp: (state, action: PayloadAction<string>) => {
      const appId = action.payload;
      state.pinnedApps = state.pinnedApps.filter(id => id !== appId);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadInitialData.pending, state => {
        state.appsLoading = true;
        state.error = null;
      })
      .addCase(loadInitialData.fulfilled, (state, action) => {
        state.appDefinitions = action.payload.definitions;
        state.pinnedApps = action.payload.pinnedApps;
        state.appsLoading = false;
      })
      .addCase(loadInitialData.rejected, (state, action) => {
        state.appsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(savePinnedApps.fulfilled, (state, action) => {
        state.pinnedApps = action.payload;
      });
  },
});

export const {
  openApp,
  closeApp,
  focusApp,
  toggleMinimizeApp,
  toggleMaximizeApp,
  updateAppPosition,
  updateAppSize,
  updateAppTitle,
  pinApp,
  unpinApp,
} = windowManagerSlice.actions;

export default windowManagerSlice.reducer;
