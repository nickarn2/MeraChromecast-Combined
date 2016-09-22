'use strict';

/**
 * Player object constructor.
 *
 * @param   {Object} config - Playback and player configuration.
 * @returns {Object}
 */
function MediaPlayer(config) {
    var player = config && config.player || null,
        onReadyToPlay = null,
        onErrorPlayingEvent = null,

        TAG = 'Smartview',
        EXTRA_TAG = 'MediaPlayer',
        APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ",
        STATE = [
            "NONE",     // 0: initial state
            "PAUSED",   // 1: paused
            "RESUMED"   // 2: resumed
        ],
        ERROR_CODES = {
            1: "Fetching process aborted by user",//MEDIA_ERR_ABORTED
            2: "Error occurred when downloading",//MEDIA_ERR_NETWORK
            3: "Error occurred when decoding",//MEDIA_ERR_DECODE
            4: "There was an issue casting your content. Please try again."//MEDIA_ERR_SRC_NOT_SUPPORTED
        };

    var MediaPlayer = {
        state: STATE[0],
        /**
         * Start media playback.
         *
         * @param {string} url URL of media content.
         * @return {undefined} Result: starting media playback.
         */
        play: function(url) {
            if (!player || !url) return;
            var me = this;

            console.log(APP_INFO, TAG, EXTRA_TAG, 'play:', url);
            me.registerEvents();
            player.src = url;
        },
        /**
         * Stop media playback.
         *
         * @return {undefined} Result: stopping media playback.
         */
        stop: function() {
            if ( !player ) return;
            var me = this;

            if (player.src && player.src.length) {
                console.log(APP_INFO, TAG, EXTRA_TAG, 'stop playback:', player.src);
                player.pause();
                me.state = STATE[0];
                me.unregisterEvents();
                player.src = "";
                player.load();//force buffering
                player.removeAttribute('src');
                player.removeAttribute('poster');
            }
        },
        /**
         * Control of a video playback.
         *
         * @param {string} event Type of action ("RESUME" or "PAUSE").
         * @return {undefined} Result: control of a video playback (playback/pause of video).
         */
        pauseResume: function(event) {
            if ( !player ) return;
            var me = this;

            console.log(APP_INFO, TAG, EXTRA_TAG, event, player.src);
            switch (event) {
                case "PAUSE":
                    player.pause();
                    me.state = STATE[1];
                    break;
                case "RESUME":
                    player.play(); // start media playback
                    me.state = STATE[2];
                    break;
            }
        },
        registerEvents: function() {
            console.log(APP_INFO, TAG, EXTRA_TAG, 'registerEvents');

            player.addEventListener('abort', onAbort, false);
            player.addEventListener('canplay', onCanplay, false);
            player.addEventListener('canplaythrough', onCanplayThrough, false);
            player.addEventListener('durationchange', onDurationChange, false);
            player.addEventListener('loadeddata', onLoadedData, false);
            player.addEventListener('loadedmetadata', onLoadedMetadata, false);
            player.addEventListener('loadstart', onLoadstart, false);
            player.addEventListener('pause', onPause, false);
            player.addEventListener('play', onPlay, false);
            player.addEventListener('playing', onPlaying, false);
            player.addEventListener('progress', onProgress, false);
            player.addEventListener('ratechange', onRatechange, false);
            player.addEventListener('seeked', onSeeked, false);
            player.addEventListener('seeking', onSeeking, false);
            player.addEventListener('stalled', onStalled, false);
            player.addEventListener('suspend', onSuspend, false);
            player.addEventListener('timeupdate', onTimeUpdate, false);
            player.addEventListener('volumechange', onVolumechange, false);
            player.addEventListener('waiting', onWaiting, false);
            player.addEventListener('ended', onEnded, false);
            player.addEventListener('error', onError, false);
        },
        unregisterEvents: function() {
            console.log(APP_INFO, TAG, EXTRA_TAG, 'unregisterEvents');
            player.removeEventListener('abort', onAbort, false);
            player.removeEventListener('canplay', onCanplay, false);
            player.removeEventListener('canplaythrough', onCanplayThrough, false);
            player.removeEventListener('durationchange', onDurationChange, false);
            player.removeEventListener('loadeddata', onLoadedData, false);
            player.removeEventListener('loadedmetadata', onLoadedMetadata, false);
            player.removeEventListener('loadstart', onLoadstart, false);
            player.removeEventListener('pause', onPause, false);
            player.removeEventListener('play', onPlay, false);
            player.removeEventListener('playing', onPlaying, false);
            player.removeEventListener('progress', onProgress, false);
            player.removeEventListener('ratechange', onRatechange, false);
            player.removeEventListener('seeked', onSeeked, false);
            player.removeEventListener('seeking', onSeeking, false);
            player.removeEventListener('stalled', onStalled, false);
            player.removeEventListener('suspend', onSuspend, false);
            player.removeEventListener('timeupdate', onTimeUpdate, false);
            player.removeEventListener('volumechange', onVolumechange, false);
            player.removeEventListener('waiting', onWaiting, false);
            player.removeEventListener('ended', onEnded, false);
            player.removeEventListener('error', onError, false);
        }
    }

    function onAbort() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: abort");
        var onAbort = new CustomEvent('gc:abort');
        document.dispatchEvent(onAbort);
    }

    function onCanplay() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: canplay");
        onReadyToPlay = new CustomEvent('gc:canplay', {detail: {url: player.src}});
        document.dispatchEvent(onReadyToPlay);

        MediaPlayer.state = STATE[2];
    }

    function onCanplayThrough() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: canplaythrough");
        var onCanplayThrough = new CustomEvent('gc:canplaythrough');
        document.dispatchEvent(onCanplayThrough);
    }

    function onDurationChange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: durationchange");
        var onDurationChange = new CustomEvent('gc:durationchange', {detail: {duration: player.duration}});
        document.dispatchEvent(onDurationChange);
    }

    function onLoadedData() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadeddata");
        var onLoadedData = new CustomEvent('gc:loadeddata');
        document.dispatchEvent(onLoadedData);
    }

    function onLoadedMetadata(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadedmetadata: duration:", player.duration);
        var onLoadedMetadata = new CustomEvent('gc:loadedmetadata', {detail: {duration: player.duration}});
        document.dispatchEvent(onLoadedMetadata);
    }

    function onLoadstart() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadstart");
        var onLoadstart = new CustomEvent('gc:loadstart');
        document.dispatchEvent(onLoadstart);
    }

    function onPause() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: pause");
        var onPause = new CustomEvent('gc:pause');
        document.dispatchEvent(onPause);
    }

    function onPlay() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: play");
        var onPlay = new CustomEvent('gc:play');
        document.dispatchEvent(onPlay);
    }

    function onPlaying(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: playing");
        var onPlaying = new CustomEvent('gc:playing');
        document.dispatchEvent(onPlaying);
    }

    function onProgress(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: progress");
        var onProgress = new CustomEvent('gc:progress');
        document.dispatchEvent(onProgress);
    }

    function onRatechange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: ratechange');
        var onRatechange = new CustomEvent('gc:ratechange', {detail: {playbackRate: player.playbackRate}});
        document.dispatchEvent(onRatechange);
    }

    function onSeeked() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: seeked');
        var onSeeked = new CustomEvent('gc:seeked', {detail: {currentTime: player.currentTime}});
        document.dispatchEvent(onSeeked);
    }

    function onSeeking() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: seeking');
        var onSeeking = new CustomEvent('gc:seeking', {detail: {currentTime: player.currentTime}});
        document.dispatchEvent(onSeeking);
    }

    function onStalled() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: stalled');
        var onStalled = new CustomEvent('gc:stalled');
        document.dispatchEvent(onStalled);
    }

    function onSuspend() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: suspend');
        var onSuspend = new CustomEvent('gc:suspend');
        document.dispatchEvent(onSuspend);
    }

    /**
     * Function callback when HTML5 Video "timeupdate" event fired.
     *
     * @return {undefined} Result: dispatch of "gc:timeupdate" event for document and some actions with player.
     */
    function onTimeUpdate() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: timeupdate: currentTime:", player.currentTime);
        var onTimeUpdate = new CustomEvent('gc:timeupdate', {detail: {currentTime: player.currentTime, duration: player.duration}});
        document.dispatchEvent(onTimeUpdate);
    }

    function onVolumechange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: volumechange: volume:", player.volume);
        var onVolumechange = new CustomEvent('gc:volumechange', {detail: {volume: player.volume}});
        document.dispatchEvent(onVolumechange);
    }

    function onWaiting() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: waiting');
        var onWaiting = new CustomEvent('gc:waiting');
        document.dispatchEvent(onWaiting);
    }

    /**
     * Function callback when HTML5 Video "ended" event fired.
     *
     * @return {undefined} Result: dispatch of "gc:ended" event for document.
     */
    function onEnded() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: ended");
        var onEnded = new CustomEvent('gc:ended');
        document.dispatchEvent(onEnded);
    }

    function onError(e) {
        var code = player.error && player.error.code ? player.error.code : 0,
            desc = ERROR_CODES[code] || false;

        console.log(APP_INFO, TAG, EXTRA_TAG, 'Load error: ', player.src);
        console.log(APP_INFO, TAG, EXTRA_TAG, 'Load error desc: ', desc);
        console.log(APP_INFO, TAG, EXTRA_TAG, 'Load error code: ', code);

        onErrorPlayingEvent = new CustomEvent('gc:error', {detail: {url: player.src, code: code, desc: desc, originator: "HTML5_VIDEO_TAG"}});
        document.dispatchEvent(onErrorPlayingEvent);
    }

    return MediaPlayer;
}
