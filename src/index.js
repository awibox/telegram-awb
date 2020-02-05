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


class App {
  constructor() {
    this.router = {};
    this.client = 'telegramApi';
  }

  init() {
    telegramApi.setConfig(apiConfig);
    this.router = new Router([
      new Route('login', 'login.html'),
      new Route('confirm', 'confirm.html'),
      new Route('registration', 'registration.html'),
      new Route('password', 'password.html'),
      new Route('im', 'im.html'),
    ]);
    const self = this;
    telegramApi.getUserInfo().then((user) => {
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
    });
  }
}

(function () {
  const app = new App();
  app.init();
}());
