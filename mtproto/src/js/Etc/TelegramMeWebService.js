function TelegramMeWebServiceModule(Storage) {
    var disabled = Config.Modes.test || location.protocol != 'http:' && location.protocol != 'https:';

    function sendAsyncRequest(canRedirect) {
        if (disabled) {
            return false;
        }

        Storage.get('tgme_sync').then(function (curValue) {
            var ts = tsNow(true);
            if (canRedirect &&
                curValue &&
                curValue.canRedirect == canRedirect &&
                curValue.ts + 86400 > ts) {
                return false;
            }
            Storage.set({tgme_sync: {canRedirect: canRedirect, ts: ts}});

            var script = document.createElement('script');
            script.src = '//telegram.me/_websync_?authed=' + (canRedirect ? '1' : '0');
            script.onerror = () => {
                document.body.removeChild(script);
            };
            document.body.append(script);
        });
    }

    return {
        setAuthorized: sendAsyncRequest
    };
}

TelegramMeWebServiceModule.dependencies = [
    'Storage',
];
