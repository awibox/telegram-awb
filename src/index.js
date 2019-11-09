import { apiConfig, TdClientOptions } from 'config/api';
import { transformDate } from 'utils';
import TdClient from 'tdweb';
import Router from 'router/router';
import Route from 'router/route';
import 'styles/build.scss';
import 'styles/login.scss';
import 'styles/confirm.scss';
import 'styles/im.scss';

(function () {
  const client = new TdClient(TdClientOptions);
  let phoneNumber = '';
  let router;

  function init() {
    router = new Router([
      new Route('login', 'login.html', true),
      new Route('confirm', 'confirm.html'),
      new Route('im', 'im.html'),
    ]);
    client.send({
      '@type': 'setTdlibParameters',
      parameters: apiConfig,
    });
    client.send({
      '@type': 'checkDatabaseEncryptionKey',
    });
  }

  function loginPage() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');
    phoneNumberSendButton.addEventListener('click', function () {
      client.send({
        '@type': 'setAuthenticationPhoneNumber',
        phone_number: phoneNumberInput.value,
      }).then(result => {
        phoneNumber = phoneNumberInput.value;
        router.goToRoute('confirm.html');
        setTimeout(confirmPage, 100);
      }).catch(error => {
        console.error(error);
      });
      //
    });
    phoneNumberInput.addEventListener('keyup', function () {
      console.log('phoneNumberInput', phoneNumberInput.value);
      if (phoneNumberInput.value.length > 9) {

      }
    });
  }

  function confirmPage() {
    const confirmTitle = document.getElementById('confirmPhone');
    const confirmCodeInput = document.getElementById('confirmCode');
    confirmTitle.innerText = phoneNumber;
    confirmCodeInput.addEventListener('keyup', function () {
      if (confirmCodeInput.value.length == 5) {
        console.log('SENDD!!!', confirmCodeInput.value);
        client.send({
          '@type': 'checkAuthenticationCode',
          code: confirmCodeInput.value,
        }).then(result => {
          console.log('result', result);
        }).catch(error => {
          console.error(error);
        });
      }
    });
  }

  function imPage() {
    const chatsObj = document.getElementById('chats');
    const newChats = [];
    let chats = [];
    client.send({
      '@type': 'getChats',
      offset_order: '9223372036854775807',
      offset_chat_id: 0,
      limit: 30,
    }).then(result => {
      console.log('imPage', result);
      result.chat_ids.forEach((item) => {
        (async () => {
          const response = await client.send({
            '@type': 'getChat',
            chat_id: item,
          }).finally(() => {

          }).catch(error => {
            console.error(error);
          });
          console.log('response', response);
          (async () => {
            const photo = await client.send({
              '@type': 'getRemoteFile',
              remote_file_id: response.photo.small.remote.id
            }).finally(() => {
              console.log('end!');
            }).catch(error => {
              console.error(error);
            });
            console.log('response.photo', photo);
          })();
          const isOutgoing = response.last_message.is_outgoing;
          const containsUnreadMention = response.last_message.contains_unread_mention;
          newChats.push(`
          <div class="chats__item">
            <div class="chats__item-avatar"></div>
            <div class="chats__item-title">${response.title}</div>
            <div class="chats__item-last">${response.last_message.content.text.text}</div>
            <div class="chats__item-time">
                ${isOutgoing && !containsUnreadMention ? '+' : ''}
                ${isOutgoing && containsUnreadMention ? '-' : ''}
                ${transformDate(response.last_message.date)}
            </div>
            ${response.unread_count > 0 ? `<div class="chats__item-unread">${response.unread_count}</div>` : ''}
          </div>
          `);
        })();
      });
      console.log('newChats', newChats);
      setTimeout(() => chatsObj.innerHTML = newChats.join(''), 200);

      (async () => {
        const response = await client.send({
          '@type': 'getChatHistory',
          chat_id: result.chat_ids[1],
          offset: 0,
          limit: 5,
        }).finally(() => {
          console.log('end!');
        }).catch(error => {
          console.error(error);
        });
        console.log('response.messages', response.messages);
      })();

    }).catch(error => {
      console.error(error);
    });
  }

  init();
  setTimeout(loginPage, 100);
  setTimeout(imPage, 300);
}());
