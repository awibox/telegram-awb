function MtpDcConfiguratorModule() {
    var chosenServers = {};

    function chooseServer(dcID, upload) {
        var dcOptions = Config.Modes.test ? Config.Server.Test : Config.Server.Production;

        if (chosenServers[dcID] === undefined) {
            var chosenServer = false,
                i, dcOption;

            for (i = 0; i < dcOptions.length; i++) {
                dcOption = dcOptions[i];
                if (dcOption.id == dcID) {
                    chosenServer = chooseProtocol() + '//' + (chooseProtocol() === 'https' ? dcOption.host : 'venus.web.telegram.org') + (dcOption.port != 80 ? ':' + dcOption.port : '') + '/apiw1';
                    break;
                }
            }
            chosenServers[dcID] = chosenServer;
        }

        return chosenServers[dcID];
    }

    function chooseProtocol() {
        if (location.protocol.indexOf('http') != -1) {
            return location.protocol;
        }

        return 'http:';
    }

    return {
        chooseServer: chooseServer
    };
}

MtpDcConfiguratorModule.dependencies = [];
