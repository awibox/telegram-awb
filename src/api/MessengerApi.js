import MtpApiManager from '../mtproto/mtpApiManager';
import query from 'q';
import MtpApiFileManager from 'mtproto/MtpApiFileManager';

class MessengerApi {
  constructor() {
    this.client = new MtpApiManager();
    this.fileApi = new MtpApiFileManager();
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
      deferred.resolve(result);
    }).catch((error) => {
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

  getMessages(peer, offset_id, add_offset, limit) {
    const deferred = query.defer();

    const request = {
      peer: peer,
      offset_id: offset_id,
      add_offset: add_offset,
      limit: limit
    };

    this.client.invokeApi('messages.getHistory', request, {
      timeout: 4000
    }).then(function (result) {
      console.log('get MESSAGES: ', result);
      deferred.resolve(result);
    }).catch((error) => {
      console.log('get MESSAGES error: ', error);
      deferred.reject(error);
    });

    return deferred.promise;
  }


  getFile2(location){
    this.fileApi.downloadSmallFile(location, this.client).then(r => {
      console.log('r', r);
    }).catch(e => {
      console.log('e', e);
    });
  }

  getFile(location){
    const deferred = query.defer();
    location['_'] = 'inputFileLocation';

    this.client.invokeApi('upload.getFile', {
      location: location,
      offset: 0,
      limit: 1024 * 1024
    }, {
      dcID: location.dc_id,
      fileDownload: true,
      createNetworker: true,
      noErrorBox: true
    }).then((file) => {
      console.log('file', file);
      deferred.resolve(file);
      this.fileApi.downloadSmallFile(location, deferred.promise).then(r => {
        console.log('r', r);
        debugger;
      }).catch(e => {
        console.log('e', e);
      });
      // deferred.resolve(file)
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }

}

export default MessengerApi;
