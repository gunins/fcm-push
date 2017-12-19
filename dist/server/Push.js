'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var webpush = _interopDefault(require('web-push'));

const _publicKey = Symbol('_publicKey');

class WebPush {
    constructor(host, keys = webpush.generateVAPIDKeys()) {
        this.generateKeys(host, keys);
    }

    generateKeys(host, {publicKey, privateKey} = webpush.generateVAPIDKeys()) {
        webpush.setVapidDetails(host, publicKey, privateKey);
        this[_publicKey] = publicKey;
    }

    get key() {
        return this[_publicKey];
    }

    sendNotification(subscription, message) {
        return webpush.sendNotification(subscription, message);
    }

}

const webPush = (...args) => new WebPush(...args);

exports.WebPush = WebPush;
exports.webPush = webPush;
