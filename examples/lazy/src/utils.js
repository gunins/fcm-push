const waitUntilInstalled = (registration) => new Promise((resolve, reject) => {
    const {installing} = registration;
    if (installing) {
        installing.addEventListener('statechange', ({target}) => {
            const {state} = target;
            if (state === 'activated') {
                resolve(registration);
            } else if (state === 'redundant') {
                reject(registration);
            }
        });
    } else {
        resolve(registration);
    }
});

const sendMessage = (client, message) => new Promise((resolve, reject) => {
    const {port1, port2} = new MessageChannel();
    port1.onmessage = event => {
        if (event.data.error) {
            reject(event.data.error);
        } else {
            resolve(event.data);
        }
    };
    client.postMessage(message, [port2]);
});

export {sendMessage, waitUntilInstalled};