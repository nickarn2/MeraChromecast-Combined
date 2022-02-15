'use strict';

/**
 * @module Utils
 * @description The Utils module defines utility functions for a whole app
 */
var Utils = (function(){

    var TAG = "Utils";

    /**
     * Display artwork for media
     * @method setArtwork
     * @memberof module:Utils
     * @access public
     * @param {Jquery Element} element - to be styled
     * @param {String} artwork - artwork url
     * @returns {undefined}
     */
    function setArtwork(element, artwork) {
        var artworkLoader = element.find(".loader"),
            height = Math.ceil(tvApp.playerContainer.outerHeight() / 2),
            width = height;

        element.css("width", width+"px");
        element.css("height", height+"px");

        artworkLoader.css("width", width+"px");
        artworkLoader.css("height", height+"px");
        artworkLoader.addClass('displayed');

        if (artwork && artwork.length !== 0) element.css("background-image", "url(" + artwork + ")");
        else element.css("background-image", "url(images/placeholder-song.png)");
    }

    /**
     * Apply initial styles for player's custom controls
     * @method updatePlayerStyles
     * @memberof module:Utils
     * @access public
     * @returns {undefined}
     */
    function updatePlayerStyles() {
        var controls =          tvApp.playerContainer.find(".controls"),
            progressBar =       tvApp.playerContainer.find(".controls .progress-bar"),
            progress =          tvApp.playerContainer.find(".controls .progress"),
            tick =              tvApp.playerContainer.find(".controls .tick"),
            curLabel =          tvApp.playerContainer.find(".controls .curtime"),
            durLabel =          tvApp.playerContainer.find(".controls .durtime"),
            controlsWidth =     Math.ceil(tvApp.playerContainer.outerHeight() / 2),
            timeStr = "0:00";

        controls.css("width", controlsWidth+"px");
        progress.css("width", "0px");
        tick.css("left", "-1px");

        curLabel.html(timeStr);
        if (tvApp.stateObj.media.duration) timeStr = getTimeStr(tvApp.stateObj.media.duration);
        durLabel.html(timeStr);

        controls.css("display", "inline-block");// ***

        durLabel.css("width", "0px");/*
            Fix for VZMERA-131;
            We could remove the setting of width and use scrollWidth value instead of offsetWidth here like it's done for Tizen to fix the issue.
            But in this case (auto width calculation) GCast renders element with math error (about 0.5px wider) in comparison with actual size.
            So we have to reset width to 0,get scrollWidth and then set it to the new width like it's done below
        */

        var durLabelWidth = durLabel[0].scrollWidth;//Get this after controls are displayed (ref to ***)
        progressBar.css("width", controlsWidth - durLabelWidth*2 + "px");
        durLabel.css("width", durLabelWidth + "px");
        curLabel.css("width", durLabelWidth + "px");
    }

    /**
     * Update current time label for player's custom controls
     * @method updatePlayerCurtimeLabel
     * @memberof module:Utils
     * @access public
     * @returns {undefined}
     */
    function updatePlayerCurtimeLabel() {
        updatePlayerCurtimeLabel.stop();

        //Init html elements
        updatePlayerCurtimeLabel.video = tvApp.playerContainer.find("#html5-player")[0];
        updatePlayerCurtimeLabel.curtimeLabel = tvApp.playerContainer.find(".controls .curtime");

        updatePlayerCurtimeLabel.interval = setInterval(updatePlayerCurtimeLabel.updateFn, 10);
    }
    updatePlayerCurtimeLabel.updateFn = function() {
        var video = this.video || tvApp.playerContainer.find("#html5-player")[0],
            curtimeLabel = this.curtimeLabel || tvApp.playerContainer.find(".controls .curtime");

        if (curtimeLabel && video) {
            if (video.paused && video.currentTime !== video.duration) return;
            curtimeLabel.html(getTimeStr(video.currentTime));
        }
    }
    updatePlayerCurtimeLabel.video = undefined;
    updatePlayerCurtimeLabel.curtimeLabel = undefined;
    updatePlayerCurtimeLabel.interval = undefined;

    /**
     * Update current time label when playback is stopped.
     *
     * @return {undefined} Result: updating current time label, removing interval and clearing variables.
     */
    updatePlayerCurtimeLabel.stop = function() {
        console.log(Constants.APP_INFO, TAG, 'updatePlayerCurtimeLabel: stop updating if it is in progress (interval!=undefined): interval:', this.interval);
        if (!this.interval) return;
        updatePlayerCurtimeLabel.updateFn();//this perform last curtime label update on audio ended event if event fired right after last timeupdate event
        clearInterval(this.interval);

        this.video = undefined;
        this.curtimeLabel = undefined;
        this.interval = undefined;
        console.log(Constants.APP_INFO, TAG, 'updatePlayerCurtimeLabel: stop');
    }

    /**
     * Set, get current view - photo, audio-player and etc
     * @method viewManager
     * @memberof module:Utils
     * @access public
     * @returns {Object} -
     * property getRecentViewInfo Get current view (call viewManager.getRecentViewInfo().mode)
     * property setView Set view, param view name {String}
     */
    var viewManager = (function () {
        var recentView = {
            mode: ''
        };

        var getRecentViewInfo = function () {
            return {
                mode: recentView.mode
            };
        };
        var setView = function (mode) {
            recentView.mode = mode;

            tvApp.playerContainer.removeClass("displayed");
            Page.picture.display({flag: false, elem: $('#pictures')});

            switch (mode) {
                case 'photo':
                    Page.picture.display({elem: $('#pictures')});
                    break;
                case 'audio-player':
                case 'video-player':
                    tvApp.playerContainer.addClass("displayed");
                    Page.loading.display(false); // display a loading screen
                    break;
            }
        };

        return {
            getRecentViewInfo: getRecentViewInfo,
            setView: setView
        }
    }())

    /**
     * Display media info (title, artist, album, etc.)
     * @method setMediaInfo
     * @memberof module:Utils
     * @access public
     * @param {Jquery Element} infoEl - to be styled
     * @param {Object} data - message received from sender, contains media info
     * @returns {undefined}
     */
    function setMediaInfo(infoEl, data) {
        var titleEl = infoEl.find(".title"),
            descEl = infoEl.find(".desc"),
            title = data.media.title || 'No Song Name',
            artist = data.media.artist || 'No Artist Name',
            album = data.media.album || 'No Album Name';

        titleEl.html(title);
        descEl.html(artist + ' - ' + album);
    }

    /**
     * Set css style and corresponding vendor prefixes
     * @method setVendorStyle
     * @memberof module:Utils
     * @access public
     * @param {HTML Jquery Element} element - to be styled
     * @param {String} property - style name that should be set (for ex. "Transform")
     * @param {String} value - (for ex. "rotate(90deg)")
     * @param {Boolean} log - Flag: either log or not
     * @returns {undefined}
     */
    function setVendorStyle(element, property, value, log) {
        if (log !== false) console.log(Constants.APP_INFO, TAG, 'setVendorStyle: property: ', property, ' value: ', value);
        element.css("-webkit-" + property, value);
        element.css("-moz-" + property, value);
        element.css("-ms-" + property, value);
        element.css("-o-" + property, value);
        element.css(property.toLowerCase(), value);
    }

    /**
     * Get image orientation using EXIF library
     * @method getImageOrientation
     * @memberof module:Utils
     * @access public
     * @param {String} url - image url
     * @param {Function} cb - callback function
     * @returns {undefined}
     */
    function getImageOrientation(source, cb) {
        console.log(Constants.APP_INFO, TAG, "getImageOrientation: ", source);
        if ((source instanceof window.Image || source instanceof window.HTMLImageElement)
            && source.exifdata) {
            source.exifdata = null;
        }

        EXIF.getData(source, function () {
            var exif = EXIF.getAllTags(this),
                ori = exif.Orientation;
            console.log(Constants.APP_INFO, TAG, exif);
            console.log(Constants.APP_INFO, TAG, "Orientation", ori);
            cb(ori);
        });
    }

    /**
     * Check if parameters has a list of headers || body parameters
     * If it has then recourse is secure
     * @method isResourceSecure
     * @memberof module:Utils
     * @access public
     * @param {Object} parameters
     * @returns {Boolean}
     */
    function isResourceSecure(parameters) {
        if ( parameters ) {
            if ( parameters.headers && Object.keys(parameters.headers).length != 0 ||
                 parameters.body && Object.keys(parameters.body).length != 0 ) return true;
            else return false;
        } else return false;
    }

    /**
     * Generate time string (Formats: h:mm:ss || m:ss)
     * @method getTimeStr
     * @memberof module:Utils
     * @access public
     * @param {number} secs - seconds
     * @returns {String}
     */
    function getTimeStr(secs) {
        if(!secs) return "0:00";
        var h = Math.floor(secs / 3600),
            m = Math.floor(secs % 3600 / 60),
            s = Math.floor(secs % 3600 % 60);

        var str = ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
        console.log(Constants.APP_INFO, TAG, 'getTimeStr: secs:', secs, ' return str:', str);
        return str;
    }

    /**
     * Send message to client app
     * @method sendMessageToSender
     * @memberof module:Utils
     * @access public
     * @param {Object} dataObj - Message content
     * @returns {undefined}
     */
    function sendMessageToSender(dataObj) {
        try {
            var data = JSON.stringify(dataObj);
            FastCast.sendTheMessage(dataObj);

            if (dataObj.media_event && dataObj.media_event.event) {
                triggerEvent("onMediaEvent", {event: dataObj.media_event.event});
            }
        } catch(e) {
            console.error(Constants.APP_INFO, TAG, e);
        }
    }

    /**
     * Create custom event and dispatch
     * @param {String} event Event name
     * @param {Object} message Event message {detail: <value>}
     */
    function triggerEvent(event, message) {
        console.log(Constants.APP_INFO, TAG, 'triggerEvent', event, JSON.stringify(message));
        if (typeof event !== 'string') return;

        var customEvent = new CustomEvent(event, {detail: message});
        document.dispatchEvent(customEvent);
    }

    return {
        ui: {
            /**
             * Display artwork for media
             */
            setArtwork: setArtwork,

            /**
             * Display media info (title, artist, album, etc.)
             */
            setMediaInfo: setMediaInfo,

            /**
             * Set css style and corresponding vendor prefixes
             */
            setVendorStyle: setVendorStyle,

            /**
             * Update styles for player's custom controls if duration has changed
             */
            updatePlayerStyles: updatePlayerStyles,

            /**
             * Update current time label for player's custom controls
             */
            updatePlayerCurtimeLabel: updatePlayerCurtimeLabel,

            /**
             * Set, get current view - photo, audio-player and etc
             */
            viewManager: viewManager
        },
        /**
        * Check whether the passed value is integer
        * Number.isInteger is not working for Tizen
        * @param {?} n - value to be checked
        */
        isInt: function(n) {
            return Number(n) === n && n % 1 === 0;
        },

        /**
        * Generate random integer value within passed arguments
        * @param {Integer} min - min value for result
        * @param {Integer} max - max value for result
        * @returns {Integer} Random integer value
        */
        getRandomInt: function(min, max) {
          return Math.floor(Math.random() * (max - min)) + min;
        },

        /**
         * Get image orientation using EXIF library
         */
        getImageOrientation: getImageOrientation,

        /**
         * Check if parameters has a list of headers || body parameters
         */
        isResourceSecure: isResourceSecure,

        /**
         * Generate time string (Formats: h:mm:ss || m:ss)
         */
        getTimeStr: getTimeStr,

        /**
         * Send message to client app
         */
        sendMessageToSender: sendMessageToSender,

        /**
         * This function checks if event is applicable
         * For ex, if picture is shown at the moment and we receive Pause event
         * In this case Pause event is not applicable
         * @returns {Boolean}
         */
        isEventValid: function() {
            var COMMAND_IS_VALID =
                Utils.ui.viewManager.getRecentViewInfo().mode.indexOf('player') !== -1 &&
                tvApp.stateObj.loadStarted;

            console.log(Constants.APP_INFO, TAG, 'isEventValid', COMMAND_IS_VALID);
            return COMMAND_IS_VALID;
        },

        /**
         * Create custom event and dispatch
         */
        triggerEvent: triggerEvent
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Utils = Utils;
}
