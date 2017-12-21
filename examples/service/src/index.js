import express from 'express';
import bodyParser from 'body-parser';
import {subscription} from '../../../src/server/Subscription';
import {storage} from '../../../src/server/Storage';
import {message, messenger} from './push';

const expressApp = express();
expressApp.use(bodyParser.json());
expressApp.use(express.static('./examples/service'));

const subscriptions = storage();
expressApp.use('/api/v1', subscription(subscriptions).run());

expressApp.get('/api/v1/key', async (req, resp) => {
    const {key} = messenger;
    resp.send({
        status: 'Success',
        key
    })
});

expressApp.get('/push/:uid', async (req, resp) => {
    const {uid} = req.params;
    const {data} = await subscriptions.get(uid);
    return data ? messenger.sendNotification(data, message(data))
        .then((data) => resp.send(data))
        .catch(error => resp.send(error)) : resp.send({
        status:  'Error',
        message: 'No data found'
    });
});

expressApp.listen(5050, () => console.log('Example app listening on port 5050!'));