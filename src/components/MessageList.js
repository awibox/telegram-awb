import MessengerApi from 'api/MessengerApi';
import { getTime, transformDate } from 'utils/index';

class MessageList {
  constructor() {
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    // State
    this.params = '';
    this.scrollMessageId = '';
    this.offset = 0;
    this.messagesScroll = '';
    this.messageObj = '';
    this.messagesWereLoaded = true;
  }

  scrollMessages() {
    if (this.messagesScroll.scrollTop === 0) {
      if(!this.messagesWereLoaded) {
        const params = {
          ...this.params,
          skip: this.offset,
        };
        this.loadMessages(params);
      }
    }
  }

  addMessage(item, update = false, firstLoad = false) {
    const message = new Object({
      id: item.id,
      message: item.message,
      timestamp: item.date,
      date: getTime(item.date),
      is_outgoing: false,
    });

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
      if (firstLoad) {
        setTimeout(() => {
          this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
        }, 200);
      } else {
        setTimeout(() => {
          this.messagesScroll.scrollTop = document.getElementById(`message-${this.scrollMessageId}`).offsetTop;
        }, 200);
      }
    } else {
      this.messageObj.append(messageView);
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
    }
  }

  loadMessages(params, firstLoad = false) {
    if(firstLoad) {
      this.offset = 0;
      this.messageObj.innerHTML = '';
    }
    params.take = this.limit;
    this.params = params;
    this.api.getMessages(params).then((response) => {
      const { messages } = response;
      if(messages.length < this.limit) {
        this.messagesWereLoaded = true;
      }
      this.offset = this.offset + this.limit;
      if(!!messages[0].id) {
        this.scrollMessageId = messages[0].id;
      }
      messages.forEach((item) => {
        this.addMessage(item, false, firstLoad);
      });
      if (firstLoad) {
        setTimeout(() => {
          this.messagesWereLoaded = false;
          this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
        }, 200);
      }
    });
  }

  init() {
    this.messagesScroll = document.getElementById('messagesScroll');
    this.messageObj = document.getElementById('messages');
    this.messagesScroll.onscroll = () => this.scrollMessages();
  }
}

export default MessageList;
