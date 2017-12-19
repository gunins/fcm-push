import express from 'express';

const _router = Symbol('_router');
const _storage = Symbol('_storage');
const _request = Symbol('_request');
const _subscribe = Symbol('_subscribe');
const _unsubscribe = Symbol('_unsubscribe');
const _test = Symbol('_test');

class Subscription {
    constructor(storage) {
        this[_router] = express.Router();
        this[_storage] = storage;
    }

    [_request](method, route, callback) {
        return this[_router][method](route, (req, resp, next) => callback(req, resp, next));

    }

    [_subscribe]() {
        return this[_request]('post', '/subscription', (req, resp) => {
            const {uid, subscription} = req.body;
            return this[_storage].set(uid, subscription)
                .then(subscription => resp.send(subscription))
        });
    }

    [_unsubscribe]() {
        this[_request]('delete', '/subscription/:uid', (req, resp) => {
            const {uid} = req.params;
            return this[_storage].delete(uid).then(subscription => resp.send(subscription))
        });
    }

    [_test]() {
        this[_request]('get', '/subscription/:uid', (req, resp) => {
            const {uid} = req.params;
            return this[_storage].get(uid).then(({status, message}) => resp.send({status, message}))
        });
    }

    run() {
        this[_unsubscribe]();
        this[_subscribe]();
        this[_test]();
        return this[_router];
    }


};

const subscription = (...args) => new Subscription(...args);

export {subscription, Subscription};