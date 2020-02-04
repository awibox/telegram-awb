import ContainerModule from 'ioc-js';

import AppChatsManagerModule from './js/App/AppChatsManager';
import AppPeersManagerModule from './js/App/AppPeersManager';
import AppProfileManagerModule from './js/App/AppProfileManager';
import AppUsersManagerModule from './js/App/AppUsersManager';

import MtpApiFileManagerModule from './js/Mtp/MtpApiFileManager';
import MtpApiManagerModule from './js/Mtp/MtpApiManager';
import MtpAuthorizerModule from './js/Mtp/MtpAuthorizer';
import MtpDcConfiguratorModule from './js/Mtp/MtpDcConfigurator';
import MtpNetworkerFactoryModule from './js/Mtp/MtpNetworkerFactory';
import MtpRsaKeysManagerModule from './js/Mtp/MtpRsaKeysManager';
import MtpSecureRandomModule from './js/Mtp/MtpSecureRandom';
import MtpSingleInstanceServiceModule from './js/Mtp/MtpSingleInstanceService';
import MtpTimeManagerModule from './js/Mtp/MtpTimeManager';

import $httpModule from './js/Etc/$http';
import $intervalModule from './js/Etc/$interval';
import $rootScopeModule from './js/Etc/$rootScope';
import $timeoutModule from './js/Etc/$timeout';
import $qModule from './js/Etc/$q';

import CryptoWorkerModule from './js/Etc/CryptoWorker';
import IdleManagerModule from './js/Etc/IdleManager';
import qSyncModule from './js/Etc/qSync';
import StorageModule from './js/Etc/Storage';
import TelegramMeWebServiceModule from './js/Etc/TelegramMeWebService';
import FileSaverModule from './js/Etc/FileSaver';

import TelegramApiModule from './telegramApi';

// Create container
var builder = new ContainerModule();

// Register App modules
builder.register('AppChatsManager', AppChatsManagerModule);
builder.register('AppPeersManager', AppPeersManagerModule);
builder.register('AppProfileManager', AppProfileManagerModule);
builder.register('AppUsersManager', AppUsersManagerModule);
//
// // Register Mtp modules
builder.register('MtpApiFileManager', MtpApiFileManagerModule);
builder.register('MtpApiManager', MtpApiManagerModule);
builder.register('MtpAuthorizer', MtpAuthorizerModule);
builder.register('MtpDcConfigurator', MtpDcConfiguratorModule);
builder.register('MtpNetworkerFactory', MtpNetworkerFactoryModule);
builder.register('MtpRsaKeysManager', MtpRsaKeysManagerModule);
builder.register('MtpSecureRandom', MtpSecureRandomModule);
builder.register('MtpSingleInstanceService', MtpSingleInstanceServiceModule);
builder.register('MtpTimeManager', MtpTimeManagerModule);
//
// // Register Angular modules
builder.register('$http', $httpModule);
builder.register('$interval', $intervalModule);
builder.register('$rootScope', $rootScopeModule);
builder.register('$timeout', $timeoutModule);
builder.register('$q', $qModule);
//
// // Register other modules
builder.register('CryptoWorker', CryptoWorkerModule);
builder.register('IdleManager', IdleManagerModule);
builder.register('qSync', qSyncModule);
builder.register('Storage', StorageModule);
builder.register('TelegramMeWebService', TelegramMeWebServiceModule);
builder.register('FileSaver', FileSaverModule);
//
// // Register TelegramApi module
builder.register('TelegramApi', TelegramApiModule);

// Initialize modules
builder.init();

// Resolve TelegramApi
window.telegramApi = builder.resolve('TelegramApi');
