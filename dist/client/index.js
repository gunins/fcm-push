'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const {assign} = Object;
const request = (uri, method = 'get', body) => fetch(uri, {
    headers:     {
        'Accept':       'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    },
    credentials: 'include',
    body,
    method
}).then(resp => resp.json());

const applicationServerPublicKey = (rootURI) => request(`${rootURI}/key`).then(({key}) => key);

const pushSubscription = (uid, subscription, rootURI) => request(`${rootURI}/subscription`, 'post', JSON.stringify({
    subscription,
    uid
}));

const removeSubscription = (uid, rootURI) => request(`${rootURI}/subscription/${uid}`, 'delete');

const testSubscription = (uid, rootURI) => request(`${rootURI}/subscription/${uid}`, 'get').then(({status} = {}) => status === 'Success');

const urlB64ToUnit8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    return new Uint8Array(rawData.length).map((_, i) => rawData.charCodeAt(i));
};


const subscribeUser = (pushManager, {uid, rootURI}) => applicationServerPublicKey(rootURI)
    .then(key => pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlB64ToUnit8Array(key)
    }))
    .then(subscription => pushSubscription(uid, subscription.toJSON(), rootURI))
    .then(subscription => assign(subscription, {subscribed: true}));

const unsubscribeUser = (pushManager, {uid, rootURI}) => pushManager.getSubscription()
    .then(subscription => subscription ? subscription.unsubscribe() : false)
    .then(() => removeSubscription(uid, rootURI));

const checkSubscription = (pushManager, {uid, rootURI}) => Promise
    .all([testSubscription(uid, rootURI), pushManager.getSubscription()])
    .then(([remote, local]) => updateSubscription(pushManager, {uid, rootURI})(remote, local));


//Guards
const remoteLocalGuard = (remote, local) => remote && local;
const localOnlyGuard = (remote, local) => local && !remote;
const remoteOnlyGuard = (remote, local) => remote && !local;

const updateSubscription = (pushManager, {uid, rootURI}) => {
    //Subscription Update Actions
    const remoteLocal = async (remote, local) => remoteLocalGuard(remote, local) ? local.toJSON() : false;
    const localOnly = async (remote, local) => localOnlyGuard(remote, local) ? pushSubscription(uid, local.toJSON(), rootURI) : false;
    const remoteOnly = async (remote, local) => remoteOnlyGuard(remote, local) ? subscribeUser(pushManager, {
        uid,
        rootURI
    }) : false;

    return (remote, local) => remoteLocal(remote, local)
        .then(subscription => subscription || localOnly(remote, local))
        .then(subscription => subscription || remoteOnly(remote, local))
        .then(subscription => subscription ? assign(subscription, {subscribed: true}) : Promise.reject(subscription));
};


const subscriptionManager = ({pushManager}, options = {}) => {
    const params = assign({rootURI: `/api/v1`}, options);

    if (!params.uid) {
        throw ('uid not defined for subscriptionManager');
    }

    return {
        subscribeUser() {
            return subscribeUser(pushManager, params);
        },
        unsubscribeUser() {
            return unsubscribeUser(pushManager, params);

        },
        checkSubscription() {
            return checkSubscription(pushManager, params);
        },
        updateSubscription() {
            return checkSubscription(pushManager, params)
                .then(() => unsubscribeUser(pushManager, params))
                .catch(() => subscribeUser(pushManager, params));
        },
        testSubscription() {
            return checkSubscription(pushManager, params)
                .then(subscription => subscription)
                .catch(error => error);
        }
    };
};

exports.subscriptionManager = subscriptionManager;
