const path = require('node:path');
const assert = require('node:assert/strict');
const nock = require('nock');
const { Robot, Adapter, TextMessage, User } = require('hubot');

process.env.HUBOT_LOG_LEVEL = process.env.HUBOT_LOG_LEVEL || 'silent';

// Records everything the robot sends so tests can assert on it.
class TestAdapter extends Adapter {
  constructor(robot) {
    super(robot);
    this.messages = [];
  }

  async send(envelope, ...strings) {
    strings.forEach((str) => this.messages.push(['hubot', str]));
  }

  async reply(envelope, ...strings) {
    strings.forEach((str) => this.messages.push(['hubot', `@${envelope.user.name} ${str}`]));
  }

  async run() {
    this.emit('connected');
  }
}

const createRoom = async () => {
  const robot = new Robot({ use: (r) => new TestAdapter(r) }, false, 'hubot');
  await robot.loadAdapter();
  await robot.loadFile(path.resolve(__dirname, '..', 'src'), 'cantchart.js');
  await robot.run();

  const user = new User('1', { name: 'alice', room: 'room1' });
  return {
    robot,
    get messages() {
      return robot.adapter.messages;
    },
    async say(text) {
      robot.adapter.messages.push([user.name, text]);
      await robot.receive(new TextMessage(user, text, 'message-id'));
    },
    destroy() {
      robot.shutdown();
    },
  };
};

// The script replies from an HTTP callback, so give it a moment to finish.
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('hubot-cantchart', () => {
  let room = null;

  beforeEach(async () => {
    process.env.HUBOT_GITHUB_TOKEN = 'abcdef';
    room = await createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_GITHUB_TOKEN;
  });

  context('get an excuse', () => {
    beforeEach(async () => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .replyWithFile(200, path.resolve(__dirname, 'fixtures', 'api_response.json'));
      await room.say('hubot excuse');
      await settle();
    });

    it('hubot responds with excuse', () => assert.deepEqual(room.messages, [
      ['alice', 'hubot excuse'],
      ['hubot', '"**Let\'s take this offline**\r\n\r\n> Critical decisions must be made, but rather than make them and have an effective meeting, somebody just suggests we take an item offline. Then no follow-up ever occurs and thus the only decision that was made was that we\'re not currently making a decision. " -- stahnma'],
    ]));
  });

  context('GitHub token is invalid (401)', () => {
    beforeEach(async () => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(401, {
          message: 'Bad credentials',
          documentation_url: 'https://docs.github.com/rest',
        });
      await room.say('hubot excuse');
      await settle();
    });

    it('hubot informs user about authentication failure', () => {
      assert.deepEqual(room.messages, [
        ['alice', 'hubot excuse'],
        ['hubot', 'Authentication with GitHub failed. Please check the `HUBOT_GITHUB_TOKEN`.']
      ]);
    });
  });

  context('GitHub returns empty comment array', () => {
    beforeEach(async () => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(200, []);
      await room.say('hubot excuse');
      await settle();
    });

    it('hubot informs user there are no excuses', () => {
      assert.deepEqual(room.messages, [
        ['alice', 'hubot excuse'],
        ['hubot', 'No excuses found today.']
      ]);
    });
  });

  context('GitHub returns malformed JSON', () => {
    beforeEach(async () => {
      nock('https://api.github.com')
        .matchHeader('authorization', 'Bearer abcdef')
        .get('/repos/websages/hates-software/issues/1/comments')
        .reply(200, 'not-a-json');
      await room.say('hubot excuse');
      await settle();
    });

    it('hubot informs user about parsing error', () => {
      assert.deepEqual(room.messages, [
        ['alice', 'hubot excuse'],
        ['hubot', 'Could not parse response from GitHub.']
      ]);
    });
  });
});

describe('hubot-cantchart missing config', () => {
  let room = null;

  beforeEach(async () => {
    delete process.env.HUBOT_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    room = await createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  context('fails with error', () => {
    beforeEach(async () => {
      await room.say('hubot excuse');
      await settle();
    });

    it('sends error to user', () => assert.deepEqual(room.messages, [
      ['alice', 'hubot excuse'],
      ['hubot', '`HUBOT_GITHUB_TOKEN` is not set.'],
    ]));
  });
});
