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

class Storage {
    constructor() {
        this[_map] = new Map();
    }

    set(key, value) {
        return option(key)
            .then(() => this[_map].set(key, value))
            .then(() => success('Subscription updated successfully', value))
            .catch(() => error('key is undefined'));
    }

    async get(key) {
        const data = this[_map].get(key);
        return option(data)
            .then(() => success('data loaded',data))
            .catch(() => error('Data not exist'));
    }

    async has(key) {
        return this[_map].has(key);
    }

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