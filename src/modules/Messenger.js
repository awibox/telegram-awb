import { getTime, transformDate } from 'utils/index';
import storage from 'utils/storage';
import 'styles/messenger.scss';

class Messenger {
  constructor() {
    // API
    this.api = telegramApi;
    // Storage
    this.userAuth = storage.getObject('user_auth');
    // Settings
    this.limit = 20;
    // Objects
    // State
    this.currentChatId = 0;
    this.params = '';
    this.scrollMessageId = '';
    this.offset = 0;
    this.messagesWereLoaded = true;
    this.chatsOffset = 0;
    this.chatsWereLoaded = false;
  }

  /**
   * BASE FUNCTIONS
   */

  sendMessage() {
    const self = this;
    if(this.currentChatId) {
      if(document.getElementById('sendInput').innerHTML) {
        this.api.sendMessage(this.currentChatId, document.getElementById('sendInput').innerHTML).then(function(response) {
          document.getElementById('sendInput').innerHTML = '';
          self.onUpdate(response);
        });
      }
    }
  }

  onKeyUpInput(e) {
    console.log(e);
    e.preventDefault();
    if(e.key === 'Enter') {
      this.sendMessage();
    }
  }

  setChatInfo(chat) {
    const avatarId = `avatar-${chat.id}`;
    const avatarElement = document.getElementById(avatarId);
    const avatar = avatarElement.style.backgroundImage ? `background-image: ${avatarElement.style.backgroundImage}` : '';
    if (avatarElement.innerText === '') {
      if (!avatar) {
        setTimeout(() => this.setChatInfo(chat), 500);
      }
    }
    document.getElementById('chatInfo').innerHTML = `
    <div class="im__info-container">
      <div class="im__info-item">
      <div class="im__info-item-avatar" style='${avatar || ''}'>
        ${!avatar ? avatarElement.innerText : ''}
      </div>
      <div class="im__info-item-title">
      <div class="im__info-item-title-text">${chat.title ? chat.title : wordsList.deletedAccount}</div>
      </div>
      <div class="im__info-item-status">Online</div>
      </div>
    </div>`;
  }

  setActiveChat(chat) {
    console.log('setActiveChat', chat)
    if (document.querySelector('.chats__item_active')) {
      document.querySelector('.chats__item_active').classList.remove('chats__item_active');
    }
    const chatElement = document.getElementById(`chat-${chat.id}`);
    chatElement.classList.add('chats__item_active');
    const params = {
      id: chat.type === 'user' ? chat.id : -chat.id,
      type: chat.type
    };
    this.currentChatId = params.id;
    this.loadMessages(params, true, chat.lastReadId);
    document.getElementById('sendMessage').style.display = 'flex';
  }

  /**
   * MESSAGE LIST
   */

  scrollMessages() {
    if (document.getElementById('messagesScroll').scrollTop === 0) {
      if(!this.messagesWereLoaded) {
        const params = {
          ...this.params,
          skip: this.offset,
        };
        this.loadMessages(params);
      }
    }
  }

  addMessage(item, update = false, firstLoad = false, lastReadId) {
    console.log('item', item);
    const message = new Object({
      id: item.id,
      message: item.message,
      timestamp: item.date,
      date: getTime(item.date),
      is_outgoing: item.from_id === this.userAuth.id,
    });

    const messageView = document.createElement('div');
    messageView.className = `messages__item ${item.arrow ? 'messages__item_arrow' : ''}`;
    messageView.id = `message-${message.id}`;
    const isOutgoing = message.is_outgoing;
    if (isOutgoing) {
      messageView.className = `messages__item messages__item_out ${item.arrow ? 'messages__item_arrow' : ''}`;
    }
    messageView.innerHTML = `
    <div class="messages__item-avatar"></div>
    <div class="messages__item-text">
      <span class="messages__item-text-content">
      ${message.message}
      </span>  
      <span class="messages__item-time">
        ${message.is_outgoing ? `${lastReadId >= item.id ? `<div class="arrow-read"></div>` : '<div class="arrow"></div>'}` : ''}
        ${message.date}
      </span>
    </div>`;
    if (!update) {
      document.getElementById('messages').prepend(messageView);
      if (firstLoad) {
          const messagesScroll = document.getElementById('messagesScroll');
          messagesScroll.scrollTop = messagesScroll.scrollHeight;
      } else {
        const messagesScroll = document.getElementById('messagesScroll');
        messagesScroll.scrollTop = document.getElementById(`message-${this.scrollMessageId}`).offsetTop;
      }
    } else {
      document.getElementById('messages').append(messageView);
      const messagesScroll = document.getElementById('messagesScroll');
      messagesScroll.scrollTop = messagesScroll.scrollHeight;
    }
  }

  loadMessages(params, firstLoad = false, lastReadId) {
    if(firstLoad) {
      this.offset = 0;
      document.getElementById('messages').innerHTML = '';
    }
    params.take = this.limit;
    this.params = params;
    this.api.getHistory(params).then((response) => {
      const { messages } = response;
      console.log('getMEssage', messages)
      if(messages.length < this.limit) {
        this.messagesWereLoaded = true;
      }
      this.offset = this.offset + this.limit;
      if(!!messages[0].id) {
        this.scrollMessageId = messages[0].id;
      }
      let fromId = 0;
      messages.forEach((item) => {
        if(fromId === item.from_id) {
          item.arrow = false;
        } else {
          item.arrow = true;
          fromId = item.from_id;
        }
        this.addMessage(item, false, firstLoad, lastReadId);
      });
      if (firstLoad) {
          this.messagesWereLoaded = false;
          const messagesScroll = document.getElementById('messagesScroll');
          messagesScroll.scrollTop = messagesScroll.scrollHeight;
      }
    });
  }

  /**
   * CHAT LIST
   */

  getChats(chatsOffset, updateId = 0) {
    if(!updateId) {
      this.setChatLoader(true);
    }
    this.api.getDialogs(chatsOffset, this.limit).then((response) => {
      const { result, offset } = response;
      const {
        dialogs, messages, chats, users,
      } = result;
      if(dialogs.length < this.limit) {
        this.chatsWereLoaded = true;
      }
      this.chatsOffset = offset;
      dialogs.forEach((item) => {
        if (!updateId) {
          this.configureChat(item, messages, chats, users);
        } else {
          if(updateId < 0) {
            updateId = -updateId;
          }
          if (item.peer.channel_id === updateId || item.peer.user_id === updateId || item.peer.chat_id === updateId) {
            this.configureChat(item, messages, chats, users, true);
          }
        }
      });
      console.log('ENDDD!!!!!!');
      this.setChatLoader(false);
    }).catch((error) => {
      this.setChatLoader(false);
      console.error(error);
    });
  }

  setChatLoader(start) {
    const loaderObj = document.getElementById('chatLoader');
    if(start) {
      loaderObj.style.display = 'flex';
    } else {
      loaderObj.style.display = 'none';
    }
  }

  configureChat(item, messages, chats, users, update = false) {
    const chat = new Object({
      arrow: '',
      arrowClass: item.read_outbox_max_id >= item.top_message ? 'arrow-read' : 'arrow',
      lastReadId: item.read_outbox_max_id,
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
      type: '',
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
    if (item.peer['_'] === 'peerUser') {
      users.forEach((user) => {
        if (item.peer.user_id === user.id) {
          chat.id = user.id;
          chat.title = `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`;
          chat.access_hash = user.access_hash ? user.access_hash : '';
          chat.avatar = user.photo ? user.photo.photo_small : '';
          chat.type = 'user';
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
          chat.type = !!item.peer.channel_id ? 'channel' : 'chat';
        }
      });
    }
    if (!!document.getElementById(`avatar-${chat.id}`)) {
      chat.avatarNode = document.getElementById(`avatar-${chat.id}`).cloneNode();
      chat.avatarNode.innerHTML = document.getElementById(`avatar-${chat.id}`).innerHTML;
    }
    this.addChat(chat, update);
    if (!update || !!document.getElementById(`avatar-${chat.id}`)) {
      if (chat.avatar) {
        const inputLocation = chat.avatar;
        inputLocation._ = 'inputFileLocation';
        this.api.invokeApi('upload.getFile', {
          location: inputLocation,
          offset: 0,
          limit: 1024 * 1024,
        }).then((response) => {
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
    }
  }

  scrollChats() {
    const chatsObj = document.getElementById('chatsScroll');
    if ((chatsObj.scrollHeight - chatsObj.offsetHeight) === chatsObj.scrollTop) {
      if(!this.chatsWereLoaded) {
        this.getChats(this.chatsOffset);
      }
    }
  }

  getMessage(message) {
    if (message.message) {
      return message.message;
    }
    if (!!message.media) {
      let mediaType;
      switch (message.media['_']) {
        case 'messageMediaDocument': {
          if (!!message.media.document.attributes) {
            message.media.document.attributes.forEach((item) => {
              if (!mediaType) {
                switch (item['_']) {
                  case 'documentAttributeSticker': {
                    mediaType = item.alt + ' Sticker';
                    break;
                  }
                  case 'documentAttributeFilename': {
                    mediaType = item.file_name;
                    break;
                  }
                  case 'documentAttributeAudio': {
                    if (!!item.pFlags.voice) {
                      mediaType = 'Voice Message';
                    } else {
                      mediaType = 'Audio';
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
        default:
          console.log('MEDIAA', message);
      }
      return mediaType;
    }
    // TODO Indetify users
    if (message['_'] === 'messageService') {
      let messageService;
      switch (message.action['_']) {
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
        case "messageActionChatEditTitle" : {
          messageService = `channel renamed to "${message.action.title}"`;
          break;
        }
      }
      return messageService;
    }
  }

  getDefaultAvatarText(title) {
    if (!!title) {
      const avatarText = title.split(' ');
      if (avatarText.length === 1) {
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

  addChat(chat, update = false) {
    const chatPhotoId = `avatar-${chat.id}`;
    const chatView = document.createElement('div');
    chatView.className = 'chats__item';
    chatView.id = `chat-${chat.id}`;
    chatView.innerHTML = `
    ${chat.avatarNode ? '' : `<div id='${chatPhotoId}' class="chats__item-avatar"></div>`}
    <div class="chats__item-title">
        <div class="chats__item-title-text" title="${chat.title}">${chat.title}</div>
        ${chat.mute ? `<div class="chats__item-mute-icon"></div>` : ''}
    </div>
    <div class="chats__item-last">${chat.arrow ? 'You: ' : ''}${this.getMessage(chat.message)}</div>
    <div class="chats__item-time">
        ${chat.arrow ? `<div class="${chat.arrowClass}"></div>` : ''}
        ${chat.date}
    </div>
    ${chat.pinned && !chat.unread_count ? `<div class="chats__item-pinned"></div>` : ''}
    ${chat.unread_count ? `<div class="chats__item-unread ${chat.mute ? 'chats__item-unread_mute' : ''}">${chat.unread_count}</div>` : ''}`;
    chatView.addEventListener('click', () => this.setActiveChat(chat));
    chatView.addEventListener('click', () => this.setChatInfo(chat));
    if (chat.avatarNode) {
      chatView.prepend(chat.avatarNode);
    }
    if (update) {

      this.deleteChat(chat.id);
      if (chat.pinned) {
        document.getElementById('pinnedChats').prepend(chatView);
      } else {
        document.getElementById('chats').prepend(chatView);
      }
    } else {
      if (chat.pinned) {
        document.getElementById('pinnedChats').append(chatView);
      } else {
        document.getElementById('chats').append(chatView);
      }
    }
    console.log('RENDER CHAT')
  }

  deleteChat(id) {
    if(!!document.getElementById(`chat-${id}`)) {
      document.getElementById(`chat-${id}`).remove();
    }
  }

  /**
   * Updates
   */
  onUpdate(update) {
    console.log('onUpdate', update, update['_'])
    const self = this;
    if(update['_'] === "updates") {
      const { updates } = update;
      updates.forEach((item) => {
        if(item) {
          self.checkUpdate(item)
        }
      })
    } else {
      self.checkUpdate(update)
    }
  }

  checkUpdate(update) {
    // console.log('checkUpdate', update);
    switch (update['_']) {
      case 'updateNewMessage' : {
        const { from_id, to_id } = update.message;
        if (!!to_id.chat_id) {
          this.getChats(0, to_id.chat_id);
          if(-this.currentChatId === to_id.chat_id) {
            this.addMessage(update.message, true);
          }
        } else {
          const updateId = from_id === this.userAuth.id ? to_id.user_id : from_id;
          this.getChats(0, updateId);
          if(this.currentChatId === from_id) {
            this.addMessage(update.message, true);
          }
        }
        break;
      }
      case "updateEditChannelMessage" : {
        const { to_id } = update.message;
        this.getChats(0, to_id.channel_id);
        if(-this.currentChatId === to_id.channel_id) {
          this.addMessage(update.message, true);
        }
        break;
      }
      case 'updateNewChannelMessage' : {
        const { to_id } = update.message;
        this.getChats(0, to_id.channel_id);
        if(-this.currentChatId === to_id.channel_id) {
          this.addMessage(update.message, true);
        }
        break;
      }
      case 'updateShortMessage' : {
        this.getChats(0, update.user_id);
        if(this.currentChatId === update.user_id) {
          this.addMessage(update, true);
        }
        break;
      }
      case 'updateShortSentMessage' : {
        this.api.getMessages(update.id).then((response) => {
          const { messages } = response;
          const message = messages[0];
          if (message.to_id['_'] === 'peerUser') {
            this.getChats(0, message.to_id.user_id);
          } else if(message.to_id['_'] ===  "peerChat") {
            this.getChats(0, message.to_id.chat_id);
          } else {
            this.getChats(0, message.to_id.channel_id);
          }
          this.addMessage(message, true);
        }).catch((e) => {
          console.log(e)
        });
        break;
      }
      case 'updateShortChatMessage' : {
        this.getChats(0, update.chat_id);
        if(-this.currentChatId === update.chat_id) {
          this.addMessage(update, true);
        }
        break;
      }
      default :
        break;
    }
  }

  render() {
    // Chat list init
    const self = this;
    this.setChatLoader(true);
    if(this.userAuth) {
      this.getChats();
      this.api.subscribe(this.userAuth.id, (update) => this.onUpdate(update));
    } else {
      this.api.invokeApi('users.getFullUser', { id: {_: 'inputUserSelf'} }).then(function(result){
        storage.setObject('user_auth', result.user);
        self.userAuth = result.user;
        self.getChats();
        self.api.subscribe(result.user.id, (update) => selt.onUpdate(update));
      });
    }
    document.getElementById('chatsScroll').onscroll = () => this.scrollChats();
    document.getElementById('messagesScroll').onscroll = () => this.scrollMessages();
    document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
    document.getElementById('sendInput').addEventListener('keyup', (e) => this.onKeyUpInput(e))
  }
}
export default Messenger;
