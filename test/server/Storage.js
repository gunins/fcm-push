const {expect} = require('chai');
// import chaiHttp from 'chai-http';
// use(chaiHttp);
const {storage} = require('../../dist/server/Storage');


describe('Testing in memory storage', () => {
    it('testing set,get,has, delete', async () => {
        let map = storage();
        let data = await map.set('vasja', {subscription: 123});
        expect(data.status).to.be.eql('Success');

        let dataA = await map.set(null, {subscription: 123});
        expect(dataA.status).to.be.eql('Error');

        expect(await map.get('vasja')).to.be.eql({
            status:  'Success',
            message: 'data loaded',
            data:    {subscription: 123}
        });

        expect(await map.get('petja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined

        });
        expect(await map.has('petja')).to.be.false;
        expect(await map.has('vasja')).to.be.true;

        expect(await map.get('petja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined

        });

        expect(await map.delete('vasja')).to.be.eql({
            status:  'Success',
            message: 'Subscription removed successfully',
            data:    undefined

        });
        expect(await map.has('vasja')).to.be.false;

        expect(await map.get('vasja')).to.be.eql({
            status:  'Error',
            message: 'Data not exist',
            data:    undefined
        });

    });
});
