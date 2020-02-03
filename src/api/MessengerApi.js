class MessengerApi {
  constructor() {
    this.client = telegramApi;
  }

  getChats(flags, offset_id, offset_date, offer_peer, limit) {
    return this.client.invokeApi('messages.getDialogs', {
      flags: 0,
      offset_date: offset_date,
      offset_id: offset_id,
      offset_peer: offer_peer ? offer_peer : { _: 'inputPeerEmpty' },
      limit: limit
    }, {
      timeout: 4000
    });
  }

  getInputPeerByID(peerId, hashId, isChannel) {
    if (!peerId) {
      return { _: 'inputPeerEmpty' };
    }
    if (peerId < 0) {
      var chatId = -peerId;
      if (!isChannel) {
        return {
          _: 'inputPeerChat',
          chat_id: chatId
        };
      } else {
        return {
          _: 'inputPeerChannel',
          channel_id: chatId,
          access_hash: hashId || 0
        };
      }
    }
    if (!isChannel) return {
      _: 'inputPeerUser',
      user_id: peerId,
      access_hash: hashId || 0
    };

    return {
      _: 'inputPeerChannel',
      channel_id: peerId,
      access_hash: hashId || 0
    };
  }

  getMessages(peer, offset_id, add_offset, limit) {
    const request = {
      peer: peer,
      offset_id: offset_id,
      add_offset: add_offset,
      limit: limit
    };
    return this.client.invokeApi('messages.getHistory', request, { timeout: 4000 });
  }

  getFile(location){
    const inputLocation = location;
    inputLocation['_'] = 'inputFileLocation';
    console.log(inputLocation);
    return this.client.invokeApi('upload.getFile', {
      location: inputLocation,
      offset: 0,
      limit: 1024 * 1024
    })
  }
}

export default MessengerApi;
