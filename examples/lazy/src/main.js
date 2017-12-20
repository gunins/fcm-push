import {sendMessage, waitUntilInstalled} from "../../../src/client/utils";

const pushButton = document.querySelector('.js-push-btn');

async function updateBtn(isSubscribed) {
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

async function updateSubscriptionText(subscription) {
    const subscriptionJson = document.querySelector('.js-subscription-json');
    const subscriptionDetails = document.querySelector('.js-subscription-details');
    if (subscription) {
        subscriptionJson.textContent = JSON.stringify(subscription);
        subscriptionDetails.classList.remove('is-invisible');
    } else {
        subscriptionDetails.classList.add('is-invisible');
    }
    return subscription;
}


async function initialiseUI(controller) {
    pushButton.addEventListener('click', () => updateSubscription(controller));
    return controller;
}

const updateUI = (subscription) => updateSubscriptionText(subscription)
    .then((subscription) => updateBtn(subscription && subscription.subscribed));

const checkSubscription = (controller) => sendMessage(controller, {type: 'testSubscription'})
    .then(subscription => updateUI(subscription));

const updateSubscription = (controller) => sendMessage(controller, {type: 'updateSubscription'})
    .then(subscription => updateUI(subscription));


if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');
    const {serviceWorker} = navigator;
    serviceWorker.register('sw.js', {scope: './'})
        .then(registration => waitUntilInstalled(registration))
        .then(() => serviceWorker.controller)
        .then(controller => initialiseUI(controller))
        .then(controller => checkSubscription(controller))
        .catch((error) => {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
    pushButton.textContent = 'Push Not Supported';
}
