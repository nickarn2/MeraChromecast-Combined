'use strict'

var APP_NAMESPACE = 'urn:x-cast:com.verizon.smartview',
    TAG = 'Smartview',
    APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ",
    FAILED_TO_LOAD_MSG = 'Failed to load resource';

var senderId = null;
var tvApp = {

    stateObj: {},
    preloadImg: new Image(),
    init: function(){
        var tvApp = this;

        tvApp.videoThumbnail = document.getElementById('thumbnail');
        tvApp.headband = document.getElementById('headband')
        Page.init( tvApp );
    }

};

var pictureContainer = document.getElementById('picture-container'),
    picture = document.getElementById("picture"),
    playerContainer = document.getElementById("player-container"),
    playerEl = document.getElementById("vid"),
    player = new MediaPlayer({player: playerEl}),
    msg = document.getElementById("msg"),
    castMsg = document.getElementById("cast-msg"),
    httpService = new HttpService();

window.onload = function() {
    tvApp.init();
    // Turn on debugging so that you can see what is going on.  Please turn this off
    // on your production receivers to improve performance.
    cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

    Page.headband.display(true); // display a headband screen

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
            if (parsed.media) tvApp.stateObj = parsed;

            var event = parsed.event,
                type = tvApp.stateObj.media && tvApp.stateObj.media.type;

            if ( event == "LOAD_START" ) {
                if ( !tvApp.stateObj.media ) return;
                tvApp.stateObj.loadStarted = false;

                console.log(APP_INFO, TAG, type);
                switch( type ) {
                    case 'PICTURE':
                        displayImage(); // display image
                        break;
                    case 'AUDIO':
                        playPause(event); // control of a video playback
                        break;
                    case 'VIDEO':
                        Page.thumbnail.display({flag: true, type:'video', cb: function() {
                            clearStage({showLoader: false, showThumbnail: true}); // reset a screen state by default
                            pictureContainer.style.display = 'none';
                            player.stop(); // stop media playback
                        }});
                        break;
                }
            } else if ( event == "RESUME" || event == "PAUSE" ) {
                playPause(event); // control of a video playback
            } else if ( event == "STOP_MEDIA" ) {
                stopMedia();
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

    //Utils.ui.updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped
    playerContainer.style.display = "none";
    playerContainer.removeAttribute("poster");
    playerContainer.querySelector(".artwork").style.backgroundImage = "";
    playerContainer.querySelector(".info .title").innerHTML = "";
    playerContainer.querySelector(".info .desc").innerHTML = "";
    playerContainer.querySelector(".controls").style.display = "none";
    playerContainer.querySelector(".controls .durtime").innerHTML = "0:00";
    playerContainer.querySelector(".controls .curtime").innerHTML = "0:00";

    pictureContainer.style.display = "block";
    picture.style.backgroundImage = "";
    picture.style.backgroundSize = "contain";
    Page.headband.display(false); // don't display a headband screen
    Page.loading.display(false); // don't display a loading screen
    if (!options || !options.showThumbnail) Page.thumbnail.display({flag: false});  // don't display a thumbnail
    if (!options || options.showLoader) Page.loading.display(true); // display a loading screen
}

/**
 * Display image.
 *
 * @return {undefined} Result: displaying an image.
 */
function displayImage() {
    var url = tvApp.stateObj.media.url,
        orientation = tvApp.stateObj.media.exif,
        hasOrientation = orientation !== null && orientation !== undefined;

    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
            "media_event": { "event" : "loadstart" }
        };
        Utils.sendMessageToSender(senderId, message);
    }

    console.log(APP_INFO, TAG, url);

    displayImage();

    if (tvApp.stateObj.media && tvApp.stateObj.media.thumbnail) {
        Page.thumbnail.display({flag: true, type: 'picture', cb: function() {
            console.log(APP_INFO, TAG, 'Stage is prepared', prepareStage.prepared);
            if (!prepareStage.prepared) prepareStage();
        }});
    } else {
        if (!prepareStage.prepared) prepareStage();
        Page.loading.display(true);
    }

    function prepareStage() {
        prepareStage.prepared = true;
        clearStage({showLoader: false, showThumbnail: true}); // reset a screen state by default
        Utils.ui.viewManager.setView('photo');
        player.stop(); // stop media playback
        httpService.stop(); // cancel current HTTP-query*/
    }
    prepareStage.prepared = false;

    /**
     * Load and display image.
     */
    function displayImage() {
        console.log(APP_INFO, TAG, 'Load image: ', url);
        Utils.ui.setVendorStyle(picture, "Transform", "none");

        tvApp.preloadImg.src = "";//Stop loading previous picture
        tvApp.preloadImg.onload = null;
        tvApp.preloadImg.onerror = null;

        tvApp.preloadImg.onload = function () {
            console.log(APP_INFO, TAG, 'Load image success: ', url, ' Display.');
            console.log(APP_INFO, TAG, 'Stage is prepared', prepareStage.prepared);
            if (!prepareStage.prepared) prepareStage();

            picture.style.backgroundImage = 'url(' + url + ')';
            /*Here image is fully loaded and displayed*/
            if (hasOrientation) rotateImage(orientation);

            Page.thumbnail.display({flag: false});
            Page.loading.display(false);

            if (senderId) {
                var message = {
                    "event": "MEDIA_PLAYBACK",
                    "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                    "media_event": {"event": "loadcomplete"}
                };
                Utils.sendMessageToSender(senderId, message);
            }
        }
        tvApp.preloadImg.onerror = onLoadImageError;
        tvApp.preloadImg.src = url;

        function rotateImage(ori) {
            console.log(APP_INFO, TAG, 'rotateImage');

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

            console.log(APP_INFO, TAG, 'rotateImage deg: ', deg, ' ori:', ori);
            console.log(APP_INFO, TAG, 'rotateImage picture.offsetHeight: ', picture.offsetHeight);

            if (deg.length) transStyle += " rotate(" + deg + ")";
            if (flipV) transStyle += " scaleX(-1)";
            if (flipH) transStyle += " scaleY(-1)";

            if (transStyle.length) Utils.ui.setVendorStyle(picture, "Transform", transStyle);
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

        Page.thumbnail.display({flag: false}); // display a thumbnail
        Page.loading.display(false);
        Page.header.display();
        msg.innerHTML = e.detail && e.detail.msg || FAILED_TO_LOAD_MSG;
        msg.style.display = 'block';

        // e.detail exists if image had to be loaded with auth params (secure)
        var desc = e.detail && e.detail.desc ? e.detail.desc : FAILED_TO_LOAD_MSG,
            code = e.detail && e.detail.code ? e.detail.code : 0;

        if (senderId) {
            var message = {
                "event": "ERROR",
                "media": {"url": url},
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
    if (!tvApp.stateObj.loadStarted) {
        console.log(APP_INFO, '!loadStarted');
        tvApp.stateObj.loadStarted = true;

        switch(tvApp.stateObj.media.type) {
            case 'AUDIO':
                clearStage({showLoader: false}); // reset a screen state by default

                Utils.ui.viewManager.setView('media-player');

                //checking if thumbnail is present is inside the following function
                Utils.ui.setArtwork(playerContainer.querySelector(".artwork"), tvApp.stateObj.media.thumbnail);
                Utils.ui.setMediaInfo(playerContainer.querySelector(".info"), tvApp.stateObj);
                //Utils.ui.updatePlayerCurtimeLabel();
                Page.header.display(); // display a header with Verizon logo
                break;
            case 'VIDEO':
                Page.thumbnail.display({showLoading: true});
                break;
        }

        httpService.stop(); // cancel current HTTP-query
        player.stop(); // stop media playback
        player.play(tvApp.stateObj.media.url); // start media playback
    } else if (event == 'PAUSE' || event == 'RESUME') {
        console.log("Current view", Utils.ui.viewManager.getRecentViewInfo().mode);

        var COMMAND_NOT_VALID =
            Utils.ui.viewManager.getRecentViewInfo().mode !== 'media-player' &&
            !tvApp.stateObj.loadStarted;

        if (COMMAND_NOT_VALID) return;

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
                    "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                    "media_event": { "event" : "resume" }
                };
                Utils.sendMessageToSender(senderId, message);
                break;
        }
    }
}

/**
 * Stop media
 */
function stopMedia() {
    console.log(APP_INFO, TAG, 'stop_media');

    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "media_event": { "event" : "mediastopped" }
        };
        Utils.sendMessageToSender(senderId, message);
    }

    player.stop();
    tvApp.preloadImg.src = "";
    tvApp.preloadImg.onload = null;
    tvApp.preloadImg.onerror = null;

    clearStage({showLoader: false, showThumbnail: false});
    Page.headband.display(true);
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
            "media_event": { "event" : "abort" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onReadyToPlay(e) {
    console.log(APP_INFO, TAG, 'onReadyToPlay: ', e);
    var media = tvApp.stateObj.media;

    switch (media.type) {
        case "VIDEO":
            Utils.ui.viewManager.setView('media-player');
            if (media.thumbnail) playerContainer.setAttribute("poster", media.thumbnail);
            Page.thumbnail.display({flag: false});
            break;
        case "AUDIO":
            playerContainer.querySelector('.artwork .loader').classList.remove('displayed');
            break;
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
    Page.header.display();

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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
            "media_event": { "event" : "loadeddata" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onLoadedMetadata(e) {
    var type = tvApp.stateObj.media && tvApp.stateObj.media.type,
        timeStr = "0:00";
    if (type =='AUDIO') {
        tvApp.stateObj.media.duration = e.detail.duration;
        var durtime = document.querySelector("#player-container .controls .durtime"),
            curtime = document.querySelector("#player-container .controls .curtime");

        curtime.innerHTML = timeStr;
        if (tvApp.stateObj.media.duration) timeStr = Utils.getTimeStr(tvApp.stateObj.media.duration);
        durtime.innerHTML = timeStr;

        Utils.ui.initPlayerStyles();
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
            "media_event": { "event" : "suspend" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}

function onTimeupdate(e) {
    var type = tvApp.stateObj.media && tvApp.stateObj.media.type;
    if (type =='AUDIO') {
        if (!tvApp.stateObj.media && !tvApp.stateObj.media.duration) return;
        if (tvApp.stateObj.media.duration != e.detail.duration) {
            console.log(APP_INFO, TAG, 'Duration has updated. Prev value: ', tvApp.stateObj.media.duration, '. Cur value: ', e.detail.duration);
            //Possible fix for VZMERA-79
            Utils.ui.updatePlayerStyles(e.detail.duration);
        }

        var progressBarWidth = document.querySelector("#player-container .controls .progress-bar").offsetWidth,
            progress = document.querySelector("#player-container .controls .progress"),
            tick = document.querySelector("#player-container .controls .tick"),
            value = Math.floor( e.detail.currentTime * progressBarWidth / e.detail.duration );

        progress.style.width = value + "px";
        tick.style.left = (value-1) + "px";// 1 - half of tick's width, minus to center element horizontally

        tvApp.stateObj.media.duration = e.detail.duration;
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
    var type = tvApp.stateObj.media && tvApp.stateObj.media.type;
    switch (type) {
        case 'AUDIO':
            //Utils.ui.updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped
            break;
        case 'VIDEO':
            Page.thumbnail.display({flag: true, type: 'video', cache: true}); // display a thumbnail
            break;
    }

    /* Send messages to Sender app*/
    if (senderId) {
        var message = {
            "event": "MEDIA_PLAYBACK",
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
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
            "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
            "media_event": { "event" : "waiting" }
        };
        Utils.sendMessageToSender(senderId, message);
    }
}
