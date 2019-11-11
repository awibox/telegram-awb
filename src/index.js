import { apiConfig, TdClientOptions } from 'config/api';
import * as storage from 'utils/storage';
import {EventEmitter} from 'events';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/confirm.scss';

import Messenger from 'modules/Messenger';
import Login from 'modules/Login';
import Confirm from 'modules/Confirm';

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
        console.log('authorizationStateWaitRegistration', update)
      }
      if(update.authorization_state['@type'] == 'authorizationStateWaitPassword') {
        console.log('authorizationStateWaitPassword', update)
      }
      if(update.authorization_state['@type'] == 'authorizationStateReady') {
        console.log('authorizationStateReady', update)
      }
    }
  }
  init() {
    const isAuth = storage.get('dc2_auth_key');
    this.router = new Router([
      new Route('login', 'login.html', !isAuth),
      new Route('confirm', 'confirm.html'),
      new Route('im', 'im.html', isAuth),
    ]);
    this.router.goToRoute('login.html');
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
