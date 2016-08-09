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
            4: "Audio/video not supported"//MEDIA_ERR_SRC_NOT_SUPPORTED
        },
        /*
         * This var is used to fix VZMERA-26 (fails to play video after black screen issue - VZMERA-25)
         * Workaround:
         * 1) add loop attr to video tag
         * 2) update lastcurrenttime on onTimeUpdate()
         * 3) Check if lastcurrenttime !== 0 and current time became 0 (video is going to be repeated)
         * 4) Pause video, call onEnded function and turn on silenceMode which prevents informing sender app about playback status
         *
         * If you want to loop video: fakeLoop = player.loop && false
         * If you want to back to the previous behaviour please remove loop attr from video tag (index.html)
         */
        fakeLoop = player.loop && true,
        silenceMode = false;

    console.log(APP_INFO, TAG, EXTRA_TAG, 'fakeLoop', fakeLoop);

    function isSilenceMode() {
        if (silenceMode) console.log(APP_INFO, TAG, EXTRA_TAG, 'Silence mode is turned on.');
        return silenceMode;
    }

    var MediaPlayer = {
        state: STATE[0],
        lastcurrenttime: 0,
        init: function() {
            if ( !player ) return;
            this.registerEvents();
        },
        /**
         * Start media playback.
         *
         * @param {string} url URL of media content.
         * @return {undefined} Result: starting media playback.
         */
        play: function(url) {
            if (!player || !url) return;

            console.log(APP_INFO, TAG, EXTRA_TAG, 'play:', url);
            silenceMode = false;
            this.registerEvents();
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
            silenceMode = false;

            if (player.src && player.src.length) {
                console.log(APP_INFO, TAG, EXTRA_TAG, 'stop playback:', player.src);
                player.pause();
                me.state = STATE[0];
                me.lastcurrenttime = 0;
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
        if (isSilenceMode()) return;
        onReadyToPlay = new CustomEvent('gc:canplay', {detail: {url: player.src}});
        document.dispatchEvent(onReadyToPlay);

        MediaPlayer.state = STATE[2];
    }

    function onCanplayThrough() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: canplaythrough");
        if (isSilenceMode()) return;
        var onCanplayThrough = new CustomEvent('gc:canplaythrough');
        document.dispatchEvent(onCanplayThrough);
    }

    function onDurationChange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: durationchange");
        if (isSilenceMode()) return;
        var onDurationChange = new CustomEvent('gc:durationchange', {detail: {duration: player.duration}});
        document.dispatchEvent(onDurationChange);
    }

    function onLoadedData() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadeddata");
        if (isSilenceMode()) return;
        var onLoadedData = new CustomEvent('gc:loadeddata');
        document.dispatchEvent(onLoadedData);
    }

    function onLoadedMetadata(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadedmetadata: duration:", player.duration);
        if (isSilenceMode()) return;
        var onLoadedMetadata = new CustomEvent('gc:loadedmetadata', {detail: {duration: player.duration}});
        document.dispatchEvent(onLoadedMetadata);
    }

    function onLoadstart() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: loadstart");
        if (isSilenceMode()) return;
        var onLoadstart = new CustomEvent('gc:loadstart');
        document.dispatchEvent(onLoadstart);
    }

    function onPause() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: pause");
        if (isSilenceMode()) return;
        var onPause = new CustomEvent('gc:pause');
        document.dispatchEvent(onPause);
    }

    function onPlay() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: play");
        if (isSilenceMode()) return;
        var onPlay = new CustomEvent('gc:play');
        document.dispatchEvent(onPlay);
    }

    function onPlaying(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: playing");
        if (isSilenceMode()) return;
        var onPlaying = new CustomEvent('gc:playing');
        document.dispatchEvent(onPlaying);
    }

    function onProgress(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: progress");
        if (isSilenceMode()) return;
        var onProgress = new CustomEvent('gc:progress');
        document.dispatchEvent(onProgress);
    }

    function onRatechange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: ratechange');
        if (isSilenceMode()) return;
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
        if (isSilenceMode()) return;
        var onSeeking = new CustomEvent('gc:seeking', {detail: {currentTime: player.currentTime}});
        document.dispatchEvent(onSeeking);
    }

    function onStalled() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: stalled');
        if (isSilenceMode()) return;
        var onStalled = new CustomEvent('gc:stalled');
        document.dispatchEvent(onStalled);
    }

    function onSuspend() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: suspend');
        if (isSilenceMode()) return;
        var onSuspend = new CustomEvent('gc:suspend');
        document.dispatchEvent(onSuspend);
    }

    function onTimeUpdate(e) {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: timeupdate: currentTime:", player.currentTime);
        if ( fakeLoop && MediaPlayer.lastcurrenttime !== 0 && player.currentTime == 0 ) {
            console.log(APP_INFO, TAG, EXTRA_TAG, 'fake end');
            //NOTE: if loop == true -> ended event won't be fired
            //Hence take it as an end of the video
            player.pause();
            onEnded();
            silenceMode = true;
        }
        MediaPlayer.lastcurrenttime = player.currentTime;
        if (isSilenceMode()) return;

        var onTimeUpdate = new CustomEvent('gc:timeupdate', {detail: {currentTime: player.currentTime}});
        document.dispatchEvent(onTimeUpdate);
    }

    function onVolumechange() {
        console.log(APP_INFO, TAG, EXTRA_TAG, "event: volumechange: volume:", player.volume);
        var onVolumechange = new CustomEvent('gc:volumechange', {detail: {volume: player.volume}});
        document.dispatchEvent(onVolumechange);
    }

    function onWaiting() {
        console.log(APP_INFO, TAG, EXTRA_TAG, 'event: waiting');
        if (isSilenceMode()) return;
        var onWaiting = new CustomEvent('gc:waiting');
        document.dispatchEvent(onWaiting);
    }

    function onEnded(e) {
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