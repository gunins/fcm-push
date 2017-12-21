
const {expect} = require('chai');
// import chaiHttp from 'chai-http';
// use(chaiHttp);

const {webPush} = require('../../dist/server/Push');

describe('testing web push API',()=>{
   it('constructor will generate keys',()=>{
       let push = webPush('http://example.com');
       expect(push.key).not.to.be.undefined;

   });
});