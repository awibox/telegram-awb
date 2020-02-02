import MessengerApi from 'api/MessengerApi';
import { transformDate } from 'utils/index';

class ChatList {
  constructor() {
    this.limit = 20;
    this.api = new MessengerApi();
    this.lastChat = {};
    this.chatsScroll = '';
    this.chatsObj = '';
  }

  scrollChats(chatsObj) {
    if((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
      this.getChats(this.lastChat.flags, this.lastChat.messageId, this.lastChat.timestamp, this.lastChat.peer);
    }
  }
  
  getChats(flags, offset_id, offset_date, offer_peer) {
    const CHATS_LIMIT = this.limit;
    this.api.getChats(flags, offset_id, offset_date, offer_peer, CHATS_LIMIT).then(result => {
      const { dialogs, messages, chats, users } = result;
      dialogs.forEach((item, index) => {
        const chat = {
          title: '',
          message: '',
          messageId: '',
          peer: item.peer,
          flags: item.flags,
          date: '',
          timestamp: '',
          unread_count: item.unread_count
        };
        messages.forEach((message) => {
          if(item.top_message === message.id) {
            chat.message = message.message;
            chat.messageId = message.id;
            chat.timestamp = message.date;
            chat.date = transformDate(message.date);
          }
        });
        if(item.peer["_"] === "peerUser") {
          users.forEach((user) => {
            if(item.peer.user_id === user.id) {
              chat.title = `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`;
            }
          });
        } else {
          chats.forEach((channel) => {
            if(item.peer.channel_id === channel.id) {
              chat.title = channel.title;
            }
          });
        }
        const chatId = 135;
        const chatPhotoId = `avatar-${chatId}`;
        const chatView = document.createElement('div');
        chatView.className = 'chats__item';
        chatView.id = `chat-${chatId}`;
        chatView.innerHTML = `
<div id='${chatPhotoId}' class="chats__item-avatar"></div>
<div class="chats__item-title">${chat.title}</div>
<div class="chats__item-last">${chat.message}</div>
<div class="chats__item-time">${chat.date}</div>
${chat.unread_count ? `<div class="chats__item-unread">${chat.unread_count}</div>` : ''}
`;
        this.chatsObj.append(chatView);
        this.lastChat = chat;
      });
    })
  }
  init() {
    this.chatsObj = document.getElementById('chats');
    this.chatsScroll = document.getElementById('chatsScroll');
    this.getChats(0,0, 0);
    this.chatsScroll.onscroll = () => this.scrollChats(this.chatsScroll);
  }
}

export default ChatList;
