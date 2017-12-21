## FCM Cloud messages

### Introduction

This library is created for using `web push` for firebase cloud messages, without firebase.

Found difficulty to use fcm messages in firebase, from one point of view there is firebase with full API, 
but disadvantage, you have to load full firebase API libraries, for very small use case. Developers, usually 
like to control, what they are doing. Ant not load unnecessary dependencies. I kept this library as small as possible. 
Only for Server side push I use `web-push` library, on client use native API. Uncompressed client has 5kb. I not added 
compressed version, because developers usually use `Webpack` or `rollup` to optimise your code.

### Installation

Run `npm install fcm-messages`

### Server Setup

For Server need `express` installed. Then need for `Server.js` following setup. Full Example in `/examples/service`

```javascript
    
    import express from 'express';
    import bodyParser from 'body-parser';
    import {subscription, storage, webPush} from 'fcm-messages';
 
    const vapidKeys = {
        publicKey:  '...',
        privateKey: '...'
    };
    const messenger = webPush('http://example.com', vapidKeys);
            
    
    const expressApp = express();
    expressApp.use(bodyParser.json());
    
    //Set your static Directory
    expressApp.use(express.static('./'));
    
    // I provide in memory storage, but there can be any with Promise base set, get, delete interface.
    const subscriptions = storage();
    
    // Adding subscription API in to REST
    expressApp.use('/api/v1', subscription(subscriptions).run());
    
    //Expose public key access via REST.
    expressApp.get('/api/v1/key', async (req, resp) => {
        const {key} = messenger;
        resp.send({
            status: 'Success',
            key
        })
    });
    //Message content
    const message = (message) => {
        return JSON.stringify({
            icon:  'images/icon.png',
            badge: 'images/badge.png',
            body: message
        })
    };
    
    // Optional in this example, can send push notifications, via REST interface, usually want to set some cron job or similar.
    expressApp.get('/push/:uid/:content', async (req, resp) => {
        const {uid, content} = req.params;
        const {data} = await subscriptions.get(uid);
        return data ? messenger.sendNotification(data, message(content))
            .then((data) => resp.send(data))
            .catch(error => resp.send(error)) : resp.send({
            status:  'Error',
            message: 'No data found'
        });
    });
    
    expressApp.listen(5050, () => console.log('Example app listening on port 5050!'));

```

### Client setup

For client need setup Service worker ready for Push messaging, and on client side make it ready for push notifications.

In `Service Worker`

```javascript
    // Install and activate, probably you will do your own staff as well.
    self.addEventListener('install', (event) => {
        self.skipWaiting();
    });
    self.addEventListener('activate', (event) => {
        self.skipWaiting();
    });
    
    self.addEventListener('push', (event) => {
        const title = 'FCM PUSH';
    
        event.waitUntil(self.registration
            .getNotifications()
            .then(notifications => {
                //Close existing notifications, also, you can collet dta from existing, and update.
                notifications.map(existingNotification => existingNotification.close());
                
                // Send Notification.
                return self.registration.showNotification(title, event.data.json());
            }));
    });

```

In Client javascript, need to make subscription.

```javascript
        //need configuration in rollup or webpack
        import {subscriptionManager} from "fcm-messages/client/index";

        //...
        const initialiseUI = ({checkSubscription, updateSubscription})=> {
            //First Check if there is subscription already.
            checkSubscription()
                .then(subscription => {
                    console.log(subscription);
                    updateSubscriptionText(subscription);
                })
                .catch(() => {
                    console.log('User is NOT subscribed.')
                    updateSubscriptionText(false);
                });
            // by toggling button, you can subscribe unsubscribe event.
            pushButton.addEventListener('click', () =>
                updateSubscription()
                .then(subscription => updateSubscriptionText(subscription)));
        
        }
        
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            console.log('Service Worker and Push is supported');
            //Registering Service Worker and initialise subscriptionManager.
            navigator.serviceWorker.register('sw.js')
                .then(function(swReg) {
                    console.log('Service Worker is registered', swReg);
                    initialiseUI(subscriptionManager(swReg, {uid}));
                })
                .catch(function(error) {
                    console.error('Service Worker Error', error);
                });
        } else {
            console.warn('Push messaging is not supported');
            pushButton.textContent = 'Push Not Supported';
        }

```

### API

#### Client API

```javascript
/**
 * Creates set of methods to manage push notifications.
 * @param {pushManager} pushManager - Service Worker PushManager.
 * @param {rootURI,uid} options - Params for rootURI and uid (uid is mandatory param)
 * @return {*} list of methods.
 */
const subscriptionManager = ({pushManager}, options = {}) => ({
        /**
        * @method Checking, if user have subscription for notifications
        * @return {Promise}

         * */
        checkSubscription() {
            ...
        },
        /**
         * @method Subscribe user for notifications
         * @return {Promise}
         * */
        subscribeUser() {
            ...
        },
        /**
         * @method remove user subscription for notifications
         * @return {Promise}
         * */
        unsubscribeUser() {
            ...
        },
        /**
         * @method toggle user subscription for notifications
         * @return {Promise}
         * */
        updateSubscription() {
            ...
        },
        /**
         * @method Same like checkSubscripton, but always returning successful Promise
         * @return {Promise}
         * */
        testSubscription() {
            ...
        }
    });

```

#### Server API

```javascript
    /**
     * Creates subscriptionREST API using Express.
     * @param {Storage} Storage - any Promise key value storage, with get, set, delete interface.
     *                              In this library included in memory storage.
     * @return {Subscription} class.
     */
    class Subscription {
    
        /**
         * @method Set subscription in storage
         * @return {Promise}
         * */
        set(uid, subscription) {
            ...
        }
    
        /**
         * @method Test if subscription exists in storage
         * @return {Promise}
         * */
        get(uid) {
            ...
        }
        /**
         * @method remove subscription exists from storage
         * @return {Promise}
         * */
        delete(uid) {
            ...
        }
        /**
         * @method Start REST service
         * @return {Express Router}
         * */
        run() {
            ...
        }
    
    
    };

```

#### Storage API | Interface

```javascript

    /**
     * Creates in Memory Storage, with interface.
     * @return {Storage} Class.
     */
    class Storage {
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
            ...
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
            ...
        }
        /**
         * @optional
         * @method Remove data from storage
         * @return {Promise}
         *
         * Promise.then return Boolean
         * */
        async has(key) {
            ...
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
            ...
        }
    
    };

```

#### Push Notifications

```javascript

/**
 * Creates Web Push Class.
 * @param {String} host  - http:// host or mailto:.
 * @optional {obj} keys  private and Public keys, if not set, 'web-push' library will generate
 * @return {WebPush} class.
 */
class WebPush {
    /**
     * Set new Keys for class.
     * @param {String} host  - http:// host or mailto:.
     * @optional {Object} keys  publicKey and privateKey, if not set, 'web-push' library will generate
     */
    generateKeys(host, {publicKey, privateKey})) {
        ...
    }
    /**
     * Set new Keys for class.
     * @return {String} public Notification key.
     */
    get key() {
        ...
    }
    /**
     * Sending notification to fcm server
     * @param subscription
     *      {
     *          "endpoint":"https://fcm.googleapis.com/fcm/send/...",
     *          "expirationTime":...,
     *          "keys":{
     *              "p256dh":"...",
     *              "auth":"..."
     *              }
     *        }
     *
     * Subscription data you getting from Service Worker `pushManager.subscribe`
     * @param {String} message - String or Buffer, to send notification.
     * @return {Promise} Notification status.
     */
    sendNotification(subscription, message) {
        ...
    }
}

```

