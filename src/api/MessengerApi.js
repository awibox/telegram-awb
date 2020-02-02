import MtpApiManager from '../mtproto/mtpApiManager';
import query from 'q';



class MessengerApi {
  constructor() {
    this.client = new MtpApiManager();
  }

  getChats(flags, offset_id, offset_date, offer_peer, limit) {
    const deferred = query.defer();

    this.client.invokeApi('messages.getDialogs', {
      flags: 0,
      offset_date: offset_date,
      offset_id: offset_id,
      offset_peer: offer_peer ? offer_peer : { _: 'inputPeerEmpty' },
      limit: limit
    }, {
      timeout: 4000
    }).then(function (result) {
      console.log('get DIALOGS: ', result);
      deferred.resolve(result);
    }, (error) => {
      console.log('get DIALOGS error: ', error);
      deferred.reject(error);
    });

    return deferred.promise;
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

  getMessages(peerId, hashId, isChannel) {
    const deferred = query.defer();

    const request = {
      peer: this.getInputPeerByID(peerId, hashId, isChannel),
      offset_id: 0,
      add_offset: 0,
      limit: 0
    };

    this.client.invokeApi('messages.getHistory', request, {
      timeout: 4000
    }).then(function (result) {
      console.log('get MESSAGES: ', result);
      deferred.resolve(result);
    }, (error) => {
      console.log('get MESSAGES error: ', error);
      deferred.reject(error);
    });

    return deferred.promise;
  }
}

export default MessengerApi;
