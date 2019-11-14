import { transformDate, getTime } from 'utils';
import * as storage from 'utils/storage';
import 'styles/messenger.scss';

class Messenger {
  constructor(client) {
    this.client = client;
    this.LIMIT = 20;
    this.messageObj = '';
    this.messagesScroll = '';
    this.chatId = null;
    this.lastMessage = {};
  }
  onUpdate(update) {
    if(update['@type'] === 'updateChatLastMessage') {
      if(update.chat_id === this.chatId) {
        this.addMessage(update.last_message);
      }
    }
  }
  addMessage(message, history) {
    const messageView = document.createElement('div');
    messageView.className = 'messages__item';
    messageView.id = `message-${message.id}`;
    const isOutgoing = message.is_outgoing;
    const canBeEdited = message.can_be_edited;
    console.log('addMessage', message, this.messageObj);
    if(isOutgoing) {
      messageView.className = 'messages__item messages__item_out';
    }
    // console.log('message', message)
    if(message.content['@type'] === 'messageText') {
      messageView.innerHTML = `
        <div class="messages__item-avatar"></div>
        <div class="messages__item-text">
        ${message.content.text.text}
        <div class="messages__item-time">
          ${canBeEdited ? '++' : '--'}
          ${isOutgoing && !canBeEdited ? '+' : '-'}
          ${getTime(message.date)}
        </div>
        </div>`;
    }
    if(!history) {
      this.messageObj.append(messageView);
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
    } else {
      this.messageObj.prepend(messageView);
      this.messagesScroll.scrollTop = document.getElementById(`message-${this.lastMessage.id}`).offsetTop;
    }
  }
  messageList(chatId, lastMessage, getHistory) {
    const MESSAGES_LIMIT = this.LIMIT;
    const MESSAGES_OFFSET = 0;
    if(!getHistory) {
      this.messageObj.innerHTML = '';
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
      console.log('response.messages', response.messages);
      response.messages.reverse().forEach((item, index) => {
        this.addMessage(item, getHistory);
        if(index === 0) {
          this.lastMessage = item;
        }
      });
      !getHistory && this.addMessage(lastMessage, false);
    })();
    storage.set('chatId', chatId);
    storage.setObject('lastMessage', lastMessage);
  }
  scrollMessages(messagesObj) {
    console.log('messagesObj', messagesObj.scrollTop);
    if(messagesObj.scrollTop === 0) {
      this.messageList(this.chatId, this.lastMessage, true);
    }
  }
  chatList() {
    const CHATS_LIMIT = this.LIMIT;
    const CHATS_OFFSET = 0;
    const chatsObj = document.getElementById('chats');
    this.client.send({
      '@type': 'getChats',
      offset_order: '9223372036854775807',
      offset_chat_id: CHATS_OFFSET,
      limit: CHATS_LIMIT,
    }).then(result => {
      result.chat_ids.forEach((item) => {
        (async () => {
          const response = await this.client.send({
            '@type': 'getChat',
            chat_id: item,
          }).catch(error => {
            console.error(error);
          });
          console.log('chatList', response);
          const isOutgoing = response.last_message.is_outgoing;
          const canBeEdited = response.last_message.can_be_edited;
          const chatView = document.createElement('div');
          chatView.className = 'chats__item';
          chatView.id = `chat-${item}`;
          chatView.innerHTML = `
            <div class="chats__item-avatar"></div>
            <div class="chats__item-title">${response.title}</div>
            <div class="chats__item-last">${response.last_message.content.text.text}</div>
            <div class="chats__item-time">
                ${isOutgoing && !canBeEdited ? '+' : ''}
                ${isOutgoing && canBeEdited ? '++' : ''}
                ${transformDate(response.last_message.date)}
            </div>
            ${response.unread_count > 0 ? `<div class="chats__item-unread">${response.unread_count}</div>` : ''}`;
          chatView.addEventListener('click', () => this.messageList(item, response.last_message));
          chatsObj.append(chatView);
        })();
      });
    }).finally(() => {
      const chatId = storage.get('chatId');
      const lastMessage = storage.getObject('lastMessage');
      if(typeof chatId !== 'undefined' && typeof lastMessage !== 'undefined') {
        this.messageList(chatId, lastMessage, false);
      }
    }).catch(error => {
      console.error(error);
    });
  }
  render() {
    this.messagesScroll = document.getElementById('messagesScroll');
    this.messageObj = document.getElementById('messages');
    this.messagesScroll.onscroll = () => this.scrollMessages(this.messagesScroll);
    this.chatList();
    this.client.onUpdate = (update) => this.onUpdate(update);
  }
}
export default Messenger;