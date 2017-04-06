/**
 * @file FastCast
 */

/**
 * @module FastCast
 */
var FastCast = (function(){

    var clientCallbacks = {},
        TAG = "FastCast";

    /**
     * Returns handler registered to the event.
     * @func setCallback
     * @memberof module:FastCast
     * @private
     * @param {string} event - event name
     * @returns {function}
     */
    function setCallback(event) {
        return function(callback) {
            clientCallbacks[event] = callback;
        }
    }

    /**
     * Client connect from castReceiverManager.
     * @func onSenderConnected
     * @memberof module:FastCast
     * @private
     * @param {Object} event - client data
     * @returns {undefined}
     */
    function onSenderConnected(event) {
        if (!clientCallbacks["connect"]) return;
        clientCallbacks["connect"](event);
    }

    /**
     * Client disconnect from castReceiverManager.
     * @func onSenderDisconnected
     * @memberof module:FastCast
     * @private
     * @param {Object} event - client data
     * @returns {undefined}
     */
    function onSenderDisconnected(event) {
        if (!clientCallbacks["disconnect"]) return;
        clientCallbacks["disconnect"](event);
    }

    function connect() {
        // handler for 'senderconnected' event
        window.castReceiverManager.onSenderConnected = onSenderConnected;
        // handler for 'senderdisconnected' event
        window.castReceiverManager.onSenderDisconnected = onSenderDisconnected;
    }

    /**
     * Initializes FastCast. Expects 2 arguments: namespace
     * and a callback function. Namespace name is required.
     * Callback function is optional. If provided, does not receive any arguments.
     * @method init
     * @memberof module:FastCast
     * @access private
     * @param {string} namespace - namespace to create CastMessageBus to handle messages
     * @param {function} [callback] - function to be called after initialization
     * @returns {undefined}
     */
    function init(namespace, callback) {
        window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        console.log(Constants.APP_INFO, TAG, 'Starting Receiver Manager');

        // handler for the 'ready' event
        window.castReceiverManager.onReady = function(event) {
            console.log(Constants.APP_INFO, TAG, 'Received Ready event: ' + JSON.stringify(event.data));
            window.castReceiverManager.setApplicationState("Application status is ready...");
        };

        // create a CastMessageBus to handle messages for a custom namespace
        window.messageBus = window.castReceiverManager.getCastMessageBus( namespace );

        // handler for the CastMessageBus message event
        window.messageBus.onMessage = function(event) {
            console.log(Constants.APP_INFO, TAG, 'Message [' + event.senderId + ']: ' + event.data);
            tvApp.senderId = event.senderId;

            try {
                var parsed = JSON.parse(event.data);
                var event = parsed.event;
                var type = parsed.media && parsed.media.type;

                if (parsed.media) tvApp.stateObj = parsed;

                switch(event) {
                    case 'LOAD_START':
                        tvApp.stateObj.loadStarted = false;
                        console.log(Constants.APP_INFO, TAG, type);

                        type = type && typeof type == 'string' && type.toLowerCase();
                        Utils.triggerEvent("load_start_"+type, parsed);
                        break;

                    case 'RESUME':
                    case 'PAUSE':
                    case 'START_SLIDESHOW':
                    case 'STOP_SLIDESHOW':
                    case 'STOP_MEDIA':
                    case 'NEXT_SLIDE':
                    case 'PREVIOUS_SLIDE':
                        event = event.toLowerCase();
                        Utils.triggerEvent(event, parsed);
                        break;
                }
            } catch (event) {
                console.log(Constants.APP_INFO, TAG, 'Parse message error: ', event);
            }
        }

        // initialize the CastReceiverManager with an application status message
        window.castReceiverManager.start({statusText: "Application is starting"});
        console.log(Constants.APP_INFO, TAG, 'Receiver Manager started');

        callback && callback();
    }

    return {
        /**
         * Initializes FastCast. Register messages.
         * @access public
         * @param {string} namespace - namespace to create CastMessageBus to handle messages
         * @param {function} [callback] - function to be called after initialization
         * @returns {undefined}
         */
        init: init,
        /**
         * Registers sender connect event handler.
         * @method onSenderConnected
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * //show sender data when it connects
         * FastCast.onSenderConnected(function (event) {
         *     console.log("Received Sender Connected event: " + event.data);
         * });
         */
        onSenderConnected: setCallback('connect'),

        /**
         * Registers sender disconnect event handler.
         * @method onSenderDisconnected
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * //show sender data when it connects
         * FastCast.onSenderDisconnected(function (event) {
         *     console.log("Received Sender Connected event: " + event.data);
         * });
         */
        onSenderDisconnected: setCallback('disconnect'),

        /**
         * Register sender connect/disconnect events
         * @func connect
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * FastCast.connect();
         */
        connect: connect
    }
}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.FastCast = FastCast;
}
