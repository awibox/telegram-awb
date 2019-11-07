import {apiConfig, TdClientOptions} from 'config/api';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/login.scss';

(function () {
  const client = new TdClient(TdClientOptions);
  let router;
  function init(callback) {
    console.log('callback', callback)
    router = new Router([
      new Route('login', 'login.html', true),
      new Route('im', 'im.html')
    ]);
    console.log('router', router)
    router.hasChanged()

    client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig
    });
    client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });

  }
  function onLoad() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');
    phoneNumberSendButton.addEventListener('click', function() {
      // client.send({
      //   '@type': 'setAuthenticationPhoneNumber',
      //   phone_number: phoneNumberInput.value,
      // }).then(result => {
      //   console.log('result', result);
      // });
      router.goToRoute('im')
    });
    phoneNumberInput.addEventListener('keyup', function () {
      console.log('phoneNumberInput', phoneNumberInput.value);
      if(phoneNumberInput.value.length > 9) {

      }
    })
  };
  init();
  setTimeout(onLoad, 100);
}());
