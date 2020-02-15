import { addClass, deleteClass, getTime, numberStabilization, transformDate } from 'utils/index';
import storage from 'utils/storage';
import 'styles/messenger.scss';
import Login from 'modules/Login';

class Messenger {
  constructor(router) {
    this.router = router;
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
    this.currentDate = new Date();
    this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July','August','September','October','November','December'];
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
    const infoPageAvatar = avatarElement.cloneNode();
    avatar.innerHTML = avatarElement.innerHTML;
    infoPageAvatar.innerHTML = avatarElement.innerHTML;
    let status;
    if(chat.type === 'user') {
      status = chat.status ? chat.status : 'service notifications';
    } else if (chat.type === 'chat') {
      status = chat.members ? `${chat.members} members` : 'chat';
    } else {
      status = 'channel';
    }
    document.getElementById('chatInfo').innerHTML = `
    <div class="im__info-container">
      <div id="chatInfoItem" class="chat-panel__item">
      <div class="chat-panel__item-title">
        <div class="chat-panel__item-title-text">${chat.title ? chat.title : ''}</div>
      </div>
      ${status ? `<div class="chat-panel__item-status">${status}</div>` : ''}
      </div>
      ${chat.type === 'channel' || chat.type === 'chat' ? `
        ${chat.mute ? `
        <div id="chatMute" class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M11,20 L13,20 C13.5522847,20 14,20.4477153 14,21 C14,21.5128358 13.6139598,21.9355072 13.1166211,21.9932723 L13,22 L11,22 C10.4477153,22 10,21.5522847 10,21 C10,20.4871642 10.3860402,20.0644928 10.8833789,20.0067277 L11,20 L13,20 L11,20 Z M12,2 C15.8659932,2 19,5.13400675 19,9 L19,14.6972244 L20.8320503,17.4452998 C21.2750868,18.1098545 20.7986954,19 20,19 L4,19 C3.20130462,19 2.72491322,18.1098545 3.16794971,17.4452998 L5,14.6972244 L5,9 C5,5.13400675 8.13400675,2 12,2 Z M12,4 C9.23857625,4 7,6.23857625 7,9 L7,14.6972244 C7,15.0920743 6.88312395,15.4780897 6.66410059,15.8066248 L5.86851709,17 L18.1314829,17 L17.3358994,15.8066248 C17.1168761,15.4780897 17,15.0920743 17,14.6972244 L17,9 C17,6.23857625 14.7614237,4 12,4 Z"/>
            </g>
          </svg>
        </div>
        ` : `
        <div id="chatMute" class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M11,20 L13,20 C13.5522847,20 14,20.4477153 14,21 C14,21.5128358 13.6139598,21.9355072 13.1166211,21.9932723 L13,22 L11,22 C10.4477153,22 10,21.5522847 10,21 C10,20.4871642 10.3860402,20.0644928 10.8833789,20.0067277 L11,20 L13,20 L11,20 Z M3.30352462,2.28241931 C3.6693482,1.92735525 4.23692991,1.908094 4.62462533,2.21893936 L4.71758069,2.30352462 L21.2175807,19.3035246 C21.6022334,19.6998335 21.5927842,20.332928 21.1964754,20.7175807 C20.8306518,21.0726447 20.2630701,21.091906 19.8753747,20.7810606 L19.7824193,20.6964754 L18.127874,18.9919007 L18,18.9999993 L4,18.9999993 C3.23933773,18.9999993 2.77101468,18.1926118 3.11084891,17.5416503 L3.16794971,17.4452998 L5,14.6972244 L5,8.9999993 C5,7.98873702 5.21529462,7.00715088 5.62359521,6.10821117 L3.28241931,3.69647538 C2.89776658,3.3001665 2.90721575,2.66707204 3.30352462,2.28241931 Z M7.00817933,8.71121787 L7,9 L7,14.6972244 C7,15.0356672 6.91413188,15.3676193 6.75167088,15.6624466 L6.66410059,15.8066248 L5.86851709,17 L16.1953186,17 L7.16961011,7.7028948 C7.08210009,8.02986218 7.02771758,8.36725335 7.00817933,8.71121787 Z M12,2 C15.7854517,2 18.8690987,5.00478338 18.995941,8.75935025 L19,9 L19,12 C19,12.5522847 18.5522847,13 18,13 C17.4871642,13 17.0644928,12.6139598 17.0067277,12.1166211 L17,12 L17,9 C17,6.23857625 14.7614237,4 12,4 C11.3902636,4 10.7970241,4.10872043 10.239851,4.31831953 C9.72293204,4.51277572 9.14624852,4.25136798 8.95179232,3.734449 C8.75733613,3.21753002 9.01874387,2.6408465 9.53566285,2.4463903 C10.3171048,2.15242503 11.1488212,2 12,2 Z"/>
            </g>
          </svg>
        </div>`}` : ''}
      <div id="chatSearch" class="icon search-icon"></div>
      <div id="chatMore" class="icon more-icon"></div>
    </div>`;
    const chatInfoItem = document.getElementById('chatInfoItem');
    const rightBar = document.getElementById('rightBar');
    const infoPage = document.getElementById('infoPageAvatar');
    const infoPageTitle = document.getElementById('infoPageTitle');
    const infoPageItems = document.getElementById('infoPageItems');
    const infoPageStatus = document.getElementById('infoPageStatus');
    chatInfoItem.prepend(avatar);
    chatInfoItem.addEventListener('click', () => {
      rightBar.className = addClass(rightBar.className, 'im__rightBar_open');
    });
    const closeRightBar = document.getElementById('closeRightBar');
    closeRightBar.addEventListener('click', () => {
      rightBar.className = deleteClass(rightBar.className, 'im__rightBar_open');
    });
    setTimeout(() => {
      infoPage.innerHTML = '';
      infoPage.prepend(infoPageAvatar);
      infoPageTitle.innerHTML = chat.title;
      infoPageStatus.innerHTML = status;
      infoPageItems.innerHTML = `
      ${chat.username ? `<div class='info-page__item'>
        <div class="info-page__item-icon"> 
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M12,1 C18.0751322,1 23,5.92486775 23,12 C23,15.2534621 21.3575416,17.4078375 19.0415827,17.5042247 C17.5448049,17.5665187 16.2418767,16.729824 15.5433162,15.3661459 C14.6550197,16.3039294 13.3958222,16.8888889 12,16.8888889 C9.29994122,16.8888889 7.11111111,14.7000588 7.11111111,12 C7.11111111,9.29994122 9.29994122,7.11111111 12,7.11111111 C13.1311057,7.11111111 14.1724943,7.49523561 15.000833,8.14015176 L15,8 C15,7.44771525 15.4477153,7 16,7 C16.5128358,7 16.9355072,7.38604019 16.9932723,7.88337887 L17,8 L17,13 C17,14.5880914 17.9057778,15.5497641 18.9584173,15.5059546 C20.0913022,15.4588053 21,14.2668872 21,12 C21,7.02943725 16.9705627,3 12,3 C7.02943725,3 3,7.02943725 3,12 C3,16.9705627 7.02943725,21 12,21 C12.7993259,21 13.583948,20.8960375 14.3403366,20.6929627 C14.8737319,20.549757 15.4222254,20.8660682 15.5654311,21.3994635 C15.7086368,21.9328588 15.3923256,22.4813523 14.8589303,22.624558 C13.9337959,22.8729377 12.9748353,23 12,23 C5.92486775,23 1,18.0751322 1,12 C1,5.92486775 5.92486775,1 12,1 Z M12,9.11111111 C10.4045107,9.11111111 9.11111111,10.4045107 9.11111111,12 C9.11111111,13.5954893 10.4045107,14.8888889 12,14.8888889 C13.5954893,14.8888889 14.8888889,13.5954893 14.8888889,12 C14.8888889,10.4045107 13.5954893,9.11111111 12,9.11111111 Z"/>
            </g>
          </svg>
        </div>
        <div class="info-page__item-content">
          ${chat.username}
          <div class="info-page__item-label">Username</div>
        </div>
    </div>
      ` : ''}
      ${chat.phone ? `<div class='info-page__item'>
        <div class="info-page__item-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fill-rule="evenodd">
              <polygon points="0 0 24 0 24 24 0 24"/>
              <path fill="#707579" fill-rule="nonzero" d="M7.23584729,12.5662193 L9.59157842,9.95106331 C10.1552393,9.38932119 10.4467339,8.55220389 10.3497484,7.70703944 L10.091414,5.46219074 C9.9242391,4.0550699 8.7398983,3 7.3255142,3 L5.78463506,3 C4.20042472,3 2.90721409,4.32400855 3.00518508,5.90554894 C3.50830004,14.0123888 9.98998589,20.491257 18.0941879,20.9948033 C19.6759108,21.0927867 21.0001332,19.7995671 21.0001332,18.2153552 L21.0001332,16.6744677 C21.013787,15.2731573 19.9556245,14.0848636 18.5502962,13.917893 L16.2834192,13.6590644 C15.4388246,13.562143 14.601708,13.8536405 14.0021558,14.453196 L11.4339669,16.7640867 C9.87568608,15.7549411 8.52871768,14.4473269 7.47401517,12.9220367 L7.23584729,12.5662193 Z M13.2949234,17.779617 L15.3784355,15.9034093 C15.5842713,15.6995067 15.8165698,15.6186166 16.0559758,15.6460896 L18.3188767,15.9044538 C18.7112475,15.951083 19.003823,16.2796389 19.0000842,16.6646639 L19,18.2153552 C19,18.6635336 18.6307181,19.0242061 18.218031,18.9986413 C16.4722141,18.8901667 14.8122275,18.4649122 13.2949234,17.779617 Z M6.220439,10.7056813 C5.53504105,9.18831553 5.10972952,7.52810348 5.00135169,5.7817795 C4.97579551,5.36922745 5.33643432,5 5.78463506,5 L7.3255142,5 C7.72533936,5 8.0576092,5.29600256 8.10495475,5.6944964 L8.36282472,7.93536896 C8.39026139,8.17446174 8.30937042,8.40676528 8.14147101,8.5746656 L6.220439,10.7056813 Z"/>
            </g>
          </svg>
        </div>
        <div class="info-page__item-content">
          +${chat.phone}
          <div class="info-page__item-label">Phone</div>
        </div>
        </div>
      ` : ''}`;
    }, 500);
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
    this.currentDate = new Date();
    this.lastReadId = chat.lastReadId;
    this.loadMessages(params, true);
    if(chat.allowSend) {
      document.getElementById('sendMessage').style.display = 'flex';
    } else {
      document.getElementById('sendMessage').style.display = 'none';
    }
    const rightBar = document.getElementById('rightBar');
    rightBar.className = deleteClass(rightBar.className, 'im__rightBar_open');
  }

  uploadFile() {
    const file = document.getElementById('sendFile').files[0];
    this.api.sendFile({
      id: this.params.id,
      type: this.params.type,
      file: file,
      caption: ''
    }).then((response) => {
      console.log('File uploaded')
    }).catch((error) => {
      console.error(error);
    })
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
          if(!!item.media.document.attributes[0] || !!item.media.document.attributes[1] || !!item.media.document.attributes[2]) {
            if(item.media.document.attributes[0]['_'] === 'documentAttributeFilename' || item.media.document.attributes[1]['_'] === 'documentAttributeFilename' || item.media.document.attributes[2]['_'] === 'documentAttributeFilename') {
              const fileName = item.media.document.attributes[0].file_name || item.media.document.attributes[1].file_name || item.media.document.attributes[2].file_name;
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
              const fileTemplate = document.createElement('div');
              fileTemplate.className = 'messages__item-text';
              fileTemplate.addEventListener('click', () => this.downloadFile(item.media.document));
              fileTemplate.innerHTML = `
                <span class="messages__item-text-content">
                  <div id="file-${item.media.document.id}" class="file">
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
                </span>`;
              return fileTemplate;
            }
          }
        }
      }
    }
  }

  downloadFile(doc) {
    this.api.downloadDocument(doc, () => {}, true).then(() => {
      document.getElementById(`file-${doc.id}`).className = 'file file_downloaded';
    })
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
    ${typeof messageNode === 'string' ? messageNode : '' }`;
    if(typeof messageNode === 'object') {
      messageView.prepend(messageNode);
    }
    if (!update) {
      const messageDate = this.getMessageDate(this.currentDate, item.date);
      if(!!messageDate) {
        const messageDateObj = document.createElement('div');
        messageDateObj.className = 'messages__date';
        messageDateObj.innerHTML = `<span>${messageDate}</span>`;
        document.getElementById('messages').prepend(messageDateObj);
      }
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

  getMessageDate(firstDate, secondDate) {
    const lastDate = new Date(firstDate);
    const currentDate = new Date(secondDate*1000);
    const newDate = new Date();
    const lastDateIso = `${numberStabilization(lastDate.getDate())}.${numberStabilization(lastDate.getMonth() + 1)}.${lastDate.getFullYear()}`;
    const currentDateIso = `${numberStabilization(currentDate.getDate())}.${numberStabilization(currentDate.getMonth() + 1)}.${currentDate.getFullYear()}`;
    const newDateIso = `${numberStabilization(newDate.getDate())}.${numberStabilization(newDate.getMonth() + 1)}.${newDate.getFullYear()}`;
    if(lastDateIso !== currentDateIso) {
      this.currentDate = currentDate;
      const newDateArray = newDateIso.split('.');
      const currentDateArray = lastDateIso.split('.');
      if(newDateArray[2] === currentDateArray[2] && newDateArray[1] === currentDateArray[1] && newDateArray[0] === currentDateArray[0]) {
        if(document.getElementById('messages').children.length) {
          return 'Today';
        } else {
          return ''
        }
      } else if (newDateArray[2] === currentDateArray[2] && newDateArray[1] === currentDateArray[1] && newDateArray[0] - currentDateArray[0] === 1) {
        return 'Yesterday';
      } else {
        return `${currentDateArray[0]} ${this.months[(currentDateArray[1] - 1)]}`
      }
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

  getStatus(status) {
    switch (status['_']) {
      case 'userStatusOffline' : {
        return `last seen ${transformDate(status.was_online)}`
      }
      case 'userStatusRecently' : {
        return 'last seen recently'
      }
      case 'userStatusOnline' : {
        return '<span>online</span>'
      }
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
      phone: '',
      status: '',
      members: '',
      username: ''
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
          chat.phone = user.phone ? user.phone : '';
          chat.username = user.username ? user.username : '';
          chat.status = user.status ? this.getStatus(user.status) : '';
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
          chat.allowSend = !!item.peer.chat_id;
          chat.members = channel.participants_count ? channel.participants_count : '';
          chat.username = channel.username ? channel.username : '';
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
    // TODO Identify users
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
    } else if(update['_'] === "rpc_result") {
      this.onUpdate(update.result);
    } else {
      self.checkUpdate(update)
    }
  }

  checkUpdate(update) {
    console.log('checkUpdate', update);
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
        self.api.subscribe(result.user.id, (update) => self.onUpdate(update));
      });
    }
    document.getElementById('chatsScroll').onscroll = () => this.scrollChats();
    document.getElementById('messagesScroll').onscroll = () => this.scrollMessages();
    document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
    document.getElementById('sendInput').addEventListener('keydown', (e) => this.onKeyDownInput(e));
    const chatsPanelDropDown = document.getElementById('chatsPanelDropDown');
    document.getElementById('chatsPanelMenu').addEventListener('click', () => {
      if(chatsPanelDropDown.style.display === 'none' || chatsPanelDropDown.style.display === '') {
        chatsPanelDropDown.style.display = 'flex';
      } else {
        chatsPanelDropDown.style.display = 'none';
      }
    });
    document.getElementById('logOut').addEventListener('click', () => {
      this.api.logOut().then((response) => {
        storage.remove('user_auth');
        this.router.goToRoute('login.html', () => {
          const login = new Login(this.router);
          login.render();
        });
      })
    });
    document.getElementById('sendFile').addEventListener('change', () => this.uploadFile());
  }
}
export default Messenger;
