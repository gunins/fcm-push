import {subscriptionManager} from "../../../src/client/main";


const pushButton = document.querySelector('.js-push-btn');

const uid = 'guntars';


function updateBtn(isSubscribed) {
    if (Notification.permission === 'denied') {
        pushButton.textContent = 'Push Messaging Blocked.';
        return;
    }

    if (isSubscribed) {
        pushButton.textContent = 'Disable Push Messaging';
    } else {
        pushButton.textContent = 'Enable Push Messaging';
    }

}

function updateSubscriptionText(subscription) {
    const subscriptionJson = document.querySelector('.js-subscription-json');
    const subscriptionDetails = document.querySelector('.js-subscription-details');
    if (subscription) {
        subscriptionJson.textContent = JSON.stringify(subscription);
        subscriptionDetails.classList.remove('is-invisible');
    } else {
        subscriptionDetails.classList.add('is-invisible');
    }
    updateBtn(subscription && subscription.subscribed);
}


function initialiseUI({unsubscribeUser, subscribeUser, checkSubscription}) {
    checkSubscription()
        .then(subscription => {
            console.log(subscription);
            updateSubscriptionText(subscription);
        })
        .catch(() => {
            console.log('User is NOT subscribed.')
            updateSubscriptionText(false);
        });

    pushButton.addEventListener('click', () =>
        checkSubscription()
            .then(() => unsubscribeUser())
            .catch(() => subscribeUser())
            .then(subscription => updateSubscriptionText(subscription)));

}

if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('sw.js')
        .then(function(swReg) {
            console.log('Service Worker is registered', swReg);
            initialiseUI(subscriptionManager(swReg, uid));
        })
        .catch(function(error) {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
    pushButton.textContent = 'Push Not Supported';
}
