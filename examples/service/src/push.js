import {webPush} from '../../../src/server/Push';

const subscribtions = new Set();

const message = (subscription) => {
    const body = !subscribtions.has(subscription.enpoint) ? 'Some Node Message new' : 'Repeated Message';
    subscribtions.add(subscription.enpoint);
    return JSON.stringify({
        icon:  'images/icon.png',
        badge: 'images/badge.png',
        body
    })
};
const vapidKeys = {
    publicKey:  'BA4CG-LYo-ncw3Wwl40SNrh0NnRCKV11cXN1u2A_pDaojpqBxLlppvpGHuDrKgAonUa0HMfhns3_FyEwRcoKBPw',
    privateKey: 'zDHYDoJUqxTCUPJHeUFPBg-fdemwvrJfpG5y3MYCK84'
};
const messenger = webPush('http://example.com',vapidKeys);

export {messenger, message}
