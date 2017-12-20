self.addEventListener('install', (event) => {
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    self.skipWaiting();
});

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    console.log(event.data.json(), 'data');
    const title = 'Push Codelab';
    const options = {
        body:  event.data.text(),
        icon:  'images/icon.png',
        badge: 'images/badge.png'
    };

    event.waitUntil(self.registration
        .getNotifications()
        .then(notifications => {
            notifications.map(existingNotification => {
                console.log(existingNotification.data);
                return existingNotification.close();
            });
            return self.registration.showNotification(title, event.data.json());
        }));
});