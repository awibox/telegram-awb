import { apiConfig, TdClientOptions } from 'config/api';
import { transformDate } from 'utils';
import {EventEmitter} from 'events';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/login.scss';
import 'styles/confirm.scss';
import 'styles/im.scss';

class App extends EventEmitter{
  constructor() {
    super();
    this.client = {};
    this.router = {};
    this.state = {
      phoneNumber: ''
    }
  }
  onUpdate(update) {
    console.log('update[\'@type\']', update['@type'])
  }
  init() {
    this.router = new Router([
      new Route('login', 'login.html', true),
      new Route('confirm', 'confirm.html'),
      new Route('im', 'im.html'),
    ]);
    this.client = new TdClient(TdClientOptions);
    this.client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig,
    }).finally(() => {
      console.log('Loaded imPage')
      this.imPage()
    });
    this.client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });
    this.client.onUpdate = (update) => this.emit('update', update);
    this.addListener('update', this.onUpdate);

    setTimeout(this.loginPage, 100);
  }

  loginPage() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');
    phoneNumberSendButton.addEventListener('click', function () {
      this.client.send({
        '@type': 'setAuthenticationPhoneNumber',
        phone_number: phoneNumberInput.value,
      }).then(result => {
        this.state.phoneNumber = phoneNumberInput.value;
        this.router.goToRoute('confirm.html');
        setTimeout(this.confirmPage, 100);
      }).catch(error => {
        console.error(error);
      });
      //
    });
    phoneNumberInput.addEventListener('keyup', function () {
      console.log('phoneNumberInput', phoneNumberInput.value);
      if (phoneNumberInput.value.length > 9) {

      }
    });
  }
  confirmPage() {
    const confirmTitle = document.getElementById('confirmPhone');
    const confirmCodeInput = document.getElementById('confirmCode');
    confirmTitle.innerText = this.state.phoneNumber;
    confirmCodeInput.addEventListener('keyup', function () {
      if (confirmCodeInput.value.length == 5) {
        console.log('SENDD!!!', confirmCodeInput.value);
        this.client.send({
          '@type': 'checkAuthenticationCode',
          code: confirmCodeInput.value,
        }).then(result => {
          console.log('result', result);
        }).catch(error => {
          console.error(error);
        });
      }
    });
  }
  imPage() {
    const chatsObj = document.getElementById('chats');
    const newChats = [];
    let chats = [];
    this.client.send({
      '@type': 'getChats',
      offset_order: '9223372036854775807',
      offset_chat_id: 0,
      limit: 30,
    }).then(result => {
      console.log('imPage', result);
      result.chat_ids.forEach((item) => {
        (async () => {
          const response = await this.client.send({
            '@type': 'getChat',
            chat_id: item,
          }).finally(() => {

          }).catch(error => {
            console.error(error);
          });
          console.log('response', response);
          (async () => {
            const photo = await this.client.send({
              '@type': 'getRemoteFile',
              remote_file_id: response.photo.small.remote.id
            }).finally(() => {
              console.log('end!');
            }).catch(error => {
              console.error(error);
            });
            console.log('response.photo', photo);
          })();
          const isOutgoing = response.last_message.is_outgoing;
          const containsUnreadMention = response.last_message.contains_unread_mention;
          newChats.push(`
          <div class="chats__item">
            <div class="chats__item-avatar"></div>
            <div class="chats__item-title">${response.title}</div>
            <div class="chats__item-last">${response.last_message.content.text.text}</div>
            <div class="chats__item-time">
                ${isOutgoing && !containsUnreadMention ? '+' : ''}
                ${isOutgoing && containsUnreadMention ? '-' : ''}
                ${transformDate(response.last_message.date)}
            </div>
            ${response.unread_count > 0 ? `<div class="chats__item-unread">${response.unread_count}</div>` : ''}
          </div>
          `);
        })();
      });
      console.log('newChats', newChats);
      setTimeout(() => chatsObj.innerHTML = newChats.join(''), 200);

      (async () => {
        const response = await this.client.send({
          '@type': 'getChatHistory',
          chat_id: result.chat_ids[1],
          offset: 0,
          limit: 5,
        }).finally(() => {
          console.log('end!');
        }).catch(error => {
          console.error(error);
        });
        console.log('response.messages', response.messages);
      })();

    }).catch(error => {
      console.error(error);
    });
  }
}


(function () {
  const app = new App();
  app.init();
}());
