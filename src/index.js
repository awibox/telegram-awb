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
    this.api = telegramApi;
    this.isAuth = storage.getObject('user_auth');
  }

  init() {
    this.api.setConfig(apiConfig);
    this.router = new Router([
      new Route('login', 'login.html'),
      new Route('confirm', 'confirm.html'),
      new Route('registration', 'registration.html'),
      new Route('password', 'password.html'),
      new Route('im', 'im.html'),
    ]);
    if (this.isAuth) {
      this.router.goToRoute('im.html', () => {
        const messenger = new Messenger();
        messenger.render();
      });
    } else {
      this.router.goToRoute('login.html', () => {
        const login = new Login(this.router);
        login.render();
      });
    }
  }
}

(function () {
  const app = new App();
  app.init();
}());
