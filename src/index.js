import {apiConfig, TdClientOptions} from 'config/api';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/login.scss';
import 'styles/confirm.scss';

(function () {
  const client = new TdClient(TdClientOptions);
  let phoneNumber = '';
  let router;
  function init() {
    router = new Router([
      new Route('login', 'login.html', true),
      new Route('confirm', 'confirm.html'),
      new Route('im', 'im.html')
    ]);
    client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig
    });
    client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });

  }
  function loginPage() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');
    phoneNumberSendButton.addEventListener('click', function() {
      client.send({
        '@type': 'setAuthenticationPhoneNumber',
        phone_number: phoneNumberInput.value,
      }).then(result => {
        phoneNumber = phoneNumberInput.value;
        router.goToRoute('confirm.html')
        setTimeout(confirmPage, 100);
      }).catch(error => {
        console.error(error)
      });
      //
    });
    phoneNumberInput.addEventListener('keyup', function () {
      console.log('phoneNumberInput', phoneNumberInput.value);
      if(phoneNumberInput.value.length > 9) {

      }
    })
  }
  function confirmPage() {
    const confirmTitle = document.getElementById('confirmPhone');
    const confirmCodeInput = document.getElementById('confirmCode');
    confirmTitle.innerText = phoneNumber;
    confirmCodeInput.addEventListener('keyup', function () {
      if(confirmCodeInput.value.length == 5) {
        console.log('SENDD!!!', confirmCodeInput.value);
        client.send({
          '@type': 'checkAuthenticationCode',
          code: confirmCodeInput.value,
        }).then(result => {
          console.log('result', result)
        }).catch(error => {
          console.error(error)
        });
      }
    })
  }
  init();
  setTimeout(loginPage, 100);
}());
