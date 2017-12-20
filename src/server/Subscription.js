import express from 'express';

const _router = Symbol('_router');
const _storage = Symbol('_storage');
const _request = Symbol('_request');
const _subscribe = Symbol('_subscribe');
const _unsubscribe = Symbol('_unsubscribe');
const _test = Symbol('_test');

class Subscription {
    constructor(storage) {
        this[_storage] = storage;
    }

    [_request](router,method, route, callback) {
        return router[method](route, (req, resp, next) => callback(req, resp, next));

    }

    [_subscribe](router) {
        return this[_request](router, 'post', '/subscription', (req, resp) => {
            const {uid, subscription} = req.body;
            return this.set(uid, subscription)
                .then(subscription => resp.send(subscription))
        });
    }

    [_unsubscribe](router) {
        this[_request](router, 'delete', '/subscription/:uid', (req, resp) => {
            const {uid} = req.params;
            return this.delete(uid).then(subscription => resp.send(subscription))
        });
    }

    [_test](router) {
        this[_request](router, 'get', '/subscription/:uid', (req, resp) => {
            const {uid} = req.params;
            return this.get(uid).then(({status, message}) => resp.send({status, message}))
        });
    }

    set(uid, subscription) {
        return this[_storage].set(uid, subscription)
    }

    get(uid) {
        return this[_storage].get(uid);
    }

    delete(uid) {
        return this[_storage].delete(uid)
    }

    run() {
        const router = express.Router();
        this[_unsubscribe](router);
        this[_subscribe](router);
        this[_test](router);
        return router;
    }


};

const subscription = (...args) => new Subscription(...args);

export {subscription, Subscription};