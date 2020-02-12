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
    this.lastReadId = 0;
    this.currentChatType = '';
  }

  /**
   * BASE FUNCTIONS
   */

  placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
      && typeof document.createRange != "undefined") {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      const textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
    }
  }

  getTextForSendInput(element) {
    let firstTag = element.firstChild.nodeName;
    let keyTag = new RegExp(
      firstTag === '#text' ? '<br' : '</' + firstTag,
      'i'
    );
    let tmp = document.createElement('div');
    tmp.innerHTML = element.innerHTML
      .replace(/<[^>]+>/g, (m, i) => (keyTag.test(m) ? '{ß®}' : ''))
      .replace(/{ß®}$/, '');
    return tmp.innerText.replace(/{ß®}/g, '\r\n');
  }

  sendMessage() {
    const self = this;
    if(this.currentChatId) {
      if(document.getElementById('sendInput').innerHTML) {
        this.api.sendMessage(this.currentChatId, this.getTextForSendInput(document.getElementById('sendInput'))).then(function(response) {
          document.getElementById('sendInput').innerHTML = '';
          self.onUpdate(response);
        });
      }
    }
  }

  onKeyDownInput(e) {
    console.log(e);
    if(e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      this.sendMessage();
    }
    if(e.key === 'Enter' && e.ctrlKey) {
      const input = document.getElementById('sendInput');
      e.preventDefault();
      input.innerHTML = input.innerHTML + '<br/><br/>';
      this.placeCaretAtEnd(input);
    }
  }

  setChatInfo(chat) {
    const avatarId = `avatar-${chat.id}`;
    const avatarElement = document.getElementById(avatarId);
    const avatar = avatarElement.cloneNode();
    avatar.innerHTML = avatarElement.innerHTML;
    document.getElementById('chatInfo').innerHTML = `
    <div class="im__info-container">
      <div id="chatInfoItem" class="chat-panel__item">
      <div class="chat-panel__item-title">
        <div class="chat-panel__item-title-text">${chat.title ? chat.title : ''}</div>
      </div>
      <div class="chat-panel__item-status">Online</div>
      </div>
      ${chat.type === 'channel' || chat.type === 'chat' ? `
        ${chat.mute ? `
        <div id="chatMute" class="chat-panel__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M11,20 L13,20 C13.5522847,20 14,20.4477153 14,21 C14,21.5128358 13.6139598,21.9355072 13.1166211,21.9932723 L13,22 L11,22 C10.4477153,22 10,21.5522847 10,21 C10,20.4871642 10.3860402,20.0644928 10.8833789,20.0067277 L11,20 L13,20 L11,20 Z M12,2 C15.8659932,2 19,5.13400675 19,9 L19,14.6972244 L20.8320503,17.4452998 C21.2750868,18.1098545 20.7986954,19 20,19 L4,19 C3.20130462,19 2.72491322,18.1098545 3.16794971,17.4452998 L5,14.6972244 L5,9 C5,5.13400675 8.13400675,2 12,2 Z M12,4 C9.23857625,4 7,6.23857625 7,9 L7,14.6972244 C7,15.0920743 6.88312395,15.4780897 6.66410059,15.8066248 L5.86851709,17 L18.1314829,17 L17.3358994,15.8066248 C17.1168761,15.4780897 17,15.0920743 17,14.6972244 L17,9 C17,6.23857625 14.7614237,4 12,4 Z"/>
            </g>
          </svg>
        </div>
        ` : `
        <div id="chatMute" class="chat-panel__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M11,20 L13,20 C13.5522847,20 14,20.4477153 14,21 C14,21.5128358 13.6139598,21.9355072 13.1166211,21.9932723 L13,22 L11,22 C10.4477153,22 10,21.5522847 10,21 C10,20.4871642 10.3860402,20.0644928 10.8833789,20.0067277 L11,20 L13,20 L11,20 Z M3.30352462,2.28241931 C3.6693482,1.92735525 4.23692991,1.908094 4.62462533,2.21893936 L4.71758069,2.30352462 L21.2175807,19.3035246 C21.6022334,19.6998335 21.5927842,20.332928 21.1964754,20.7175807 C20.8306518,21.0726447 20.2630701,21.091906 19.8753747,20.7810606 L19.7824193,20.6964754 L18.127874,18.9919007 L18,18.9999993 L4,18.9999993 C3.23933773,18.9999993 2.77101468,18.1926118 3.11084891,17.5416503 L3.16794971,17.4452998 L5,14.6972244 L5,8.9999993 C5,7.98873702 5.21529462,7.00715088 5.62359521,6.10821117 L3.28241931,3.69647538 C2.89776658,3.3001665 2.90721575,2.66707204 3.30352462,2.28241931 Z M7.00817933,8.71121787 L7,9 L7,14.6972244 C7,15.0356672 6.91413188,15.3676193 6.75167088,15.6624466 L6.66410059,15.8066248 L5.86851709,17 L16.1953186,17 L7.16961011,7.7028948 C7.08210009,8.02986218 7.02771758,8.36725335 7.00817933,8.71121787 Z M12,2 C15.7854517,2 18.8690987,5.00478338 18.995941,8.75935025 L19,9 L19,12 C19,12.5522847 18.5522847,13 18,13 C17.4871642,13 17.0644928,12.6139598 17.0067277,12.1166211 L17,12 L17,9 C17,6.23857625 14.7614237,4 12,4 C11.3902636,4 10.7970241,4.10872043 10.239851,4.31831953 C9.72293204,4.51277572 9.14624852,4.25136798 8.95179232,3.734449 C8.75733613,3.21753002 9.01874387,2.6408465 9.53566285,2.4463903 C10.3171048,2.15242503 11.1488212,2 12,2 Z"/>
            </g>
          </svg>
        </div>`}` : ''}
      <div id="chatSearch" class="chat-panel__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" fill-rule="evenodd">
            <polygon points="0 0 24 0 24 24 0 24"/>
            <path fill="#707579" fill-rule="nonzero" d="M9.5,3 C13.0898509,3 16,5.91014913 16,9.5 C16,10.9337106 15.5358211,12.2590065 14.7495478,13.3338028 L19.7071068,18.2928932 C20.0976311,18.6834175 20.0976311,19.3165825 19.7071068,19.7071068 C19.3466228,20.0675907 18.7793918,20.0953203 18.3871006,19.7902954 L18.2928932,19.7071068 L13.3338028,14.7495478 C12.2590065,15.5358211 10.9337106,16 9.5,16 C5.91014913,16 3,13.0898509 3,9.5 C3,5.91014913 5.91014913,3 9.5,3 Z M9.5,5 C7.01471863,5 5,7.01471863 5,9.5 C5,11.9852814 7.01471863,14 9.5,14 C11.9852814,14 14,11.9852814 14,9.5 C14,7.01471863 11.9852814,5 9.5,5 Z"/>
          </g>
        </svg>
      </div>
      <div id="chatMore" class="chat-panel__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" fill-rule="evenodd">
            <polygon points="0 0 24 0 24 24 0 24"/>
            <path fill="#707579" fill-rule="nonzero" d="M12,16 C13.1045695,16 14,16.8954305 14,18 C14,19.1045695 13.1045695,20 12,20 C10.8954305,20 10,19.1045695 10,18 C10,16.8954305 10.8954305,16 12,16 Z M12,10 C13.1045695,10 14,10.8954305 14,12 C14,13.1045695 13.1045695,14 12,14 C10.8954305,14 10,13.1045695 10,12 C10,10.8954305 10.8954305,10 12,10 Z M12,4 C13.1045695,4 14,4.8954305 14,6 C14,7.1045695 13.1045695,8 12,8 C10.8954305,8 10,7.1045695 10,6 C10,4.8954305 10.8954305,4 12,4 Z"/>
          </g>
        </svg>
      </div>
    </div>`;
    document.getElementById('chatInfoItem').prepend(avatar);
  }

  setActiveChat(chat) {
    console.log('setActiveChat', chat);
    if (document.querySelector('.chats__item_active')) {
      document.querySelector('.chats__item_active').classList.remove('chats__item_active');
    }
    if (document.getElementById('messages')) {
      document.getElementById('messages').innerHTML = '';
    }
    this.messagesWereLoaded = true;
    const chatElement = document.getElementById(`chat-${chat.id}`);
    chatElement.classList.add('chats__item_active');
    const params = {
      id: chat.type === 'user' ? chat.id : -chat.id,
      type: chat.type
    };
    this.currentChatId = params.id;
    this.currentChatType = chat.type;
    this.lastReadId = chat.lastReadId;
    this.loadMessages(params, true);
    if(chat.allowSend) {
      document.getElementById('sendMessage').style.display = 'flex';
    } else {
      document.getElementById('sendMessage').style.display = 'none';
    }
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

  createLineBreaks(arr) {
    if(arr.indexOf('\n') > 0) {
      arr[arr.indexOf('\n')] = '<br/>';
      this.createLineBreaks(arr);
    }
  }

  getMessageContent(item, message) {
    console.log('getMessageContent', item);
    if(item.message) {
      const textMessageArr = item.message.split('');
      this.createLineBreaks(textMessageArr);
      if(item.entities) {
        item.entities.forEach((entity) => {
          const startChart = entity.offset;
          const endChart = entity.offset + entity.length - 1;
          switch (entity['_']) {
            case 'messageEntityBold' : {
              textMessageArr[startChart] = '<b>' + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</b>';
              break;
            }
            case 'messageEntityItalic' : {
              textMessageArr[startChart] = '<i>' + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</i>';
              break;
            }
            case 'messageEntityTextUrl' : {
              textMessageArr[startChart] = `<a href="${entity.url}" target="_blank">` + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</a>';
              break;
            }
            case 'messageEntityMention' : {
              const linkContent = item.message.substring(startChart, endChart + 1);
              textMessageArr[startChart] = `<a href="?mention=${linkContent}">` + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</a>';
              break;
            }
            case 'messageEntityHashtag' : {
              const linkContent = item.message.substring(startChart, endChart + 1);
              textMessageArr[startChart] = `<a href="?hash=${linkContent}">` + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</a>';
              break;
            }
            case 'messageEntityUrl' : {
              const linkContent = item.message.substring(startChart, endChart + 1);
              textMessageArr[startChart] = `<a href="${linkContent}" target="_blank">` + textMessageArr[startChart];
              textMessageArr[endChart] = textMessageArr[endChart] + '</a>';
              break;
            }
          }
        });

      }
      return `<div class="messages__item-text">
                <span class="messages__item-text-content">${textMessageArr.join('')}</span>
                <span class="messages__item-time">
                  ${message.date}
                  ${message.is_outgoing ? `${this.lastReadId >= item.id ? `<div class="arrow-read"></div>` : '<div class="arrow"></div>'}` : ''}
                </span>
              </div>`;
    }
    if(item.media) {
      switch(item.media['_']) {
        case 'messageMediaPhoto' : {
          this.api.downloadPhoto(item.media.photo, () => {}, false, 1).then((response) => {
            const blob = new Blob(response.bytes, {type: 'octet/stream'});
            document.getElementById(`photo-${item.id}`).style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
          }).catch((e) => (e));
          let captionText = '';
          if(item.media.caption) {
            const captionArr = item.media.caption.split('');
            this.createLineBreaks(captionArr);
            captionText = captionArr.join('');
          }
          const sizeObject = item.media.photo.sizes[item.media.photo.sizes.length - 2];
          const proportionStyle = `padding-top: ${(sizeObject.h/sizeObject.w)*100}%`;
          if(captionText) {
            return `<div class="messages__item-text messages__item-text_photo-cap">
                      <div id="photo-${item.id}" style="${proportionStyle}" class="image-container"></div>
                      ${captionText ? `<span class="messages__item-text-content" style="max-width: ${sizeObject.w}px">${captionText}</span>` : '' }
                      <span class="messages__item-time">
                        ${message.date}
                        ${message.is_outgoing ? `${this.lastReadId >= item.id ? `<div class="arrow-read"></div>` : '<div class="arrow"></div>'}` : ''}
                      </span>
                    </div>`;
          } else {
            return `<div class="messages__item-text messages__item-text_photo">
                      <div id="photo-${item.id}" style="${proportionStyle}" class="image-container"></div>
                      <span class="messages__item-time">
                        ${message.date}
                        ${message.is_outgoing ? `${this.lastReadId >= item.id ? `<div class="arrow-read arrow-read_white"></div>` : '<div class="arrow arrow_white"></div>'}` : ''}
                      </span>
                    </div>`;
          }
        }
        case 'messageMediaDocument' : {
          if(!!item.media.document.attributes[1]) {
            if(item.media.document.attributes[1]['_'] === 'documentAttributeSticker') {
              let base64;
              if(!!item.media.document.thumb.bytes) {
                base64 = `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, item.media.document.thumb.bytes))}`;
              } else {
                const inputLocation = item.media.document.thumb.location;
                inputLocation._ = 'inputFileLocation';
                this.api.invokeApi('upload.getFile', {
                  location: inputLocation,
                  offset: 0,
                  limit: 1024 * 1024,
                }).then((response) => {
                  console.log('response', response);
                  const base64 = `data:image/jpeg;base64,${btoa(String.fromCharCode.apply(null, response.bytes))}`;
                  document.getElementById(`sticker-${item.id}`).style.backgroundImage = `url(${base64})`;
                });
              }
              return `
                <div id="sticker-${item.id}" class="sticker-container" 
                style="background-image: url(${base64}); width: ${item.media.document.thumb.w}px; height: ${item.media.document.thumb.h}px">
                  <span class="messages__item-time">
                    ${message.date}
                    ${message.is_outgoing ? `${this.lastReadId >= item.id ? `<div class="arrow-read arrow-read_white"></div>` : '<div class="arrow arrow_white"></div>'}` : ''}
                  </span>
                </div>`;
            }
          }
          if(!!item.media.document.attributes[0]) {
            if(item.media.document.attributes[0]['_'] === 'documentAttributeFilename') {
              const fileName = item.media.document.attributes[0].file_name;
              let fileSize = {
                size: item.media.document.size,
                type: 'B'
              };
              if(fileSize.size > 10240) {
                fileSize.size = (fileSize.size / 1024).toFixed(2);
                fileSize.type = 'Kb';
              }
              if(fileSize.size > 1024) {
                fileSize.size = (fileSize.size / 1024).toFixed(2);
                fileSize.type = 'Mb';
              }
              if(fileSize.size > 1024) {
                fileSize.size = (fileSize.size / 1024).toFixed(2);
                fileSize.type = 'Gb';
              }
              return `<div class="messages__item-text">
                <span class="messages__item-text-content">
                  <div id="file-${item.id}" class="file">
                    <div class="file__icon"></div>
                    <div>
                      <div class="file__title">${fileName}</div> 
                      <div class="file__size">${fileSize.size}${fileSize.type}</div> 
                    </div>
                  </div>
                </span>
                <span class="messages__item-time" style="margin-top: -18px">
                  ${message.date}
                  ${message.is_outgoing ? `${this.lastReadId >= item.id ? `<div class="arrow-read"></div>` : '<div class="arrow"></div>'}` : ''}
                </span>
              </div>`;
            }
          }
        }
      }
    }
  }

  downloadFile(doc) {
    console.log('downloadFile', doc);
  }

  addMessage(item, update = false, firstLoad = false) {
    const message = new Object({
      id: item.id,
      timestamp: item.date,
      date: getTime(item.date),
      is_outgoing: item.from_id === this.userAuth.id,
    });
    const messageNode = this.getMessageContent(item, message);
    const messageView = document.createElement('div');
    messageView.className = `messages__item ${item.arrow ? 'messages__item_arrow' : ''} ${this.currentChatType === 'channel' ? 'messages__item_channel' : ''}`;
    messageView.id = `message-${message.id}`;
    const isOutgoing = message.is_outgoing;
    if (isOutgoing) {
      messageView.className = `messages__item messages__item_out ${item.arrow ? 'messages__item_arrow' : ''} ${this.currentChatType === 'channel' ? 'messages__item_channel' : ''}`;
    }
    messageView.innerHTML = `
    <div class="messages__item-avatar"></div>
    ${messageNode}`;
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

  loadMessages(params, firstLoad = false) {
    if(firstLoad) {
      this.offset = 0;
    }
    params.take = this.limit;
    this.params = params;
    this.api.getHistory(params).then((response) => {
      const { messages } = response;
      console.log('getMEssage', messages)
      if(messages.length < this.limit) {
        this.messagesWereLoaded = true;
      }
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
        this.addMessage(item, false, firstLoad);
      });
      if (firstLoad) {
          this.messagesWereLoaded = false;
          const messagesScroll = document.getElementById('messagesScroll');
          messagesScroll.scrollTop = messagesScroll.scrollHeight;
      }
      this.offset = this.offset + this.limit;
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
      console.log('getChats', response)
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
    const readMaxId = item.read_outbox_max_id >= item.read_inbox_max_id ? item.read_outbox_max_id : item.read_inbox_max_id;
    const chat = new Object({
      arrow: '',
      arrowClass: readMaxId >= item.top_message ? 'arrow-read' : 'arrow',
      allowSend: false,
      lastReadId: readMaxId,
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
      myChat: false,
      unread_count: item.unread_count,
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
          chat.allowSend = true;
          if(user.pFlags.self) {
            chat.myChat = true;
            chat.title = 'Saved Messages';
          }
          if(user.pFlags.deleted) {
            chat.title = 'Deleted Account';
          }
        }
      });
    } else {
      chats.forEach((channel) => {
        if (item.peer.channel_id === channel.id || item.peer.chat_id === channel.id) {
          chat.id = channel.id;
          chat.title = channel.title;
          chat.access_hash = channel.access_hash ? channel.access_hash : '';
          chat.avatar = channel.photo ? channel.photo.photo_small : '';
          chat.type = !!item.peer.channel_id ? 'channel' : 'chat';
          if(channel.pFlags.deactivated) {
            chat.id = 0;
          }
          if(channel.pFlags.creator || channel.pFlags.democracy) {
            chat.allowSend = true;
          }
        }
      });
    }
    if (!!document.getElementById(`avatar-${chat.id}`)) {
      chat.avatarNode = document.getElementById(`avatar-${chat.id}`).cloneNode();
      chat.avatarNode.innerHTML = document.getElementById(`avatar-${chat.id}`).innerHTML;
    }
    if(chat.id) {
      this.addChat(chat, update);
      if(!chat.myChat) {
        if (!update || !!document.getElementById(`avatar-${chat.id}`)) {
          if (chat.avatar) {
            const inputLocation = chat.avatar;
            inputLocation._ = 'inputFileLocation';
            // debugger;
            this.api.invokeApi('upload.getFile', {
              location: inputLocation,
              offset: 0,
              limit: 1024 * 1024,
            }, {dcID: 2, createNetworker: true}).then((response) => {
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
          break;
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
    ${chat.avatarNode ? '' : `<div id='${chatPhotoId}' class="chats__item-avatar${chat.myChat ? ' chats__item-avatar_saved' : ''}"></div>`}
    <div class="chats__item-title">
        <div class="chats__item-title-text" title="${chat.title}">${chat.title ? chat.title : ''}</div>
        ${chat.mute ? `<div class="chats__item-mute-icon"></div>` : ''}
    </div>
    <div class="chats__item-last">${chat.arrow ? '<span>You:</span> ' : ''}${this.getMessage(chat.message)}</div>
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
      if (chat.pinned) {
        if(document.getElementById(`chat-${chat.id}`)) {
          document.getElementById(`chat-${chat.id}`).innerHTML = chatView.innerHTML;
        } else {
          document.getElementById('pinnedChats').prepend(chatView);
        }
      } else {
        this.deleteChat(chat.id);
        document.getElementById('chats').prepend(chatView);
      }
    } else {
      if (chat.pinned) {
        document.getElementById('pinnedChats').append(chatView);
      } else {
        document.getElementById('chats').append(chatView);
      }
    }
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
      // case "updateEditChannelMessage" : {
      //   const { to_id } = update.message;
      //   this.getChats(0, to_id.channel_id);
      //   if(-this.currentChatId === to_id.channel_id) {
      //     this.addMessage(update.message, true);
      //   }
      //   break;
      // }
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
    document.getElementById('sendInput').addEventListener('keydown', (e) => this.onKeyDownInput(e))
  }
}
export default Messenger;
