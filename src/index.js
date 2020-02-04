import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import storage from 'utils/storage';
import apiConfig from 'config/api';

import Messenger from 'modules/Messenger';
import Login from 'modules/Login';
import Confirm from 'modules/Confirm';
import Password from 'modules/Password';
import Registration from 'modules/Registration';

import 'long/dist/long.js';
import 'zlibjs/bin/gunzip.min.js';
import 'rusha/rusha.min.js';
import './mtproto/js/lib/polyfill';
import './mtproto/vendor/cryptoJS/crypto.min';
import './mtproto/js/lib/config';
import './mtproto/IoC';


class App{
  constructor() {
    this.router = {};
    this.client = 'telegramApi';
    this.isAuth = !!storage.getObject('user_auth');
  }

  init() {
    console.log('telegramApi', telegramApi);
    telegramApi.setConfig(apiConfig);
    console.log('FSDFSDFDSFDFDSFDSF');
    this.router = new Router([
      new Route('login', 'login.html'),
      new Route('confirm', 'confirm.html'),
      new Route('registration', 'registration.html'),
      new Route('password', 'password.html'),
      new Route('im', 'im.html'),
    ]);
    const self = this;
    telegramApi.getUserInfo().then(function(user) {
      console.log('user', user, self);
      if (user.id) {
        self.router.goToRoute('im.html', () => {
          const messenger = new Messenger();
          messenger.render();
        });
      } else {
        self.router.goToRoute('login.html', () => {
          const login = new Login(self.router);
          login.render();
        });
      }
    }).catch((error) => {
      console.log('error', error);
    })
  }
}

(function () {
  const app = new App();
  app.init();
}());
