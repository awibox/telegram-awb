import { transformDate, getTime } from 'utils';
import * as storage from 'utils/storage';
import 'styles/messenger.scss';

class Messenger {
  constructor(client) {
    this.client = client;
    this.LIMIT = 20;
    this.messageObj = '';
    this.messagesScroll = '';
    this.chatsScroll = '';
    this.lastChatId = null;
    this.lastChatOrder = null;
    this.chatId = null;
    this.chatsObj = '';
    this.lastMessage = {};
    this.messageForScroll = null;
  }
  onUpdate(update) {
    if(update['@type'] === 'updateNewMessage') {
      this.addChat(update.message.chat_id, true);
      if(update.message.chat_id === this.chatId) {
        this.addMessage(update.message);
      }
    }
  }
  getChatContent(content) {
    if(content['@type'] === 'messageText') {
      return content.text.text;
    }
    if(content['@type'] === 'messagePhoto') {
      return 'Photo';
    }
    if(content['@type'] === 'messageDocument') {
      return 'Document';
    }
    if(content['@type'] === 'messageSticker') {
      return `${content.sticker.emoji} Sticker`;
    }
    if(content['@type'] === 'messageCall') {
      return `Call`;
    }
    if(content['@type'] === 'messageAnimation') {
      return `Animation`;
    }
  }
  getMessageContent(content) {
    if(content['@type'] === 'messageText') {
      return content.text.text;
    }
    if(content['@type'] === 'messagePhoto') {
      return '[Photo]';
    }
    if(content['@type'] === 'messageDocument') {
      return '[Document]';
    }
    if(content['@type'] === 'messageSticker') {
      return `${content.sticker.emoji} [Sticker]`;
    }
    if(content['@type'] === 'messageCall') {
      return `[Call]`;
    }
    if(content['@type'] === 'messageAnimation') {
      return `[Animation]`;
    }
    if(content['@type'] === 'messageSupergroupChatCreate') {
      return `Chat was created`;
    }
  }
  addMessage(message) {
    const messageView = document.createElement('div');
    messageView.className = 'messages__item';
    messageView.id = `message-${message.id}`;
    const isOutgoing = message.is_outgoing;
    const canBeEdited = message.can_be_edited;
    if(isOutgoing) {
      messageView.className = 'messages__item messages__item_out';
    }
    messageView.innerHTML = `
      <div class="messages__item-avatar"></div>
      <div class="messages__item-text">
      ${this.getMessageContent(message.content)}
      <div class="messages__item-time">
        ${canBeEdited ? '++' : '--'}
        ${isOutgoing && !canBeEdited ? '+' : '-'}
        ${getTime(message.date)}
      </div>
      </div>`;
    this.messageObj.prepend(messageView);
  }
  messageList(chatId, lastMessage, getHistory) {
    const MESSAGES_LIMIT = this.LIMIT;
    const MESSAGES_OFFSET = 0;
    if(!getHistory) {
      this.messageObj.innerHTML = '';
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
      this.chatId = chatId;
    }
    (async () => {
      const response = await this.client.send({
        '@type': 'getChatHistory',
        chat_id: chatId,
        from_message_id: lastMessage.id,
        offset: MESSAGES_OFFSET,
        limit: MESSAGES_LIMIT,
        only_local: false
      }).catch(error => {
        console.error(error);
      });
      const messagesArray = response.messages;
      this.lastMessage = messagesArray[messagesArray.length - 1];
      if(getHistory) {
        this.messageForScroll = messagesArray[0].id;
      }
      if(!getHistory) {
        this.addMessage(lastMessage);
      }
      messagesArray.forEach((item) => {
        this.addMessage(item);
      });
      if(!getHistory) {
        setTimeout(() => {
          this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
        },50);
      } else {
        this.messagesScroll.scrollTop = document.getElementById(`message-${this.messageForScroll}`).offsetTop;
      }
    })();
    storage.set('chatId', chatId);
  }
  scrollChats(chatsObj) {
    if((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
      this.chatList(this.lastChatId, this.lastChatOrder);
    }
  }
  scrollMessages(messagesObj) {
    if(messagesObj.scrollTop === 0) {
      this.messageList(this.chatId, this.lastMessage, true);
    }
  }
  addChat(chatId, isUpdate) {
    console.log('addChat', chatId, isUpdate);
    (async () => {
      const response = await this.client.send({
        '@type': 'getChat',
        chat_id: chatId,
      }).catch(error => {
        console.error(error);
      });
      const isOutgoing = response.last_message.is_outgoing;
      const canBeEdited = response.last_message.can_be_edited;
      const chatView = document.createElement('div');
      chatView.className = 'chats__item';
      chatView.id = `chat-${chatId}`;
      chatView.innerHTML = `
            <div class="chats__item-avatar"></div>
            <div class="chats__item-title">${response.title}</div>
            <div class="chats__item-last">${this.getChatContent(response.last_message.content)}</div>
            <div class="chats__item-time">
                ${isOutgoing && !canBeEdited ? '+' : ''}
                ${isOutgoing && canBeEdited ? '++' : ''}
                ${transformDate(response.last_message.date)}
            </div>
            ${response.unread_count > 0 ? `<div class="chats__item-unread">${response.unread_count}</div>` : ''}`;
      chatView.addEventListener('click', () => this.messageList(chatId, response.last_message, false));
      if(!isUpdate) {
        this.chatsObj.append(chatView);
        this.lastChatId = response.id;
        this.lastChatOrder = response.order;
      } else {
        const chatElement = document.getElementById(`chat-${chatId}`);
        console.log('chatElement', chatElement);
        if(chatElement) {
          this.chatsObj.removeChild(chatElement);
        }
        this.chatsObj.prepend(chatView);
      }
    })();
  }
  chatList(CHATS_OFFSET_ID, CHATS_OFFSET_ORDER) {
    const CHATS_LIMIT = this.LIMIT;
    this.chatsObj = document.getElementById('chats');
    this.client.send({
      '@type': 'getChats',
      offset_order: CHATS_OFFSET_ORDER,
      offset_chat_id: CHATS_OFFSET_ID,
      limit: CHATS_LIMIT,
    }).then(result => {
      result.chat_ids.forEach((item) => {
        this.addChat(item, false);
      });
    }).finally(() => {
      const chatId = +storage.get('chatId');
      console.log('chatId', chatId);
      if(typeof chatId !== 'undefined') {
        (async () => {
          const chat = await this.client.send({
            '@type': 'getChat',
            chat_id: chatId,
          });
          this.messageList(chatId, chat.last_message, false);
        })();
      }
    }).catch(error => {
      console.error(error);
    });
  }
  render() {
    this.messagesScroll = document.getElementById('messagesScroll');
    this.chatsScroll = document.getElementById('chatsScroll');
    this.messageObj = document.getElementById('messages');
    this.messagesScroll.onscroll = () => this.scrollMessages(this.messagesScroll);
    this.chatsScroll.onscroll = () => this.scrollChats(this.chatsScroll);
    this.chatList(0, '9223372036854775807');
    this.client.onUpdate = (update) => this.onUpdate(update);
  }
}
export default Messenger;