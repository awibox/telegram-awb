import {apiConfig, TdClientOptions} from 'config/api';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';

(function () {
  function init() {
    const router = new Router([
      new Route('login', 'login.html', true),
      new Route('im', 'im.html')
    ]);
    console.log('router', router);
    const client = new TdClient(TdClientOptions);
    client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig
    });
  }
  init();
}());
