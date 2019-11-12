import { apiConfig, TdClientOptions } from 'config/api';
import * as storage from 'utils/storage';
import {EventEmitter} from 'events';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/loader.scss';

import Messenger from 'modules/Messenger';
import Login from 'modules/Login';
import Confirm from 'modules/Confirm';
import Password from 'modules/Password';

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
    if(update['@type'] == 'updateAuthorizationState') {
      // console.log('updateAuthorizationState', update);
      if(update.authorization_state['@type'] == 'authorizationStateWaitCode') {
        console.log('authorizationStateWaitCode', update);
        this.router.goToRoute('confirm.html', () => {
          const confirm = new Confirm(this.client, this.state);
          confirm.render();
        });
      }
      if(update.authorization_state['@type'] == 'authorizationStateWaitRegistration') {
        console.log('authorizationStateWaitRegistration', update);
      }
      if(update.authorization_state['@type'] == 'authorizationStateWaitPassword') {
        console.log('authorizationStateWaitPassword', update);
        this.router.goToRoute('password.html', () => {
          const password = new Password(this.client, this.state);
          password.render();
        });
      }
      if(update.authorization_state['@type'] == 'authorizationStateReady') {
        this.router.goToRoute('im.html', () => {
          const messenger = new Messenger(this.client);
          messenger.render();
        });
      }
    }
  }
  closeLoader(loader) {
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
  }
  init() {
    const loader = document.getElementById('loader');
    setTimeout(() => this.closeLoader(loader), 2000);
    const isAuth = storage.get('dc2_auth_key');
    this.router = new Router([
      new Route('login', 'login.html', !isAuth),
      new Route('confirm', 'confirm.html'),
      new Route('registration', 'registration.html'),
      new Route('password', 'password.html'),
      new Route('im', 'im.html', isAuth),
    ]);
    this.client = new TdClient(TdClientOptions);
    this.client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig,
    }).finally(() => {
      if(isAuth) {
        const messenger = new Messenger(this.client);
        messenger.render();
      } else {
        const login = new Login(this.client, this.state);
        login.render();
      }
      this.closeLoader(loader)
    });
    this.client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });
    this.client.onUpdate = (update) => this.emit('update', update);
    this.addListener('update', this.onUpdate);
  }
}

(function () {
  const app = new App();
  app.init();
}());
