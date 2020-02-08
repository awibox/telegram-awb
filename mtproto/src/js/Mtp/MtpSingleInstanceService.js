function MtpSingleInstanceServiceModule(IdleManager, Storage, MtpNetworkerFactory, intervalService, rootService, timeoutService) {
    var instanceID = nextRandomInt(0xFFFFFFFF);
    var started = false;
    var masterInstance = false;
    var deactivatePromise = false;
    var deactivated = false;

    function start() {
        if (!started && !Config.Navigator.mobile) {
            started = true;

            IdleManager.start();

            intervalService(checkInstance, 5000);
            checkInstance();

            try {
                window.addEventListener('beforeunload', clearInstance)
            } catch (e) {
            }
        }
    }

    function clearInstance() {
        Storage.remove(masterInstance ? 'xt_instance' : 'xt_idle_instance');
    }

    function deactivateInstance() {
        if (masterInstance || deactivated) {
            return false;
        }
        deactivatePromise = false;
        deactivated = true;
        clearInstance();

        rootService.idle.deactivated = true;
    }

    function checkInstance() {
        if (deactivated) {
            return false;
        }
        var time = tsNow();
        var idle = rootService.idle && rootService.idle.isIDLE;
        var newInstance = {id: instanceID, idle: idle, time: time};

        Storage.get('xt_instance', 'xt_idle_instance').then(function (result) {
            var curInstance = result[0],
                idleInstance = result[1];

            if (!idle || !curInstance ||
                curInstance.id == instanceID ||
                curInstance.time < time - 60000) {

                if (idleInstance &&
                    idleInstance.id == instanceID) {
                    Storage.remove('xt_idle_instance');
                }
                Storage.set({xt_instance: newInstance});
                if (!masterInstance) {
                    MtpNetworkerFactory.startAll();
                    console.warn(dT(), 'now master instance', newInstance);
                }
                masterInstance = true;
                if (deactivatePromise) {
                    timeoutService.cancel(deactivatePromise);
                    deactivatePromise = false;
                }
            } else {
                Storage.set({xt_idle_instance: newInstance});
                if (masterInstance) {
                    MtpNetworkerFactory.stopAll();
                    console.warn(dT(), 'now idle instance', newInstance);
                    if (!deactivatePromise) {
                        deactivatePromise = timeoutService(deactivateInstance, 30000);
                    }
                }
                masterInstance = false;
            }
        });
    }

    return {
        start: start
    };
}

MtpSingleInstanceServiceModule.dependencies = [
    'IdleManager',
    'Storage',
    'MtpNetworkerFactory',
    'intervalService',
    'rootService',
    'timeoutService',
];
