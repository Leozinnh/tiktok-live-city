import { sanitizeUsername, sanitizeComment, mapGiftToAction, mapCommentToCommand } from './sanitizer.js';

const MOCK_USERS = [
  'pedro_stream',
  'ana_gamer',
  'rodrigo99',
  'julia_live',
  'carlos_sp',
  'mariana_top',
  'bruno_dev',
  'lucas_stream'
];

const MOCK_COMMENTS = [
  'manda policia ai',
  'que cidade linda!',
  'faz chover ai',
  'kd a ambulancia?',
  'inicia uma corrida!',
  'manda zumbi',
  'salve pra geral',
  'live sensacional',
  'quero festa na praca',
  'meteoro neles kkk'
];

const MOCK_GIFTS = ['Rose', 'Rose', 'Rose', 'Cap', 'Doughnut', 'PaperCrane', 'Confetti'];

export class MockFeeder {
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 3000;
    this.onEvent = options.onEvent || (() => {});
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.timer = setInterval(() => {
      this.generateRandomEvent();
    }, this.intervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  generateRandomEvent() {
    const roll = Math.random();
    const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];

    if (roll < 0.4) {
      // Like event
      const likesCount = Math.floor(Math.random() * 5) + 1;
      this.triggerManual({
        type: 'like',
        user: randomUser,
        count: likesCount
      });
    } else if (roll < 0.7) {
      // Comment event
      const commentText = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
      this.triggerManual({
        type: 'comment',
        user: randomUser,
        comment: commentText
      });
    } else if (roll < 0.9) {
      // Gift event
      const giftName = MOCK_GIFTS[Math.floor(Math.random() * MOCK_GIFTS.length)];
      this.triggerManual({
        type: 'gift',
        user: randomUser,
        gift: giftName,
        quantity: 1
      });
    } else {
      // Follow event
      this.triggerManual({
        type: 'follow',
        user: randomUser
      });
    }
  }

  triggerManual(event) {
    const sanitizedUser = sanitizeUsername(event.user);
    const enrichedEvent = {
      type: event.type,
      user: sanitizedUser,
      timestamp: Date.now()
    };

    if (event.type === 'gift') {
      const giftAction = mapGiftToAction(event.gift);
      enrichedEvent.gift = event.gift;
      enrichedEvent.quantity = Number(event.quantity) || 1;
      enrichedEvent.action = giftAction.action;
      enrichedEvent.tier = giftAction.tier;
      enrichedEvent.value = giftAction.value * enrichedEvent.quantity;
      enrichedEvent.description = giftAction.description;
    } else if (event.type === 'comment') {
      const cleanComment = sanitizeComment(event.comment);
      const command = mapCommentToCommand(cleanComment);
      enrichedEvent.comment = cleanComment;
      enrichedEvent.command = command;
      if (command) {
        enrichedEvent.action = command;
      }
    } else if (event.type === 'like') {
      enrichedEvent.count = Number(event.count) || 1;
    } else if (event.type === 'follow') {
      enrichedEvent.action = 'spawn_resident';
    }

    this.onEvent(enrichedEvent);
    return enrichedEvent;
  }
}
