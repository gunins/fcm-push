import {subscriptionManager} from "../../../src/client/main";

const uid = 'guntars';
const {unsubscribeUser, subscribeUser, checkSubscription} = subscriptionManager(self.registration, uid);
const {clients} = self;


self.addEventListener('install', (event) => {
    console.log('install');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('activate');
    event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    const {data, ports} = event;
    const {type} = data;
    const [port1] = ports;
    if (type === 'updateSubscription') {
        checkSubscription()
            .then(() => unsubscribeUser())
            .catch(() => subscribeUser())
            .then((subscription) => port1.postMessage(subscription));

    } else if (type === 'checkSubscription') {
        checkSubscription()
            .then(subscription => subscription)
            .catch(error => error)
            .then((message) => port1.postMessage(message));

    }

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