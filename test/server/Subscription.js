const express = require('express');
const bodyParser = require('body-parser');
const chai = require('chai');
const chaiHttp = require('chai-http');

const {storage} = require('../../dist/server/Storage');
const {subscription} = require('../../dist/server/Subscription');
const {expect, request} = chai.use(chaiHttp);

const server = express();
server.use(bodyParser.json());
const subscriptions = storage();
let service = subscription(subscriptions);
server.use('/api/v1', service.run());


describe('testing Rest Subscription API', () => {
    it('testing REST API', async () => {

        let subscribe = await request(server)
            .post('/api/v1/subscription')
            .send({
                uid:          'guntars',
                subscription: {
                    endpoint: 'foo'
                }
            });

        expect(subscribe).to.be.status(200);
        expect(subscribe.body.status).to.be.eql('Success');
        expect(subscribe.body.data.endpoint).to.be.eql('foo');

        let testSubscription = await request(server)
            .get('/api/v1/subscription/guntars');

        expect(testSubscription).to.be.status(200);
        expect(testSubscription.body.status).to.be.eql('Success');
        expect(testSubscription.body.message).to.be.eql('data loaded');

        let removeSubscription = await request(server)
            .delete('/api/v1/subscription/guntars');

        expect(removeSubscription).to.be.status(200);
        expect(removeSubscription.body.status).to.be.eql('Success');
        expect(removeSubscription.body.message).to.be.eql('Subscription removed successfully');

        let removeSubscriptionA = await request(server)
            .delete('/api/v1/subscription/guntars');

        expect(removeSubscriptionA).to.be.status(200);
        expect(removeSubscriptionA.body.status).to.be.eql('Error');
        expect(removeSubscriptionA.body.message).to.be.eql('Key not exist');

        let testSubscriptionA = await request(server)
            .get('/api/v1/subscription/guntars');

        expect(testSubscriptionA).to.be.status(200);
        expect(testSubscriptionA.body.status).to.be.eql('Error');
        expect(testSubscriptionA.body.message).to.be.eql('Data not exist');


    });
    it('testing set and get methods', async () => {
        let data = await service.set('vasja', {subscription: 123});
        expect(data.status).to.be.eql('Success');

        let dataA = await service.set(null, {subscription: 123});
        expect(dataA.status).to.be.eql('Error');

        expect(await service.get('vasja')).to.be.eql({
            status:  'Success',
            message: 'data loaded',
            data:    {subscription: 123}
        });

        expect(await service.get('petja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined

        });


        expect(await service.get('petja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined

        });

        expect(await service.delete('vasja')).to.be.eql({
            status:  'Success',
            message: 'Subscription removed successfully',
            data:    undefined

        });

        expect(await service.get('vasja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined
        });

    });
});