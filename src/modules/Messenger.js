import { transformDate } from 'utils';
import 'styles/messenger.scss';

class Messenger {
  constructor(client, router, state) {
    this.client = client;
    this.router = router;
    this.state = state;
  }
  chatClick(chatId, lastMessageId) {
    (async () => {
      const response = await this.client.send({
        '@type': 'getChatHistory',
        chat_id: chatId,
        from_message_id: lastMessageId,
        offset: 0,
        limit: 50,
        only_local: false
      }).finally(() => {
        console.log('end!');
      }).catch(error => {
        console.error(error);
      });
      console.log('response.messages', response.messages);
    })();
  }
  chatList() {

  }
  render() {
    const chatsObj = document.getElementById('chats');
    const chatClickFunction = () => this.chatClick();
    this.client.send({
      '@type': 'getChats',
      offset_order: '9223372036854775807',
      offset_chat_id: 0,
      limit: 30,
    }).then(result => {
      result.chat_ids.forEach((item) => {
        (async () => {
          const response = await this.client.send({
            '@type': 'getChat',
            chat_id: item,
          }).finally(() => {

          }).catch(error => {
            console.error(error);
          });
          console.log('response', response);
          const isOutgoing = response.last_message.is_outgoing;
          const containsUnreadMention = response.last_message.contains_unread_mention;
          const chatView = document.createElement('div')
          chatView.innerHTML = `
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
          </div>`;
          chatView.addEventListener('click', () => this.chatClick(item, response.last_message.id));
          chatsObj.append(chatView);
        })();
      });
    }).catch(error => {
      console.error(error);
    });
  }
}
export default Messenger;