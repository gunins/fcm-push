const _map = Symbol('_map');

const success = (message, data) => ({
    status: 'Success',
    message,
    data
});

const error = (message, data) =>  ({
    status: 'Error',
    message,
    data
});

const option = (key) => key ? Promise.resolve() : Promise.reject();
/**
 * Creates in Memory Storage, with interface.
 * @return {Storage} Class.
 */
class Storage {
    constructor() {
        this[_map] = new Map();
    }
    /**
     * @method Set data in storage
     * @return {Promise}
     *
     * Promise.then should look
     *          {
     *              status:"Error"|"Success",
     *              message:{String},
     *              data:{Object}
     *          }
     * */
    set(key, value) {
        return option(key)
            .then(() => this[_map].set(key, value))
            .then(() => success('Subscription updated successfully', value))
            .catch(() => error('key is undefined'));
    }
    /**
     * @method Get data from storage
     * @return {Promise}
     *
     * Promise.then should look
     *          {
     *              status:"Error"|"Success",
     *              message:{String},
     *              data:{Object}
     *          }
     * */
    async get(key) {
        const data = this[_map].get(key);
        return option(data)
            .then(() => success('data loaded',data))
            .catch(() => error('Data not exist'));
    }
    /**
     * @optional
     * @method Remove data from storage
     * @return {Promise}
     *
     * Promise.then return Boolean
     * */
    async has(key) {
        return this[_map].has(key);
    }
    /**
     * @method Remove data from storage
     * @return {Promise}
     *
     * Promise.then should look
     *          {
     *              status:"Error"|"Success",
     *              message:{String},
     *          }
     * */
    delete(key) {
        return this.has(key)
            .then(has => option(has))
            .then(() => this[_map].delete(key))
            .then(() => success('Subscription removed successfully'))
            .catch(() => error('Key not exist'));
    }

}

const storage = (...args) => new Storage(...args);

export {storage, Storage}