import {useCallback, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  loadInitialData,
  openApp as openAppAction,
  closeApp as closeAppAction,
  focusApp as focusAppAction,
  toggleMinimizeApp as toggleMinimizeAppAction,
  toggleMaximizeApp as toggleMaximizeAppAction,
  updateAppPosition as updateAppPositionAction,
  updateAppSize as updateAppSizeAction,
  updateAppTitle as updateAppTitleAction,
  pinApp as pinAppAction,
  unpinApp as unpinAppAction,
  savePinnedApps,
} from '../store/windowManager/slice';
import {RootState, AppDispatch} from '../store';
import {AppDefinition} from '../types';
import {TASKBAR_HEIGHT} from '../constants';

// This is the new, Redux-powered hook.
export const useWindowManager = (
  desktopRef: React.RefObject<HTMLDivElement>,
) => {
  const dispatch: AppDispatch = useDispatch();
  const {
    openApps,
    activeAppInstanceId,
    appDefinitions,
    appsLoading,
    pinnedApps,
  } = useSelector((state: RootState) => state.windowManager);

  // Load initial data when the hook is first used
  useEffect(() => {
    dispatch(loadInitialData());
  }, [dispatch]);

  const getDesktopSize = () => {
    const width = desktopRef.current?.clientWidth || window.innerWidth;
    const height =
      (desktopRef.current?.clientHeight || window.innerHeight) - TASKBAR_HEIGHT;
    return {width, height};
  };

  // --- Action Dispatchers ---

  const openApp = useCallback(
    async (appIdentifier: string | AppDefinition, initialData?: any) => {
      let baseAppDef: AppDefinition | undefined;
      let appOverrides: Partial<AppDefinition> = {};

      if (typeof appIdentifier === 'string') {
        baseAppDef = appDefinitions.find(app => app.id === appIdentifier);
      } else {
        const appInfo = appIdentifier as any;
        if (appInfo.appId) {
          baseAppDef = appDefinitions.find(app => app.id === appInfo.appId);
          appOverrides = appInfo;
        } else if (appInfo.id) {
          baseAppDef = appDefinitions.find(app => app.id === appInfo.id);
          appOverrides = appInfo;
        }
      }

      if (!baseAppDef) {
        const id =
          typeof appIdentifier === 'string'
            ? appIdentifier
            : JSON.stringify(appIdentifier);
        console.error(`App with identifier "${id}" not found or invalid.`);
        return;
      }

      const appDef: AppDefinition = {...baseAppDef, ...appOverrides};

      if (appDef.isExternal && appDef.externalPath) {
        if (window.electronAPI?.launchExternalApp) {
          window.electronAPI.launchExternalApp(appDef.externalPath);
        } else {
          fetch('/api/launch', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({path: appDef.externalPath}),
          }).catch(error => {
            console.error('Failed to launch external app via API:', error);
            alert(
              'Failed to launch application. Ensure the backend server is running.',
            );
          });
        }
        return;
      }

      if (!appDef.id) {
        console.error('Cannot open internal app without an ID.', appDef);
        return;
      }

      // If we got here, it's an internal app. Dispatch to Redux.
      dispatch(
        openAppAction({
          appIdentifier,
          initialData,
          desktopSize: getDesktopSize(),
        }),
      );
    },
    [dispatch, appDefinitions],
  );

  const closeApp = useCallback(
    (instanceId: string) => {
      dispatch(closeAppAction(instanceId));
    },
    [dispatch],
  );

  const focusApp = useCallback(
    (instanceId: string) => {
      dispatch(focusAppAction(instanceId));
    },
    [dispatch],
  );

  const toggleMinimizeApp = useCallback(
    (instanceId: string) => {
      dispatch(toggleMinimizeAppAction(instanceId));
    },
    [dispatch],
  );

  const toggleMaximizeApp = useCallback(
    (instanceId: string) => {
      dispatch(
        toggleMaximizeAppAction({instanceId, desktopSize: getDesktopSize()}),
      );
    },
    [dispatch],
  );

  const updateAppPosition = useCallback(
    (instanceId: string, position: {x: number; y: number}) => {
      dispatch(updateAppPositionAction({instanceId, position}));
    },
    [dispatch],
  );

  const updateAppSize = useCallback(
    (instanceId: string, size: {width: number; height: number}) => {
      dispatch(updateAppSizeAction({instanceId, size}));
    },
    [dispatch],
  );

  const updateAppTitle = useCallback(
    (instanceId: string, title: string) => {
      dispatch(updateAppTitleAction({instanceId, title}));
    },
    [dispatch],
  );

  const pinApp = useCallback(
    (appId: string) => {
      const newPinnedApps = [...pinnedApps, appId];
      dispatch(pinAppAction(appId));
      dispatch(savePinnedApps(newPinnedApps));
    },
    [dispatch, pinnedApps],
  );

  const unpinApp = useCallback(
    (appId: string) => {
      const newPinnedApps = pinnedApps.filter(id => id !== appId);
      dispatch(unpinAppAction(appId));
      dispatch(savePinnedApps(newPinnedApps));
    },
    [dispatch, pinnedApps],
  );

  const taskbarApps = useMemo(() => {
    const runningInstanceAppIds = new Set(openApps.map(app => app.id));

    const pinnedAndNotRunning = pinnedApps
      .map(appId => appDefinitions.find(def => def.id === appId))
      .filter(
        (appDef): appDef is AppDefinition =>
          !!appDef && !runningInstanceAppIds.has(appDef.id),
      );

    const combined = [
      ...openApps.map(app => ({
        ...app,
        isOpen: true,
        isActive: app.instanceId === activeAppInstanceId,
      })),
      ...pinnedAndNotRunning.map(appDef => ({
        ...appDef,
        isOpen: false,
        isActive: false,
      })),
    ];

    return combined;
  }, [pinnedApps, openApps, appDefinitions, activeAppInstanceId]);

  // The hook returns the same "interface" as before.
  return {
    openApps,
    activeAppInstanceId,
    appDefinitions,
    appsLoading,
    desktopRef,
    openApp,
    focusApp,
    closeApp,
    toggleMinimizeApp,
    toggleMaximizeApp,
    updateAppPosition,
    updateAppSize,
    updateAppTitle,
    pinnedApps,
    pinApp,
    unpinApp,
    taskbarApps,
  };
};
