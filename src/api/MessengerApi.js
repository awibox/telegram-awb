class MessengerApi {
  constructor() {
    this.client = telegramApi;
  }

  getDialogs(offset_date, limit) {
    return this.client.getDialogs(offset_date, limit);
  }

  getInputPeerByID(peerId, hashId, isChannel) {
    if (!peerId) {
      return { _: 'inputPeerEmpty' };
    }
    if (peerId < 0) {
      const chatId = -peerId;
      if (!isChannel) {
        return {
          _: 'inputPeerChat',
          chat_id: chatId,
        };
      }
      return {
        _: 'inputPeerChannel',
        channel_id: chatId,
        access_hash: hashId || 0,
      };
    }
    if (!isChannel) {
      return {
        _: 'inputPeerUser',
        user_id: peerId,
        access_hash: hashId || 0,
      };
    }

    return {
      _: 'inputPeerChannel',
      channel_id: peerId,
      access_hash: hashId || 0,
    };
  }

  getMessages(peer, offset_id, add_offset, limit) {
    const request = {
      peer,
      offset_id,
      add_offset,
      limit,
    };
    return this.client.invokeApi('messages.getHistory', request, { timeout: 4000 });
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
}

export default MessengerApi;
