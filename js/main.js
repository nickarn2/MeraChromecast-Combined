'use strict'

var APP_NAMESPACE = 'urn:x-cast:com.verizon.smartview',
    TAG = 'Smartview',
    APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ",
    FAILED_TO_LOAD_MSG = 'Failed to load resource';

var senderId = null;

var headband = document.getElementById('headband'),
    videoThumbnail = document.getElementById('video-thumbnail'),
    pictureContainer = document.getElementById('picture-container'),
    picture = document.getElementById("picture"),
    playerContainer = document.getElementById("player-container"),
    playerEl = document.getElementById("vid"),
    player = new MediaPlayer({player: playerEl}),
    msg = document.getElementById("msg"),
    castMsg = document.getElementById("cast-msg"),
    preloadImg = new Image(),
    httpService = new HttpService(),

    stateObj = {};

window.onload = function() {
    // Turn on debugging so that you can see what is going on.  Please turn this off
    // on your production receivers to improve performance.
    cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

    displayHeadband(true); // display a headband screen

    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log(APP_INFO, TAG, 'Starting Receiver Manager');

    // handler for the 'ready' event
    window.castReceiverManager.onReady = function(event) {
        console.log(APP_INFO, TAG, 'Received Ready event: ' + JSON.stringify(event.data));
        window.castReceiverManager.setApplicationState("Application status is ready...");
    };

    // handler for 'senderconnected' event
    window.castReceiverManager.onSenderConnected = function(event) {
        console.log(APP_INFO, TAG, 'Received Sender Connected event: ' + event.data);
        console.log(APP_INFO, TAG, window.castReceiverManager.getSender(event.data).userAgent);
    };

    // handler for 'senderdisconnected' event
    window.castReceiverManager.onSenderDisconnected = function(event) {
        console.log(APP_INFO, TAG, 'Received Sender Disconnected event: ' + event.data);
        //if (window.castReceiverManager.getSenders().length == 0) window.close();
    };

    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus = window.castReceiverManager.getCastMessageBus( APP_NAMESPACE );

    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function(event) {
        console.log(APP_INFO, TAG, 'Message [' + event.senderId + ']: ' + event.data);
        senderId = event.senderId;

        try {
            var parsed = JSON.parse(event.data);
            if (parsed.media) stateObj = parsed;

            var event = parsed.event,
                type = stateObj.media && stateObj.media.type;

            if ( event == "LOAD_START" ) {
                if ( !stateObj.media ) return;
                stateObj.loadStarted = false;

                console.log(APP_INFO, TAG, type);
                switch( type ) {
                    case 'PICTURE':
                        displayImage(); // display image
                        break;
                    case 'AUDIO':
                        playPause(event); // control of a video playback
                        break;
                    case 'VIDEO':
                        var parameters = stateObj.parameters,
                            isSecure = Utils.isResourceSecure(parameters); // check if parameters has a list of headers || body parameters

                        displayThumbnail(true, isSecure); // display a thumbnail
                        break;
                }
            } else if ( event == "RESUME" || event == "PAUSE" ) {
                playPause(event); // control of a video playback
            }
        } catch (event) {
            console.log(APP_INFO, TAG, 'Parse message error: ', event);
        }
    }

    // initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log(APP_INFO, TAG, 'Receiver Manager started');
};

/**
 * Reset a screen state by default.
 *
 * @param {object} options Options.
 * @return {undefined} Result: reset a screen state by default (hide messages, reset a media player state, show a empty picture container, hide a headband, show/hide a loading).
 */
function clearStage(options) {
    msg.style.display = "none";
    castMsg.innerHTML = "";

    Utils.ui.updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped
    playerContainer.style.display = "none";
    playerContainer.removeAttribute("poster");
    playerContainer.querySelector(".artwork").style.backgroundImage = "";
    playerContainer.querySelector(".info .title").innerHTML = "";
    playerContainer.querySelector(".info .desc").innerHTML = "";
    playerContainer.querySelector(".controls").style.display = "none";

    pictureContainer.style.display = "block";
    picture.style.backgroundImage = "";
    picture.style.backgroundSize = "contain";
    displayHeadband(false); // don't display a headband screen
    displayLoading(false); // don't display a loading screen
    displayThumbnail(false);  // don't display a thumbnail

    if (!options || options.showLoader) displayLoading(true); // display a loading screen
}

/**
 * Display image.
 *
 * @return {undefined} Result: displaying an image.
 */
function displayImage() {
    var url = stateObj.media.url,
        parameters = stateObj.parameters,
        orientation = stateObj.media.exif,
        isSecure = Utils.isResourceSecure(parameters); // check if parameters has a list of headers || body parameters

    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "loadstart" }
        };
        Utils.sendMessageToSender(senderId, message);
    }

    console.log(APP_INFO, TAG, url);
    console.log(APP_INFO, TAG, 'parameters', parameters);
    console.log(APP_INFO, TAG, 'isResourceSecure', isSecure);

    clearStage(); // reset a screen state by default
    Utils.ui.viewManager.setView('photo');
    preloadImg.src = "";
    preloadImg.onload = null;
    preloadImg.onerror = null;
    player.stop(); // stop media playback
    httpService.stop(); // cancel current HTTP-query

    if (isSecure) {
        httpService.getAuthResource(stateObj.media, parameters, onLoadImageSuccess, onLoadImageError); // get a secure resource
    } else {
        preloadImg.onload = onLoadImageSuccess; // function callback at success
        preloadImg.onerror = onLoadImageError; // function callback at failure
        preloadImg.src = url;
    }

    /**
     * Function callback at success.
     *
     * @param {null} unk Unknown variable.
     * @param {string} respUrl URL of thumbnail.
     * @param {object} arraybuffer Response of remote resource.
     * @return {undefined} Result: displaying a image.
     */
    function onLoadImageSuccess(unk, respUrl, arraybuffer) {
        console.log(APP_INFO, TAG, 'Load image success: ', url);
        console.log(APP_INFO, TAG, 'respUrl', respUrl);

        url = respUrl || url;
        Utils.ui.setVendorStyle(picture, "Transform", "none");

        if (orientation !== null && orientation !== undefined) showImage(orientation);
        else Utils.getImageOrientation(arraybuffer || url, showImage);

        function showImage(ori) {
            console.log(APP_INFO, TAG, 'show image');

            var transStyle = "",
                deg = "",
                flipV = false, //Flip vertically
                flipH = false; //Flip horizontally

            switch (ori) {
                case 2: flipV = true; break;
                case 3: deg = "180deg"; break;
                case 4: flipH = true; break;
                case 5:
                case 7:
                    flipV = true;
                    deg = ori == 7 ? "90deg" : "-90deg";
                    picture.style.backgroundSize = picture.offsetHeight + "px auto";
                    break;
                case 6:
                case 8:
                    deg = ori == 6 ? "90deg" : "-90deg";
                    picture.style.backgroundSize = picture.offsetHeight + "px auto";
                    break;
            }

            console.log(APP_INFO, TAG, 'showImage deg: ', deg, ' ori:', ori);
            console.log(APP_INFO, TAG, 'showImage picture.offsetHeight: ', picture.offsetHeight);

            if (deg.length) transStyle += " rotate(" + deg + ")";
            if (flipV) transStyle += " scaleX(-1)";
            if (flipH) transStyle += " scaleY(-1)";

            if (transStyle.length) Utils.ui.setVendorStyle(picture, "Transform", transStyle);

            displayLoading(false); // display a loading screen
            picture.style.backgroundImage = 'url(' + url + ')';

            if (senderId) {
                var message = {
                    "event": "MEDIA_PLAYBACK",
                    "message": stateObj.media && stateObj.media.url || "",
                    "media_event": { "event" : "loadcomplete" }
                };
                Utils.sendMessageToSender(senderId, message);
            }
        }
    }

    /**
     * Function callback at failure.
     *
     * @param {object} e Object details.
     * @param {undefined} Result: displaying an error.
     */
    function onLoadImageError(e) {
        console.log(APP_INFO, TAG, 'Load image error: ', url);
        console.log(APP_INFO, TAG, 'e', e);

        displayLoading(false); // display a loading screen
        msg.innerHTML = e.detail && e.detail.msg || FAILED_TO_LOAD_MSG;
        msg.style.display = 'block';

        // e.detail exists if image had to be loaded with auth params (secure)
        var desc = e.detail && e.detail.desc ? e.detail.desc : FAILED_TO_LOAD_MSG,
            code = e.detail && e.detail.code ? e.detail.code : 0;

        if (senderId) {
            var message = {
                "event": "ERROR",
                "media": {"url": e.detail.url},
                "error": {"description": desc, "code": code}
            };
            Utils.sendMessageToSender(senderId, message);
        }
    }
}

/**
 * Control of a video playback.
 *
 * @param {string} event Type of action ("RESUME" or "PAUSE").
 * @return {undefined} Result: control of a video playback (playback/pause of video).
 */
function playPause(event) {
    if (!stateObj.loadStarted) {
        stateObj.loadStarted = true;
        clearStage(); // reset a screen state by default
        httpService.stop(); // cancel current HTTP-query
        player.stop(); // stop media playback
        if (stateObj.media && stateObj.media.type == "AUDIO") playerEl.loop = false;
        player.play(stateObj.media.url); // start media playback
    } else if (event == 'PAUSE' || event == 'RESUME') {
        console.log("Current view", Utils.ui.viewManager.getRecentViewInfo().mode);
        if (Utils.ui.viewManager.getRecentViewInfo().mode !== 'media-player') return;

        console.log("pause/resume - proceed");
        player.pauseResume(event); // control of a video playback

        switch (event) {
            case 'PAUSE':
                castMsg.innerHTML = '<span> PAUSED </span>';
                break;
            case 'RESUME':
                castMsg.innerHTML = "";
                if (!senderId) return;
                var message = {
                    "event": "MEDIA_PLAYBACK",
                    "message": stateObj.media && stateObj.media.url || "",
                    "media_event": { "event" : "resume" }
                };
                Utils.sendMessageToSender(senderId, message);
                break;
        }
    }
}

document.addEventListener('gc:abort', onAbort, false);
document.addEventListener('gc:canplay', onReadyToPlay, false);
document.addEventListener('gc:canplaythrough', onCanplayThrough, false);
document.addEventListener('gc:durationchange', onDurationChange, false);
document.addEventListener('gc:error', onErrorPlaying, false);
document.addEventListener('gc:loadeddata', onLoadedData, false);
document.addEventListener('gc:loadedmetadata', onLoadedMetadata, false);
document.addEventListener('gc:loadstart', onLoadstart, false);
document.addEventListener('gc:pause', onPause, false);
document.addEventListener('gc:play', onPlay, false);
document.addEventListener('gc:playing', onPlaying, false);
document.addEventListener('gc:progress', onProgress, false);
document.addEventListener('gc:ratechange', onRatechange, false);
document.addEventListener('gc:seeked', onSeeked, false);
document.addEventListener('gc:seeking', onSeeking, false);
document.addEventListener('gc:stalled', onStalled, false);
document.addEventListener('gc:suspend', onSuspend, false);
document.addEventListener('gc:timeupdate', onTimeupdate, false);
document.addEventListener('gc:ended', onEnded, false);
document.addEventListener('gc:volumechange', onVolumechange, false);
document.addEventListener('gc:waiting', onWaiting, false);

function onAbort() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "abort" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onReadyToPlay(e) {
    console.log(APP_INFO, TAG, 'onReadyToPlay: ', e);
    var media = stateObj.media;
    castMsg.innerHTML = "";

    Utils.ui.viewManager.setView('media-player');

    if (media.thumbnail) {
        switch (media.type) {
            case "VIDEO": playerContainer.setAttribute("poster", media.thumbnail); break;
            case "AUDIO":
                Utils.ui.setArtwork(playerContainer.querySelector(".artwork"), media.thumbnail);
                Utils.ui.setMediaInfo(playerContainer.querySelector(".info"), stateObj);
                Utils.ui.initPlayerStyles();
                Utils.ui.updatePlayerCurtimeLabel();
                displayHeader(); // display a header with Verizon logo
                break;
        }
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message_1 = {
            "event": "MEDIA_PLAYBACK",
            "message": e.detail.url,
            "media_event": { "event" : "loadcomplete" }
        },
        message_2 = {
            "event": "MEDIA_PLAYBACK",
            "message": e.detail.url,
            "media_event": { "event" : "canplay" }
        };
        Utils.sendMessageToSender(senderId, message_1);
        Utils.sendMessageToSender(senderId, message_2);
    }
}

function onCanplayThrough() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "canplaythrough" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onDurationChange(e) {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "durationchange",
                "duration": e.detail && e.detail.duration || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onErrorPlaying(e) {
    console.log(APP_INFO, TAG, 'onErrorPlaying: ', e);

    clearStage({showLoader: false}); // reset a screen state by default

    msg.innerHTML = e.detail && e.detail.msg || e.detail.desc || FAILED_TO_LOAD_MSG;
    msg.style.display = 'block';

    // e.detail exists if image had to be loaded with auth params (secure)
    var desc = e.detail && e.detail.desc ? e.detail.desc : FAILED_TO_LOAD_MSG,
        code = e.detail && e.detail.code ? e.detail.code : 0;

    if (senderId) {
        var message_1 = {
            "event": "ERROR",
            "media": {"url": e.detail.url},
            "error": {"description": desc, "code": code}
        };
        Utils.sendMessageToSender(senderId, message_1);

        if (e.detail && e.detail.originator && e.detail.originator == "HTML5_VIDEO_TAG") {
            var message_2 = {
                "event": "MEDIA_PLAYBACK",
                "message": e.detail.url,
                "media_event": {
                    "event": "error",
                    "code": code,
                    "description": desc
                }
            };
            Utils.sendMessageToSender(senderId, message_2);
        }
    }
}

function onLoadedData() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "loadeddata" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onLoadedMetadata(e) {
    var type = stateObj.media && stateObj.media.type,
        timeStr = "0:00";
    if (type =='AUDIO') {
        stateObj.media.duration = e.detail.duration;
        var durtime = document.querySelector("#player-container .controls .durtime"),
            curtime = document.querySelector("#player-container .controls .curtime");

        curtime.innerHTML = timeStr;
        if (stateObj.media.duration) timeStr = Utils.getTimeStr(stateObj.media.duration);
        durtime.innerHTML = timeStr;
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "loadedmetadata" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onLoadstart() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "loadstart" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onPause() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "pause" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onPlay() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "play" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onPlaying() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "playing" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onProgress() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "progress" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onRatechange(e) {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "ratechange",
                "playbackRate": e.detail && e.detail.playbackRate || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onSeeked(e) {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "seeked",
                "currentTime": e.detail && e.detail.currentTime || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onSeeking(e) {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "seeking",
                "currentTime": e.detail && e.detail.currentTime || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onStalled() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "stalled" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onSuspend() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "suspend" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onTimeupdate(e) {
    var type = stateObj.media && stateObj.media.type;
    if (type =='AUDIO') {
        if (!stateObj.media && !stateObj.media.duration) return;
        if (stateObj.media.duration != e.detail.duration) {
            console.log(APP_INFO, TAG, 'Duration has updated. Prev value: ', stateObj.media.duration, '. Cur value: ', e.detail.duration);
            //Possible fix for VZMERA-79
            Utils.ui.updatePlayerStyles(e.detail.duration);
        }

        var progressBarWidth = document.querySelector("#player-container .controls .progress-bar").offsetWidth,
            progress = document.querySelector("#player-container .controls .progress"),
            tick = document.querySelector("#player-container .controls .tick"),
            value = Math.floor( e.detail.currentTime * progressBarWidth / e.detail.duration );

        progress.style.width = value + "px";
        tick.style.left = (value-1) + "px";// 1 - half of tick's width, minus to center element horizontally

        stateObj.media.duration = e.detail.duration;
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "timeupdate",
                "currentTime": e.detail && e.detail.currentTime || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onVolumechange(e) {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": {
                "event": "volume",
                "volume": e.detail && e.detail.volume || 0
            }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

/**
 * Function callback when "gc:ended" event fired.
 *
 * @return {undefined} Result: performing some actions for each content type.
 */
function onEnded() {
    var type = stateObj.media && stateObj.media.type;
    switch (type) {
        case 'AUDIO':
            Utils.ui.updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped
            break;
        case 'VIDEO':
            displayThumbnail(true, null, true); // display a thumbnail
            break;
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "ended" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onWaiting() {
    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": stateObj.media && stateObj.media.url || "",
            "media_event": { "event" : "waiting" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

/**
 * Display a header with Verizon logo.
 *
 * @return {undefined} Result: displaying a header.
 */
function displayHeader() {
    headband.classList.add('displayed');
}

/**
 * Display a headband screen.
 *
 * @param {boolean} flag Do you need display a headband screen?
 * @return {undefined} Result: show/hide a headband screen.
 */
function displayHeadband(flag) {
    var disp = 'displayed',
        headbandEl = headband.querySelector('.headband'),
        loadingEl = headband.querySelector('.loading');

    if (flag) {
        headband.classList.add(disp);
        headbandEl.classList.add(disp);
        loadingEl.classList.remove(disp);
    } else {
        headband.classList.remove(disp);
        headbandEl.classList.remove(disp);
        loadingEl.classList.remove(disp);
    }
}

/**
 * Display a loading screen.
 *
 * @param {boolean} flag Do you need display a loading screen?
 * @return {undefined} Result: show/hide a loading screen.
 */
function displayLoading(flag) {
    var disp = 'displayed',
        headbandEl = headband.querySelector('.headband'),
        loadingEl = headband.querySelector('.loading');

    if (flag) {
        headband.classList.add(disp);
        loadingEl.classList.add(disp);
        headbandEl.classList.remove(disp);
    } else {
        headband.classList.remove(disp);
        loadingEl.classList.remove(disp);
        headbandEl.classList.remove(disp);
    }
}

/**
 * Display a thumbnail.
 *
 * @param {boolean} flag Do you need display a thumbnail?
 * @param {boolean} secure Is it secure connection?
 * @param {boolean} cache Do you need get thumbnail from cache?
 * @return {undefined} Result: display a thumbnail.
 */
function displayThumbnail(flag, secure, cache) {
    var disp = 'displayed';

    if (!flag) {
        videoThumbnail.classList.remove(disp);
        return;
    }

    stateObj.loadStarted = false;
    clearStage({showLoader: false}); // reset a screen state by default
    pictureContainer.style.display = 'none';
    player.stop(); // stop media playback
    playerEl.loop = true;
    videoThumbnail.classList.add(disp);
    if (!cache) {
        videoThumbnail.querySelector('.video-thumbnail').style.backgroundImage = '';
    } else {
        return;
    }

    if (secure) {
        var thumbnail = {
            type: 'PICTURE',
            url: stateObj.media.thumbnail
        }
        httpService.getAuthResource(thumbnail, stateObj.parameters, onLoadImageSuccess, onLoadImageError); // get a secure resource
    } else {
        displayThumbnail(stateObj.media.thumbnail); // display a thumbnail
    }

    /**
     * Display a thumbnail.
     *
     * @param {string} thumbnail URL of thumbnail.
     * @return {undefined} Result: displaying a thumbnail.
     */
    function displayThumbnail(thumbnail) {
        videoThumbnail.querySelector('.video-thumbnail').style.backgroundImage = 'url(' + thumbnail + ')';
    }

    /**
     * Function callback at success.
     *
     * @param {null} unk Unknown variable.
     * @param {string} url URL of thumbnail.
     * @return {undefined} Result: displaying a thumbnail.
     */
    function onLoadImageSuccess(unk, url) {
        displayThumbnail(url); // display a thumbnail
    }

    /**
     * Function callback at failure.
     *
     * @param {object} details Object details.
     * @param {undefined} Result: to do nothing.
     */
    function onLoadImageError(details) {
        // to do nothing
    }
}
