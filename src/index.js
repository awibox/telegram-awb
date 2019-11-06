import {apiConfig, TdClientOptions} from 'config/api';
import TdClient from 'tdweb';

const client = new TdClient(TdClientOptions);

client.send({
  '@type': 'setTdlibParameters',
  parameters: apiConfig
});