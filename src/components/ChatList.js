import MessengerApi from 'api/MessengerApi';
import { transformDate } from 'utils/index';
import storage from 'utils/storage';

class ChatList {
  constructor(setActiveChat) {
    // Props
    this.setActiveChat = setActiveChat;
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    this.userAuth = storage.getObject('user_auth');
    // State
    this.lastChat = {};
    this.chatsScroll = '';
    this.chatsObj = '';
    this.chatsPinnedObj = '';
  }

  scrollChats(chatsObj) {
    if ((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
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
    <div class="chats__item-time">
        ${chat.arrow ? `<div class="${chat.arrowClass}"></div>`: ''}
        ${chat.date}
    </div>
    ${chat.pinned && !chat.unread_count ? `<div class="chats__item-pinned"></div>` : ''}
    ${chat.unread_count ? `<div class="chats__item-unread">${chat.unread_count}</div>` : ''}`;
    chatView.addEventListener('click', () => this.setActiveChat(chat));
    console.log('PIN', chat.title, chat.pinned)
    if (update) {
      if(chat.pinned) {
        this.chatsPinnedObj.prepend(chatView);
      } else {
        this.chatsObj.prepend(chatView);
      }
    } else {
      if(chat.pinned) {
        this.chatsPinnedObj.append(chatView);
      } else {
        this.chatsObj.append(chatView);
      }
    }
  }

  getChats(flags = 0, offset_id = 0, offset_date = 0, offer_peer) {
    this.api.getDialogs(flags, offset_id, offset_date, offer_peer, this.limit).then((response) => {
      const {
        dialogs, messages, chats, users,
      } = response.result;
      console.log('getChats', response);
      dialogs.forEach((item) => {
        const chat = new Object({
          arrow: '',
          arrowClass: item.read_outbox_max_id >= item.top_message ? 'arrow-read' : 'arrow',
          id: '',
          access_hash: '',
          avatar: '',
          title: '',
          message: '',
          messageId: '',
          peer: item.peer,
          pinned: !!item.pFlags['pinned'],
          flags: item.flags,
          date: '',
          timestamp: '',
          unread_count: item.unread_count,
          isChannel: false,
        });
        messages.forEach((message) => {
          if (item.top_message === message.id) {
            chat.arrow = message.from_id === this.userAuth.id;
            chat.message = message.message;
            chat.messageId = message.id;
            chat.timestamp = message.date;
            chat.date = transformDate(message.date);
          }
        });
        if (item.peer._ === 'peerUser') {
          users.forEach((user) => {
            if (item.peer.user_id === user.id) {
              chat.id = user.id;
              chat.title = `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`;
              chat.access_hash = user.access_hash ? user.access_hash : '';
              chat.avatar = user.photo ? user.photo.photo_small : '';
            }
          });
        } else {
          chats.forEach((channel) => {
            if (item.peer.channel_id === channel.id) {
              chat.id = channel.id;
              chat.title = channel.title;
              chat.access_hash = channel.access_hash ? channel.access_hash : '';
              chat.isChannel = true;
              chat.avatar = channel.photo ? channel.photo.photo_small : '';
            }
          });
        }
        this.addChat(chat);
        this.lastChat = chat;
        if (chat.avatar) {
          this.api.getFile(chat.avatar).then((response) => {
            const base64 = `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, response.bytes))}`;
            document.getElementById(`avatar-${chat.id}`).style.backgroundImage = `url(${base64})`;
          }).catch((error) => {
            console.error(error);
          });
        }
      });
    });
  }

  init() {
    this.chatsObj = document.getElementById('chats');
    this.chatsPinnedObj = document.getElementById('pinnedChats');
    this.chatsScroll = document.getElementById('chatsScroll');
    this.getChats();
    this.chatsScroll.onscroll = () => this.scrollChats(this.chatsScroll);
  }
}

export default ChatList;
