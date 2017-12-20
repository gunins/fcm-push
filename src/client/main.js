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

//Guards
const remoteLocalGuard = (remote, local) => remote && local;
const localOnlyGuard = (remote, local) => local && !remote;
const remoteOnlyGuard = (remote, local) => remote && !local;

const updateSubscription = (sw, {uid, rootURI}) => {
    //Subscription Update Actions
    const remoteLocal = async (remote, local) => remoteLocalGuard(remote, local) ? local.toJSON() : false;
    const localOnly = async (remote, local) => localOnlyGuard(remote, local) ? pushSubscription(uid, local.toJSON(), rootURI) : false;
    const remoteOnly = async (remote, local, sw, uid) => remoteOnlyGuard(remote, local) ? subscribeUser(sw, {
        uid,
        rootURI
    }) : false;

    return (remote, local) => remoteLocal(remote, local)
        .then(subscription => subscription || localOnly(remote, local))
        .then(subscription => subscription || remoteOnly(remote, local))
        .then(subscription => subscription ? assign(subscription, {subscribed: true}) : Promise.reject(subscription));
};

const subscribeUser = (sw, {uid, rootURI}) => applicationServerPublicKey(rootURI)
    .then(key => sw.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlB64ToUnit8Array(key)
    }))
    .then(subscription => pushSubscription(uid, subscription.toJSON(), rootURI))
    .then(subscription => assign(subscription, {subscribed: true}));

const unsubscribeUser = (sw, {uid, rootURI}) => sw.pushManager.getSubscription()
    .then(subscription => subscription ? subscription.unsubscribe() : false)
    .then(() => removeSubscription(uid, rootURI));

const checkSubscription = (sw, {uid, rootURI}) => Promise.all([testSubscription(uid, rootURI), sw.pushManager.getSubscription()])
    .then(([remote, local]) => updateSubscription(sw, {uid, rootURI})(remote, local));


const subscriptionManager = (sw, uid, options = {rootURI: `/api/v1`}) => {
    const {rootURI} = options;
    return {
        subscribeUser() {
            return subscribeUser(sw, {uid, rootURI});
        }, unsubscribeUser() {
            return unsubscribeUser(sw, {uid, rootURI});

        }, checkSubscription() {
            return checkSubscription(sw, {uid, rootURI});
        }
    };
};

export {subscriptionManager}
