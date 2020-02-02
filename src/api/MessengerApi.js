import MtpApiManager from '../mtproto/mtpApiManager';
import query from 'q';



class MessengerApi {
  constructor() {
    this.client = new MtpApiManager();
  }

  getChats() {
    var deferred = query.defer();

    this.client.invokeApi('messages.getDialogs', {
      flags: 0,
      offset_date: 0,
      offset_id: 0,
      offset_peer: { _: 'inputPeerEmpty' },
      limit: 0
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
