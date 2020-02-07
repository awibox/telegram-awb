import MessengerApi from 'api/MessengerApi';
import { getTime, transformDate } from 'utils/index';
import ChatList from 'components/ChatList';
import MessageList from 'components/MessageList';
import storage from 'utils/storage';
import 'styles/messenger.scss';

const wordsList = {
  deletedAccount: 'Deleted Account',
};

class Messenger {
  constructor() {
    // Components
    this.chatList = new MessengerApi();
    this.messageList = new MessageList();
    // API
    this.api = telegramApi;
    this.userAuth = storage.getObject('user_auth');
    this.LIMIT = 20;
    this.messageObj = '';
    this.messagesScroll = '';
    this.chatsScroll = '';
    this.chatInfo = '';
    this.lastChatId = null;
    this.lastChatOrder = null;
    this.chat = {};
    this.chatsObj = '';
    this.lastMessage = {};
    this.messageForScroll = null;
  }

  // NEW STAFF
  setActiveChat(chat) {
    if (document.querySelector('.chats__item_active')) {
      document.querySelector('.chats__item_active').classList.remove('chats__item_active');
    }
    const chatElement = document.getElementById(`chat-${chat.id}`);
    chatElement.classList.add('chats__item_active');
    const peer = this.api.getInputPeerByID(chat.id, chat.access_hash, chat.isChannel);
    const messageList = new MessageList();
    messageList.init();
    messageList.loadMessages(peer);
  }

  onUpdate(update) {
    console.log('update', update);
    if(update['_'] === "updates") {
      const { updates } = update;
      updates.forEach((item) => {
        if(item['_'] === 'updateNewMessage') {
          this.chatList.updateChat(item['_'], item.message);
        }
        if(item['_'] === "updateNewChannelMessage") {
          this.chatList.updateChat(item['_'], item.message);
        }
      })
    }
    if(update['_'] === "updateShortMessage") {
      this.chatList.updateChat(update['_'], update);
    }
    if(update['_'] === "updateShortChatMessage") {
      this.chatList.updateChat(update['_'], update);
    }
    // if (update['@type'] === 'updateNewMessage') {
    //   this.addChat(update.message.chat_id, true);
    //   if (update.message.chat_id === this.chat.id) {
    //     this.addMessage(update.message, update);
    //     this.readMessages(update.message.chat_id, [update.message]);
    //   }
    // }
    // if (update['@type'] === 'updateChatReadInbox') {
    //   this.updateChatReadInbox(update);
    // }
  }
  // OLD CONTENT
  getChatContent(content) {
    if (content['@type'] === 'messageText') {
      return content.text.text;
    }
    if (content['@type'] === 'messagePhoto') {
      return 'Photo';
    }
    if (content['@type'] === 'messageDocument') {
      return 'Document';
    }
    if (content['@type'] === 'messageSticker') {
      return `${content.sticker.emoji} Sticker`;
    }
    if (content['@type'] === 'messageCall') {
      return 'Call';
    }
    if (content['@type'] === 'messageAnimation') {
      return 'Animation';
    }
  }

  getMessageContent(content) {
    if (content['@type'] === 'messageText') {
      return content.text.text;
    }
    if (content['@type'] === 'messagePhoto') {
      let remotePhoto;
      if (content.photo.sizes[0]) {
        remotePhoto = content.photo.sizes[0];
      }
      if (content.photo.sizes[1]) {
        remotePhoto = content.photo.sizes[1];
      }
      const photoId = `photo-${remotePhoto.photo.id}`;
      const photoHeight = remotePhoto.height / (remotePhoto.width / 100);
      const photoElement = `
        <div id='${photoId}' class='photo'></div>
        ${content.caption.text ? `<div class="caption">${content.caption.text}</div>` : ''}`;
      (async () => {
        await this.client.send({
          '@type': 'downloadFile',
          file_id: remotePhoto.photo.id,
          priority: 1,
        }).then((result) => {
          this.getFile(result.remote.id, photoId, photoHeight);
        }).catch((error) => {
          console.error(error);
        });
      })();
      return photoElement;
    }
    if (content['@type'] === 'messageDocument') {
      return '[Document]';
    }
    if (content['@type'] === 'messageSticker') {
      const { sticker } = content.sticker;
      const stickerId = `sticker-${sticker.id}`;
      const stickerElement = `<div id='${stickerId}' class='sticker'></div>`;
      (async () => {
        await this.client.send({
          '@type': 'downloadFile',
          file_id: sticker.id,
          priority: 1,
        }).then((result) => {
          this.getFile(result.remote.id, stickerId);
        }).catch((error) => {
          console.error(error);
        });
      })();
      return stickerElement;
    }
    if (content['@type'] === 'messageCall') {
      return '[Call]';
    }
    if (content['@type'] === 'messageAnimation') {
      return '[Animation]';
    }
    if (content['@type'] === 'messageSupergroupChatCreate') {
      return 'Chat was created';
    }
  }

  updateChatReadInbox(update) {
    const chat = document.getElementById(`chat-${update.chat_id}`);
    const unreadObj = chat
      ? document.getElementById(`chat-${update.chat_id}`).querySelector('.chats__item-unread')
      : null;
    if (unreadObj) {
      if (update.unread_count > 0) {
        unreadObj.innerHTML = update.unread_count;
      } else {
        unreadObj.remove();
      }
    }
  }

  addMessage(message, update) {
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
      ${this.getMessageContent(message.content)}
      <div class="messages__item-time">
        ${getTime(message.date)}
      </div>
      </div>`;
    if (!update) {
      this.messageObj.prepend(messageView);
    } else {
      this.messageObj.append(messageView);
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
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
    this.chatInfo.innerHTML = `
      <div class="chats__item">
      <div class="chats__item-avatar" style='${avatar || ''}'>
        ${!avatar ? avatarElement.innerText : ''}
      </div>
      <div class="chats__item-title">${chat.title ? chat.title : wordsList.deletedAccount}</div>
      <div class="chats__item-status">Online</div>
      </div>`;
  }

  readMessages(chatId, messages) {
    this.client.send({
      '@type': 'viewMessages',
      chat_id: chatId,
      message_ids: messages.map((item) => item.id),
      force_read: true,
    }).catch((error) => {
      console.error(error);
    });
  }

  messageList2(chat, lastMessage, getHistory) {
    const MESSAGES_LIMIT = this.LIMIT;
    const MESSAGES_OFFSET = 0;
    if (!getHistory) {
      this.messageObj.innerHTML = '';
      this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
      this.chat = chat;
      this.setChatInfo(chat);
      this.setActiveChat(chat);
    }
    (async () => {
      const response = await this.client.send({
        '@type': 'getChatHistory',
        chat_id: chat.id,
        from_message_id: lastMessage.id,
        offset: MESSAGES_OFFSET,
        limit: MESSAGES_LIMIT,
        only_local: false,
      }).catch((error) => {
        console.error(error);
      });
      const messagesArray = response.messages;
      this.lastMessage = messagesArray[messagesArray.length - 1];
      if (getHistory) {
        this.messageForScroll = messagesArray[0].id;
      }
      if (!getHistory) {
        this.addMessage(lastMessage);
        this.readMessages(chat.id, [lastMessage]);
        this.readMessages(chat.id, messagesArray);
      }
      messagesArray.forEach((item) => {
        this.addMessage(item);
      });
      this.client.send({
        '@type': 'readAllChatMentions',
        chat_id: chat.id,
      }).catch((error) => {
        console.error(error);
      });
      if (!getHistory) {
        setTimeout(() => {
          this.messagesScroll.scrollTop = this.messagesScroll.scrollHeight;
        }, 50);
      } else {
        this.messagesScroll.scrollTop = document.getElementById(`message-${this.messageForScroll}`).offsetTop;
      }
    })();
    storage.setObject('chat', chat);
  }

  addChat(chatId, isUpdate) {
    (async () => {
      const response = await this.client.send({
        '@type': 'getChat',
        chat_id: chatId,
      }).catch((error) => {
        console.error(error);
      });
      const chatPhotoId = `avatar-${chatId}`;
      const chatView = document.createElement('div');
      chatView.className = 'chats__item';
      chatView.id = `chat-${chatId}`;
      chatView.innerHTML = `
        <div id='${chatPhotoId}' class="chats__item-avatar"></div>
        <div class="chats__item-title">${response.title ? response.title : wordsList.deletedAccount}</div>
        <div class="chats__item-last">${this.getChatContent(response.last_message.content)}</div>
        <div class="chats__item-time">
            ${transformDate(response.last_message.date)}
        </div>
        ${response.unread_count > 0 ? `<div class="chats__item-unread">${response.unread_count}</div>` : ''}`;
      chatView.addEventListener('click', () => this.messageList(response, response.last_message, false));
      if (!isUpdate) {
        this.chatsObj.append(chatView);
        this.lastChatId = response.id;
        this.lastChatOrder = response.order;
      } else {
        const chatElement = document.getElementById(`chat-${chatId}`);
        if (chatElement) {
          this.chatsObj.removeChild(chatElement);
        }
        this.chatsObj.prepend(chatView);
      }
      if (response.photo) {
        await this.client.send({
          '@type': 'downloadFile',
          file_id: response.photo.small.id,
          priority: 1,
        }).then((result) => {
          this.getFile(result.remote.id, chatPhotoId, true);
        }).catch((error) => {
          console.error(error);
        });
      } else if (response.title) {
        const titleArray = response.title.split(' ');
        document.getElementById(chatPhotoId).innerText = titleArray.length === 1
          ? titleArray[0].split('')[0]
          : titleArray[0].split('')[0] + titleArray[1].split('')[0];
      }
    })();
  }

  chatList(CHATS_OFFSET_ID, CHATS_OFFSET_ORDER, UpdateMessages) {
    const CHATS_LIMIT = this.LIMIT;
    this.chatsObj = document.getElementById('chats');
    this.client.send({
      '@type': 'getChats',
      offset_order: CHATS_OFFSET_ORDER,
      offset_chat_id: CHATS_OFFSET_ID,
      limit: CHATS_LIMIT,
    }).then((result) => {
      if (result.chat_ids.length > 0) {
        result.chat_ids.forEach((item) => {
          this.addChat(item, false);
        });
      } else {
        const chatsInfo = document.createElement('div');
        chatsInfo.innerHTML = 'Chats are not found';
        chatsInfo.style.textAlign = 'center';
        this.chatsObj.prepend(chatsInfo);
      }
      if (UpdateMessages) {
        const chatStorage = storage.getObject('chat');
        if (chatStorage) {
          (async () => {
            const chat = await this.client.send({
              '@type': 'getChat',
              chat_id: chatStorage.id,
            });
            this.messageList(chat, chat.last_message, false);
          })();
        } else if (result.chat_ids.length > 0) {
          (async () => {
            const chat = await this.client.send({
              '@type': 'getChat',
              chat_id: result.chat_ids[0],
            });
            this.messageList(chat, chat.last_message, false);
          })();
        } else {
          const messagesInfo = document.createElement('div');
          messagesInfo.innerHTML = 'There are no messages...';
          messagesInfo.style.textAlign = 'center';
          messagesInfo.style.paddingTop = '20px';
          messagesInfo.style.fontSize = '24px';
          messagesInfo.style.opacity = '0.5';
          const chatInfo = document.createElement('div');
          chatInfo.innerHTML = 'Please choose the chat';
          chatInfo.style.padding = '20px';
          chatInfo.style.fontSize = '18px';
          chatInfo.style.opacity = '0.5';
          this.messageObj.prepend(messagesInfo);
          this.chatInfo.prepend(chatInfo);
        }
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  connectDB(f) {
    const request = indexedDB.open('tdlib', 1);
    request.onerror = function (err) {
      console.error(err);
    };
    request.onsuccess = function () {
      f(request.result);
    };
  }

  getFile(fileId, fileOdjId, photoHeight) {
    this.connectDB((db) => {
      const request = db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs').get(fileId);
      request.onerror = (e) => console.error(e);
      request.onsuccess = () => {
        const imgFile = request.result ? request.result : -1;
        const URL = window.URL || window.webkitURL;
        if (imgFile !== -1) {
          const imgURL = URL.createObjectURL(imgFile);
          const imgElement = document.getElementById(fileOdjId);
          imgElement.style.backgroundImage = `url(${imgURL})`;
          if (photoHeight) {
            imgElement.style.paddingTop = `${photoHeight}%`;
          }
        } else {
          setTimeout(() => this.getFile(fileId, fileOdjId), 500);
        }
      };
    });
  }

  render() {
    // this.messagesScroll = document.getElementById('messagesScroll');
    // this.chatInfo = document.getElementById('chatInfo');
    // this.chatsScroll = document.getElementById('chatsScroll');
    // this.messageObj = document.getElementById('messages');
    // this.messagesScroll.onscroll = () => this.scrollMessages(this.messagesScroll);
    // this.chatsScroll.onscroll = () => this.scrollChats(this.chatsScroll);
    // this.chatList(0, '9223372036854775807', true);

    this.chatList = new ChatList(this.setActiveChat, this.userAuth);
    this.messageList = new MessageList();
    this.chatList.init();
    this.messageList.init();
    this.api.subscribe(this.userAuth.id, (update) => this.onUpdate(update));
    // this.client.onUpdate = (update) => this.onUpdate(update);
  }
}
export default Messenger;
