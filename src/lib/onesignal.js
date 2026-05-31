let oneSignalReadyPromise = null;

function waitForOneSignal(maxAttempts = 100, interval = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts += 1;

      if (window.OneSignal) {
        resolve(window.OneSignal);
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error("OneSignal SDK non chargé"));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

export function buildClientExternalId(businessId, clientId) {
  if (!businessId || !clientId) return "";
  return `${String(businessId).trim()}_${String(clientId).trim()}`;
}

export function initOneSignal() {
  if (oneSignalReadyPromise) {
    return oneSignalReadyPromise;
  }

  oneSignalReadyPromise = (async () => {
    const OneSignal = await waitForOneSignal();

    await OneSignal.init({
      appId: "d0726fcd-210f-4a82-8674-757e56f95f60",
      notifyButton: {
        enable: false,
      },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
    });

    return OneSignal;
  })();

  return oneSignalReadyPromise;
}

export async function getOneSignalStatus() {
  const OneSignal = await initOneSignal();

  return {
    permission: await OneSignal.Notifications.permission,
    optedIn: await OneSignal.User.PushSubscription.optedIn,
    subscriptionId: await OneSignal.User.PushSubscription.id,
    token: await OneSignal.User.PushSubscription.token,
  };
}

export async function setOneSignalExternalId(businessId, clientId) {
  const OneSignal = await initOneSignal();

  const externalId = buildClientExternalId(businessId, clientId);

  if (!externalId) {
    return {
      ok: false,
      externalId: "",
    };
  }

  await OneSignal.login(externalId);

  return {
    ok: true,
    externalId,
  };
}

export async function enableOneSignalNotifications({ businessId, clientId } = {}) {
  const OneSignal = await initOneSignal();

  await OneSignal.Notifications.requestPermission();

  let externalId = "";

  if (businessId && clientId) {
    const result = await setOneSignalExternalId(businessId, clientId);
    externalId = result.externalId;
  }

  return {
    permission: await OneSignal.Notifications.permission,
    optedIn: await OneSignal.User.PushSubscription.optedIn,
    subscriptionId: await OneSignal.User.PushSubscription.id,
    token: await OneSignal.User.PushSubscription.token,
    externalId,
  };
}