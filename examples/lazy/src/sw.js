import {subscriptionManager} from "../../../src/client/index";

const {clients, registration} = self;

const uid = 'guntars';
const rootURI = `/api/v1`

const {testSubscription, updateSubscription} = subscriptionManager(registration, {rootURI, uid});

const messageTypes = {testSubscription, updateSubscription};
const getMessageType = type => messageTypes[type] ? messageTypes[type]() : Promise.resolve();

self.addEventListener('install', (event) => {
    console.log('install');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('activate');
    event.waitUntil(clients.claim());
});


self.addEventListener('message', ({data, ports}) => {
    const {type} = data;
    const [port] = ports;
    getMessageType(type)
        .then(message => port.postMessage(message));
});

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
    const title = 'FCM Push messaging';

    event.waitUntil(registration
        .getNotifications()
        .then(notifications => notifications.map(existingNotification => {
            console.log(existingNotification.data);
            return existingNotification.close();
        }))
        .then(() => self.registration.showNotification(title, event.data.json())));
});