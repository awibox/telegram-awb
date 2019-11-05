import {apiConfig} from 'config/api';
require('telegram-api-js/dist/telegramApi');
$( document ).ready(function() {
  telegramApi.setConfig(apiConfig);
  telegramApi.getUserInfo().then(function(user) {
    if (user.id) {
      // You have already signed in
    } else {
      // Log in
    }
  });
  console.log('Worked')
});

