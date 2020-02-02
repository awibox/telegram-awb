import MessengerApi from 'api/MessengerApi';
import { transformDate } from 'utils/index';

class ChatList {
  constructor(setActiveChat) {
    // Props
    this.setActiveChat = setActiveChat;
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    // State
    this.lastChat = {};
    this.chatsScroll = '';
    this.chatsObj = '';
  }

  scrollChats(chatsObj) {
    if((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
      this.getChats(this.lastChat.flags, this.lastChat.messageId, this.lastChat.timestamp, this.lastChat.peer);
    }
  }

  addChat(chat, update) {
    const chatPhotoId = `avatar-${chat.id}`;
    const chatView = document.createElement('div');
    chatView.className = 'chats__item';
    chatView.id = `chat-${chat.id}`;
    chatView.innerHTML = `
    <div id='${chatPhotoId}' class="chats__item-avatar"></div>
    <div class="chats__item-title">${chat.title}</div>
    <div class="chats__item-last">${chat.message}</div>
    <div class="chats__item-time">${chat.date}</div>
    ${chat.unread_count ? `<div class="chats__item-unread">${chat.unread_count}</div>` : ''}`;
    chatView.addEventListener('click', () => this.setActiveChat(chat));
    if(!!update) {
      this.chatsObj.prepend(chatView);
    } else {
      this.chatsObj.append(chatView);
    }
  }

  getChats(flags = 0, offset_id = 0, offset_date = 0, offer_peer) {
    this.api.getChats(flags, offset_id, offset_date, offer_peer, this.limit).then(result => {
      const { dialogs, messages, chats, users } = result;
      dialogs.forEach((item, index) => {
        const chat = new Object({
          id: '',
          access_hash: '',
          title: '',
          message: '',
          messageId: '',
          peer: item.peer,
          flags: item.flags,
          date: '',
          timestamp: '',
          unread_count: item.unread_count,
          isChannel: false
        });
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
              chat.id = user.id;
              chat.title = `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`;
              chat.access_hash = user.access_hash ? user.access_hash : '';
            }
          });
        } else {
          chats.forEach((channel) => {
            if(item.peer.channel_id === channel.id) {
              chat.id = channel.id;
              chat.title = channel.title;
              chat.access_hash = channel.access_hash ? channel.access_hash : '';
              chat.isChannel = true;
            }
          });
        }
        this.addChat(chat);
        this.lastChat = chat;
      });
    })
  }
  init() {
    this.chatsObj = document.getElementById('chats');
    this.chatsScroll = document.getElementById('chatsScroll');
    this.getChats();
    this.chatsScroll.onscroll = () => this.scrollChats(this.chatsScroll);
  }
}

export default ChatList;
