'use strict';

/**
 * @module Utils
 * @description The Utils module defines utility functions for a whole app
 */
var Utils = (function(){

    var TAG = "Utils",
        APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ";

    /**
     * Display artwork for media
     * @method setArtwork
     * @memberof module:Utils
     * @access public
     * @param {HTML Element} element - to be styled
     * @param {String} artwork - artwork url
     * @returns {undefined}
     */
    function setArtwork(element, artwork) {
        var playerContainer = document.getElementById('player-container'),
            artworkLoader = element.querySelector('.loader'),
            height = Math.ceil(playerContainer.offsetHeight / 2),
            width = height;

        element.style.width = width+"px";
        element.style.height = height+"px";

        artworkLoader.style.width = width+"px";
        artworkLoader.style.height = height+"px";
        artworkLoader.classList.add('displayed');

        if (artwork && artwork.length !== 0) element.style.backgroundImage = 'url(' + artwork + ')'
        else element.style.backgroundImage = 'url(images/song-default@3x.png)';
    }

    /**
     * Apply initial styles for player's custom controls
     * @method initPlayerStyles
     * @memberof module:Utils
     * @access public
     * @returns {undefined}
     */
    function initPlayerStyles() {
        var playerContainer =   document.getElementById('player-container'),
            controls =          playerContainer.querySelector('.controls'),
            progressBar =       playerContainer.querySelector('.controls .progress-bar'),
            progress =          playerContainer.querySelector('.controls .progress'),
            tick =              playerContainer.querySelector(".controls .tick"),
            curLabel =          playerContainer.querySelector('.controls .curtime'),
            durLabel =          playerContainer.querySelector('.controls .durtime'),
            controlsWidth =     Math.ceil(playerContainer.offsetHeight / 2);

        controls.style.width = controlsWidth+"px";
        progress.style.width = "0px";
        tick.style.left = "-1px";
        controls.style.display = "inline-block";// ***

        var durLabelWidth =     durLabel.offsetWidth;//Get this after controls are displayed (ref to ***)
        progressBar.style.width = controlsWidth - durLabelWidth*2 + "px";
        durLabel.style.width = durLabelWidth + "px";
        curLabel.style.width = durLabelWidth + "px";
    }

    /**
     * Update styles for player's custom controls if duration has changed
     * @method updatePlayerStyles
     * @memberof module:Utils
     * @access public
     * @returns {undefined}
     */
    function updatePlayerStyles(duration) {
        var playerContainer = document.getElementById('player-container'),
            durLabel = playerContainer.querySelector(".controls .durtime"),
            progressBar = playerContainer.querySelector('.controls .progress-bar'),
            controlsWidth = Math.ceil(playerContainer.offsetHeight / 2);

        var timeStrUpdated = Utils.getTimeStr(duration);
        durLabel.innerHTML = timeStrUpdated;

        var durLabelWidth = durLabel.scrollWidth;
        durLabel.style.width = durLabelWidth + "px";
        progressBar.style.width = controlsWidth - durLabelWidth*2 + "px";
    }

    /**
     * Update current time label for player's custom controls
     * @method updatePlayerCurtimeLabel
     * @memberof module:Utils
     * @access public
     * @returns {undefined}
     */
    function updatePlayerCurtimeLabel() {
        updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped

        //Init html elements
        updatePlayerCurtimeLabel.video = document.querySelector('#player-container #vid');
        updatePlayerCurtimeLabel.curtimeLabel = document.querySelector("#player-container .controls .curtime");

        updatePlayerCurtimeLabel.interval = setInterval(updatePlayerCurtimeLabel.updateFn, 10);
    }
    updatePlayerCurtimeLabel.updateFn = function() {
        var video = this.video || document.querySelector('#player-container #vid'),
            curtimeLabel = this.curtimeLabel || document.querySelector("#player-container .controls .curtime");

        if (curtimeLabel && video) {
            if (video.paused && video.currentTime !== video.duration) return;
            curtimeLabel.innerHTML = getTimeStr(video.currentTime);
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
        console.log(APP_INFO, TAG, 'updatePlayerCurtimeLabel: stop updating if it is in progress (interval!=undefined): interval:', this.interval);
        if (!this.interval) return;
        updatePlayerCurtimeLabel.updateFn();//this perform last curtime label update on audio ended event if event fired right after last timeupdate event
        clearInterval(this.interval);

        this.video = undefined;
        this.curtimeLabel = undefined;
        this.interval = undefined;
        console.log(APP_INFO, TAG, 'updatePlayerCurtimeLabel: stop');
    }

    /**
     * Set, get current view - photo, media-player and etc
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
        var playerContainer = document.getElementById("player-container"),
            pictureContainer = document.getElementById("picture-container");

        var getRecentViewInfo = function () {
            return {
                mode: recentView.mode
            };
        };
        var setView = function (mode) {
            recentView.mode = mode;

            playerContainer.style.display = 'none';
            pictureContainer.style.display = 'none';

            switch (mode) {
                case 'photo':
                    pictureContainer.style.display = 'block';
                    break;
                case 'media-player':
                    playerContainer.style.display = 'block';
                    displayLoading(false); // display a loading screen
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
     * @param {HTML Element} infoEl - to be styled
     * @param {Object} data - message received from sender, contains media info
     * @returns {undefined}
     */
    function setMediaInfo(infoEl, data) {
        var titleEl = infoEl.querySelector('.title'),
            descEl = infoEl.querySelector('.desc'),
            title = data.media.title || 'No Song Name',
            artist = data.media.artist || 'No Artist Name',
            album = data.media.album || 'No Album Name';

        titleEl.innerHTML = title;
        descEl.innerHTML = artist + ' - ' + album;
    }

    /**
     * Set css style and corresponding vendor prefixes
     * @method setVendorStyle
     * @memberof module:Utils
     * @access public
     * @param {HTML Element} element - to be styled
     * @param {String} property - style name that should be set (for ex. "Transform")
     * @param {String} value - (for ex. "rotate(90deg)")
     * @returns {undefined}
     */
    function setVendorStyle(element, property, value) {
        console.log(APP_INFO, TAG, 'setVendorStyle: property: ', property, ' value: ', value);
        element.style["webkit" + property] = value;
        element.style["moz" + property] = value;
        element.style["ms" + property] = value;
        element.style["o" + property] = value;
        element.style[property.toLowerCase()] = value;
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
        console.log(APP_INFO, TAG, "getImageOrientation: ", source);
        if ((source instanceof window.Image || source instanceof window.HTMLImageElement)
            && source.exifdata) {
            source.exifdata = null;
        }

        EXIF.getData(source, function () {
            var exif = EXIF.getAllTags(this),
                ori = exif.Orientation;
            console.log(APP_INFO, TAG, exif);
            console.log(APP_INFO, TAG, "Orientation", ori);
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
        console.log(APP_INFO, TAG, 'getTimeStr: secs:', secs, ' return str:', str);
        return str;
    }

    /**
     * Send message to client app
     * @method sendMessageToSender
     * @memberof module:Utils
     * @access public
     * @param {String} senderId - senderId
     * @param {Object} dataObj - Message content
     * @returns {undefined}
     */
    function sendMessageToSender(senderId, dataObj) {
        try {
            if (!window.messageBus || !senderId || !dataObj) return;
            var data = JSON.stringify(dataObj);
            window.messageBus.send(senderId, data);
        } catch(e) {
            console.error(APP_INFO, TAG, e);
        }
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
             * Apply initial styles for player's custom controls
             */
            initPlayerStyles: initPlayerStyles,
            /**
             * Update styles for player's custom controls if duration has changed
             */
            updatePlayerStyles: updatePlayerStyles,
            /**
             * Update current time label for player's custom controls
             */
            updatePlayerCurtimeLabel: updatePlayerCurtimeLabel,
            /**
             * Set, get current view - photo, media-player and etc
             */
            viewManager: viewManager
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
        sendMessageToSender: sendMessageToSender
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Utils = Utils;
}
