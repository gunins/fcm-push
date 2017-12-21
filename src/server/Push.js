import webpush from 'web-push';

const _publicKey = Symbol('_publicKey');
/**
 * Creates Web Push Class.
 * @param {String} host  - http:// host or mailto:.
 * @optional {obj} keys  private and Public keys, if not set, 'web-push' library will generate
 * @return {WebPush} class.
 */
class WebPush {
    constructor(host, keys = webpush.generateVAPIDKeys()) {
        this.generateKeys(host, keys);
    }
    /**
     * Set new Keys for class.
     * @param {String} host  - http:// host or mailto:.
     * @optional {obj} keys  private and Public keys, if not set, 'web-push' library will generate
     */
    generateKeys(host, {publicKey, privateKey} = webpush.generateVAPIDKeys()) {
        webpush.setVapidDetails(host, publicKey, privateKey);
        this[_publicKey] = publicKey;
    }
    /**
     * Set new Keys for class.
     * @return {String} public Notification key.
     */
    get key() {
        return this[_publicKey];
    }
    /**
     * Sending notification to fcm server
     * @param subscription
     *      {
     *          "endpoint":"https://fcm.googleapis.com/fcm/send/...",
     *          "expirationTime":null,
     *          "keys":{
     *              "p256dh":"...",
     *              "auth":"..."
     *              }
     *        }
     *
     * Subscription data you getting from Service Worker `pushManager.subscribe`
     * @return {obj} Notification status.
     */
    sendNotification(subscription, message) {
        return webpush.sendNotification(subscription, message);
    }

}

const webPush = (...args) => new WebPush(...args);

export {WebPush, webPush}