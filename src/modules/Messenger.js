import { transformDate, getTime } from 'utils';
import 'styles/messenger.scss';

class Messenger {
  constructor(client, router, state) {
    this.client = client;
    this.router = router;
    this.state = state;
    this.chats = [];
    this.messages = [];
  }
  addMessage(message) {
    const messageView = document.createElement('div');
    const isOutgoing = message.is_outgoing;
    if(message.content['@type'] === 'messageText') {
      messageView.innerHTML = `
          <div class="message__item">
            <div class="message__item-avatar"></div>
            <div class="message__item-text">${message.content.text.text}</div>
            <div class="chats__item-time">
                ${isOutgoing ? '+' : ''}
                ${getTime(message.date)}
            </div>
          </div>`;
    }
    this.messageObj.append(messageView)
  }
  messageList(chatId, lastMessage) {
    this.messageObj.innerHTML = '';
    this.messages = [];
    this.addMessage(lastMessage);
    (async () => {
      const response = await this.client.send({
        '@type': 'getChatHistory',
        chat_id: chatId,
        from_message_id: lastMessage.id,
        offset: 0,
        limit: 50,
        only_local: false
      }).catch(error => {
        console.error(error);
      });
      console.log('response.messages', response.messages);
      response.messages.forEach((item) => {
        this.addMessage(item);
      });
      console.log('this.messages', this.messages);
    })();
  }
  chatList() {
    const chatsObj = document.getElementById('chats');
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
          }).catch(error => {
            console.error(error);
          });
          console.log('response', response);
          const isOutgoing = response.last_message.is_outgoing;
          const containsUnreadMention = response.last_message.contains_unread_mention;
          const chatView = document.createElement('div');
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
          chatView.addEventListener('click', () => this.messageList(item, response.last_message));
          chatsObj.append(chatView);
          this.chats.push(item);
        })();
      });
    }).catch(error => {
      console.error(error);
    });
  }
  render() {
    this.messageObj = document.getElementById('messages');
    this.chatList();
  }
}
export default Messenger;