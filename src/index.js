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
import Registration from 'modules/Registration';

class App extends EventEmitter{
  constructor() {
    super();
    this.client = {};
    this.router = {};
    this.state = {
      phoneNumber: ''
    };
    this.isAuth = storage.get('isAuth');
  }
  onUpdate(update) {
    if(update['@type'] === 'updateAuthorizationState') {
      if(update.authorization_state['@type'] === 'authorizationStateWaitTdlibParameters') {
        this.client.send({
          '@type': 'setTdlibParameters',
          parameters: apiConfig,
        })
      }
      if(update.authorization_state['@type'] === 'authorizationStateWaitEncryptionKey') {
        this.client.send({
          '@type': 'checkDatabaseEncryptionKey',
        })
      }
      if(update.authorization_state['@type'] === 'authorizationStateWaitPhoneNumber') {
        const login = new Login(this.client, this.state);
        login.render();
        this.closeLoader(loader)
      }
      if(update.authorization_state['@type'] === 'authorizationStateWaitCode') {
        this.router.goToRoute('confirm.html', () => {
          const confirm = new Confirm(this.client, this.state);
          confirm.render();
        });
      }
      if(update.authorization_state['@type'] === 'authorizationStateWaitRegistration') {
        this.router.goToRoute('registration.html', () => {
          const registration = new Registration(this.client, this.state);
          registration.render();
        });
      }
      if(update.authorization_state['@type'] === 'authorizationStateWaitPassword') {
        this.router.goToRoute('password.html', () => {
          const password = new Password(this.client, this.state);
          password.render();
        });
      }
      if(update.authorization_state['@type'] === 'authorizationStateReady') {
        this.router.goToRoute('im.html', () => {
          const messenger = new Messenger(this.client);
          messenger.render();
          this.closeLoader(loader)
        });
        storage.set('isAuth', true);
      }

    }
  }
  closeLoader(loader) {
    loader.style.visibility = 'hidden';
    loader.style.opacity = '0';
  }
  init() {
    const loader = document.getElementById('loader');
    setTimeout(() => this.closeLoader(loader), 10000);
    this.router = new Router([
      new Route('login', 'login.html', !this.isAuth),
      new Route('confirm', 'confirm.html'),
      new Route('registration', 'registration.html'),
      new Route('password', 'password.html'),
      new Route('im', 'im.html', this.isAuth),
    ]);
    this.client = new TdClient(TdClientOptions);
    this.client.onUpdate = (update) => this.emit('update', update);
    this.addListener('update', this.onUpdate);
  }
}

(function () {
  const app = new App();
  app.init();
}());
