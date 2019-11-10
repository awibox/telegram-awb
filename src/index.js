import { apiConfig, TdClientOptions } from 'config/api';
import { transformDate } from 'utils';
import {EventEmitter} from 'events';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/login.scss';
import 'styles/confirm.scss';


import Messenger from 'modules/Messenger'

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
    // console.log('update[\'@type\']', update['@type'])
    if(update['@type'] == 'updateChatLastMessage') {
      console.log('update', update)
    }
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
      console.log('Loaded messenger');
      const messenger = new Messenger(this.client, this.router, this.state, this.onUpdate);
      messenger.render();
    });
    this.client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });
    this.client.onUpdate = (update) => this.emit('update', update);
    this.addListener('update', this.onUpdate);

    // setTimeout(this.loginPage, 100);
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
}


(function () {
  const app = new App();
  app.init();
}());
