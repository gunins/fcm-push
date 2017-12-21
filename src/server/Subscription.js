import express from 'express';

/**
 * @param List of private constants.
* */
const _router = Symbol('_router');
const _storage = Symbol('_storage');
const _request = Symbol('_request');
const _subscribe = Symbol('_subscribe');
const _unsubscribe = Symbol('_unsubscribe');
const _test = Symbol('_test');

/**
 * Creates subscriptionREST API using Express.
 * @param {Storage} Storage - any Promise key value storage, with get, set, delete interface.
 *                              In this library included in memory storage.
 * @return {Subscription} class.
 */
class Subscription {
    constructor(storage) {
        this[_storage] = storage;
    }

    [_request](router, method, route, callback) {
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
            return this.get(uid).then(_ => resp.send(_));
        });
    }

    /**
     * @method Set subscription in storage
     * @return {Promise}
     * */
    set(uid, subscription) {
        return this[_storage].set(uid, subscription)
    }

    /**
     * @method Test if subscription exists in storage
     * @return {Promise}
     * */
    get(uid) {
        return this[_storage].get(uid).then((({status, message}) => ({status, message})));
    }
    /**
     * @method remove subscription exists from storage
     * @return {Promise}
     * */
    delete(uid) {
        return this[_storage].delete(uid)
    }
    /**
     * @method Start REST service
     * @return {Express Router}
     * */
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