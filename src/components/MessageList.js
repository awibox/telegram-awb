import MessengerApi from 'api/MessengerApi';
import { getTime, transformDate } from 'utils/index';

class MessageList {
  constructor(setActiveChat) {
    // Props
    this.setActiveChat = setActiveChat;
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    // State
    this.lastMessage = {};
    this.messagesScroll = '';
    this.messageObj = '';
  }

  scrollMessages() {
    if (this.messagesScroll.scrollTop === 0) {
      console.log('this.lastMessage', this.lastMessage);
      this.loadMessages(this.lastMessage.peer, this.lastMessage.id, 20);
    }
  }

  addMessage(message, update, reset) {
    const messageView = document.createElement('div');
    messageView.className = 'messages__item';
    messageView.id = `message-${message.id}`;
    const isOutgoing = message.is_outgoing;
    if (isOutgoing) {
      messageView.className = 'messages__item messages__item_out';
    }
    messageView.innerHTML = `
      <div class="messages__item-avatar"></div>
      <div class="messages__item-text">
      ${message.message}
      <div class="messages__item-time">
        ${message.date}
      </div>
      </div>`;
    if (!update) {
      this.messageObj.prepend(messageView);
      if (reset) {
        this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
      }
    } else {
      this.messageObj.append(messageView);
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
    }
  }

  loadMessages(peer, offset_id = 0, add_offset = 0) {
    if (offset_id === 0) {
      this.messageObj.innerHTML = '';
    }
    this.api.getMessages(peer, offset_id, add_offset, this.limit).then((response) => {
      const { messages } = response;
      messages.forEach((item) => {
        const message = new Object({
          id: item.id,
          message: item.message,
          timestamp: item.date,
          date: getTime(item.date),
          is_outgoing: false,
          peer,
        });
        this.addMessage(message, false, offset_id === 0);
        this.lastMessage = message;
      });
    });
  }

  init() {
    this.messagesScroll = document.getElementById('messagesScroll');
    this.messageObj = document.getElementById('messages');
    this.messagesScroll.onscroll = () => this.scrollMessages();
  }
}

export default MessageList;
