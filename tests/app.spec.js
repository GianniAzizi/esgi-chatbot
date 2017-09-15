const chai = require('chai');
const botbuilder = require('botbuilder');
const expect = chai.expect;

const connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

describe('Bot', function(){
    it('can create an instance of UniversalBot', function(){
        let bot = new botbuilder.UniversalBot(connector);
        expect(bot).to.not.equal(null);
        expect(JSON.stringify(bot).length).to.not.equal(null);
    });
});