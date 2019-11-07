import {apiConfig, TdClientOptions} from 'config/api';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';

(function () {
  const client = new TdClient(TdClientOptions);
  function init() {
    const router = new Router([
      new Route('login', 'login.html', true),
      new Route('im', 'im.html')
    ]);
    client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig
    });
    // client.onUpdate(function())
  }
  init();
  client.send({
    '@type': 'checkDatabaseEncryptionKey',
  });
  client.send({
    '@type': 'setAuthenticationPhoneNumber',
    phone_number: "0",
  }).then(result => {
    console.log('result', result);
  });
  console.log('client', client);
}());
