import MessengerApi from 'api/MessengerApi';
import { transformDate } from 'utils/index';

class MessageList {
  constructor(setActiveChat) {
    // Props
    this.setActiveChat = setActiveChat;
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    // State
    this.lastChat = {};
    this.messagesScroll = '';
    this.messageObj = '';
  }

  loadMessages() {
    this.api.getMessages().then((message) => {
      console.log(message);
    })
  }

  init() {
    this.messagesScroll = document.getElementById('messagesScroll');
    this.messageObj = document.getElementById('messages');
    this.messagesScroll.onscroll = () => this.scrollMessages(this.messagesScroll)
  }
}

export default MessageList;
