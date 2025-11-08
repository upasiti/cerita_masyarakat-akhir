const pushButton = document.getElementById('push-toggle');
let isSubscribed = false;

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUser() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('✅ Push Subscription berhasil dibuat:', subscription);
    alert('Notifikasi berhasil diaktifkan!');
    isSubscribed = true;
    updateButton();
  } catch (error) {
    console.error('🚫 Gagal membuat Push Subscription:', error);
  }
}

async function unsubscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    console.log('🚫 Berhenti langganan notifikasi');
    alert('Notifikasi dimatikan.');
  }
  isSubscribed = false;
  updateButton();
}

function updateButton() {
  if (isSubscribed) {
    pushButton.textContent = '🚫 Nonaktifkan Notifikasi';
    pushButton.classList.add('active');
  } else {
    pushButton.textContent = '🔔 Aktifkan Notifikasi';
    pushButton.classList.remove('active');
  }
}

pushButton.addEventListener('click', async () => {
  if (Notification.permission === 'denied') {
    alert('Izin notifikasi ditolak, aktifkan dari pengaturan browser.');
    return;
  }

  if (isSubscribed) {
    await unsubscribeUser();
  } else {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeUser();
    }
  }
});

navigator.serviceWorker.ready.then(async (registration) => {
  const subscription = await registration.pushManager.getSubscription();
  isSubscribed = !!subscription;
  updateButton();
});
