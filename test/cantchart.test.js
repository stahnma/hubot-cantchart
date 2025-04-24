/* global describe, context it, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
chai.use(require('sinon-chai'));
const nock = require('nock');

const helper = new Helper('./../src/cantchart.js');
const { expect } = chai;

describe('hubot-cantchart', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_GITHUB_TOKEN = 'abcdef';
    room = helper.createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_GITHUB_TOKEN;
  });

  context('get an excuse', () => {
    beforeEach((done) => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .replyWithFile(200, './test/fixtures/api_response.json');
      room.user.say('alice', 'hubot excuse');
      setTimeout(done, 100);
    });

    it('hubot responds with excuse', () => expect(room.messages).to.eql([
      ['alice', 'hubot excuse'],
      ['hubot', '"**Let\'s take this offline**\r\n\r\n> Critical decisions must be made, but rather than make them and have an effective meeting, somebody just suggests we take an item offline. Then no follow-up ever occurs and thus the only decision that was made was that we\'re not currently making a decision. " -- stahnma'],
    ]));
  });

  context('GitHub token is invalid (401)', () => {
    beforeEach((done) => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(401, {
          message: 'Bad credentials',
          documentation_url: 'https://docs.github.com/rest',
        });
      room.user.say('alice', 'hubot excuse');
      setTimeout(done, 100);
    });

    it('hubot informs user about authentication failure', () => {
      expect(room.messages).to.eql([
        ['alice', 'hubot excuse'],
        ['hubot', 'Authentication with GitHub failed. Please check the `HUBOT_GITHUB_TOKEN`.']
      ]);
    });
  });

  context('GitHub returns empty comment array', () => {
    beforeEach((done) => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(200, []);
      room.user.say('alice', 'hubot excuse');
      setTimeout(done, 100);
    });

    it('hubot informs user there are no excuses', () => {
      expect(room.messages).to.eql([
        ['alice', 'hubot excuse'],
        ['hubot', 'No excuses found today.']
      ]);
    });
  });

  context('GitHub returns malformed JSON', () => {
    beforeEach((done) => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(200, 'not-a-json');
      room.user.say('alice', 'hubot excuse');
      setTimeout(done, 100);
    });

    it('hubot informs user about parsing error', () => {
      expect(room.messages).to.eql([
        ['alice', 'hubot excuse'],
        ['hubot', 'Could not parse response from GitHub.']
      ]);
    });
  });
});

describe('hubot-cantchart missing config', () => {
  let room = null;

  beforeEach(() => {
    delete process.env.HUBOT_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    room = helper.createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  context('fails with error', () => {
    beforeEach((done) => {
      room.user.say('alice', 'hubot excuse');
      setTimeout(done, 100);
    });

    it('sends error to user', () => expect(room.messages).to.eql([
      ['alice', 'hubot excuse'],
      ['hubot', '`HUBOT_GITHUB_TOKEN` is not set.'],
    ]));
  });
});

