class MessengerApi {
  constructor() {
    this.client = telegramApi;
  }

  getDialogs(offset_date, limit) {
    return this.client.getDialogs(offset_date, limit);
  }

  getMessages(params) {
    return this.client.getHistory(params);
  }

  getFile(location) {
    const inputLocation = location;
    inputLocation._ = 'inputFileLocation';
    return this.client.invokeApi('upload.getFile', {
      location: inputLocation,
      offset: 0,
      limit: 1024 * 1024,
    });
  }

  sendMessage(chatId, message){
    return this.client.sendMessage(chatId, message);
  }
}

export default MessengerApi;
