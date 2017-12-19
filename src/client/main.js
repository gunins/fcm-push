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

const applicationServerPublicKey = () => request('/key').then(({key}) => key);

const pushSubscription = (uid, subscription) => request('/api/v1/subscription', 'post', JSON.stringify({
    subscription,
    uid
}));

const removeSubscription = (uid) => request(`/api/v1/subscription/${uid}`, 'delete');

const testSubscription = (uid) => request(`/api/v1/subscription/${uid}`, 'get').then(({status} = {}) => status === 'Success');

const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return new Uint8Array(rawData.length).map((_, i) => rawData.charCodeAt(i));
};

const subscriptionManager = (sw, uid) => {
    const manager = ({

        subscribeUser: () => applicationServerPublicKey()
            .then(key => sw.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: urlB64ToUint8Array(key)
            }))
            .then(subscription => pushSubscription(uid, subscription.toJSON()))
            .then(subscription => assign(subscription, {subscribed: true})),

        unsubscribeUser: () => sw.pushManager.getSubscription()
            .then(subscription => subscription ? subscription.unsubscribe() : false)
            .then(() => removeSubscription(uid)),

        checkSubscription: () => Promise.all([testSubscription(uid), sw.pushManager.getSubscription()])
            .then(([remote, local]) => (remote && local) ? assign(local.toJSON(), {subscribed: true}) : manager.unsubscribeUser().then(() => Promise.reject(null)))

    });
    return manager;
};

export {subscriptionManager}
