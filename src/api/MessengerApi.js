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
}

export default MessengerApi;
