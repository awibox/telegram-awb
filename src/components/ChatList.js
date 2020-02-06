import MessengerApi from 'api/MessengerApi';
import { transformDate } from 'utils/index';
import storage from 'utils/storage';

class ChatList {
  constructor(setActiveChat) {
    // Props
    this.setActiveChat = setActiveChat;
    this.userAuth = storage.getObject('user_auth');
    // API
    this.limit = 20;
    this.api = new MessengerApi();
    // State
    this.chatsOffset = 0;
    this.chatsScroll = '';
    this.chatsObj = '';
    this.chatsPinnedObj = '';
  }

  scrollChats(chatsObj) {
    if ((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
      this.getChats(this.chatsOffset);
    }
  }

  getMessage(message) {
    if(message.message) {
      return message.message;
    }
    if(!!message.media) {
      let mediaType;
      switch (message.media['_']) {
        case 'messageMediaDocument': {
          if(!!message.media.document.attributes) {
            message.media.document.attributes.forEach((item) => {
              if(!mediaType) {
                switch(item['_']) {
                  case 'documentAttributeSticker': {
                    mediaType = item.alt + ' Sticker';
                    break;
                  }
                  case 'documentAttributeFilename': {
                    mediaType = item.file_name;
                    break;
                  }
                  case 'documentAttributeAudio': {
                    if(!!item.pFlags.voice) {
                      mediaType = 'Voice Message'
                    } else {
                      mediaType = 'Audio'
                    }
                  }
                }
              }
            });
          } else {
            mediaType = 'Document';
          }
          break;
        }
        case 'messageMediaPhoto': {
          mediaType = message.media.caption ? `🖼️${message.media.caption}` : 'Photo';
          break;
        }
        case 'messageMediaGeo': {
          mediaType = 'Location';
          break;
        }
        default: console.log('MEDIAA', message);
      }
      return mediaType;
    }
    // TODO Indetify users
    if(message['_'] === "messageService") {
      let messageService;
      switch(message.action['_']) {
        case 'messageActionChatAddUser' : {
          messageService = 'join the group';
          break;
        }
        case 'messageActionCustomAction' : {
          messageService = message.action.message;
          break;
        }
        case 'messageActionChatMigrateTo' : {
          messageService = 'messageActionChatMigrateTo';
          break;
        }
        case 'messageActionChatDeleteUser' : {
          messageService = 'messageActionChatDeleteUser';
          break;
        }
      }
      return messageService;
    }
  }

  getDefaultAvatarText(title) {
    if(!!title) {
      const avatarText = title.split(' ');
      if(avatarText.length === 1) {
        return avatarText[0].charAt(0) + avatarText[0].charAt(1);
      } else {
        return avatarText[0].charAt(0) + avatarText[1].charAt(0);
      }
    } else {
      return '';
    }
  }

  getRandomColor() {
    const colors = ['#28a745', '#d73a49', '#6f42c1', '#0366d6', '#f66a0a'];
    return colors[Math.floor(Math.random() * 5)];
  }

  addChat(chat, update) {
    const chatPhotoId = `avatar-${chat.id}`;
    const chatView = document.createElement('div');
    chatView.className = 'chats__item';
    chatView.id = `chat-${chat.id}`;
    chatView.innerHTML = `
    <div id='${chatPhotoId}' class="chats__item-avatar"></div>
    <div class="chats__item-title">
        <div class="chats__item-title-text" title="${chat.title}">${chat.title}</div>
        ${chat.mute ? `<div class="chats__item-mute-icon"></div>`: ''}
    </div>
    <div class="chats__item-last">${chat.arrow ? 'You: ' : ''}${this.getMessage(chat.message)}</div>
    <div class="chats__item-time">
        ${chat.arrow ? `<div class="${chat.arrowClass}"></div>`: ''}
        ${chat.date}
    </div>
    ${chat.pinned && !chat.unread_count ? `<div class="chats__item-pinned"></div>` : ''}
    ${chat.unread_count ? `<div class="chats__item-unread ${chat.mute ? 'chats__item-unread_mute' : ''}">${chat.unread_count}</div>` : ''}`;
    chatView.addEventListener('click', () => this.setActiveChat(chat));
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

  getChats(chatsOffset) {
    this.api.getDialogs(chatsOffset, this.limit).then((response) => {
      const {result, offset} = response;
      const {
        dialogs, messages, chats, users,
      } = result;
      console.log('getChats', result);
      this.chatsOffset = offset;
      dialogs.forEach((item) => {
        const chat = new Object({
          arrow: '',
          arrowClass: item.read_outbox_max_id >= item.top_message ? 'arrow-read' : 'arrow',
          id: '',
          access_hash: '',
          avatar: '',
          title: '',
          message: '',
          mute: !!item.notify_settings.mute_until,
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
            chat.message = message;
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
            if (item.peer.channel_id === channel.id || item.peer.chat_id === channel.id) {
              chat.id = channel.id;
              chat.title = channel.title;
              chat.access_hash = channel.access_hash ? channel.access_hash : '';
              chat.isChannel = true;
              chat.avatar = channel.photo ? channel.photo.photo_small : '';
            }
          });
        }
        this.addChat(chat);
        if (chat.avatar) {
          this.api.getFile(chat.avatar).then((response) => {
            const base64 = `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, response.bytes))}`;
            document.getElementById(`avatar-${chat.id}`).style.backgroundImage = `url(${base64})`;
          }).catch((error) => {
            console.error(error);
            document.getElementById(`avatar-${chat.id}`).innerHTML = this.getDefaultAvatarText(chat.title);
            document.getElementById(`avatar-${chat.id}`).style.backgroundColor = this.getRandomColor();
          });
        } else {
          document.getElementById(`avatar-${chat.id}`).innerHTML = this.getDefaultAvatarText(chat.title);
          document.getElementById(`avatar-${chat.id}`).style.backgroundColor = this.getRandomColor();
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
