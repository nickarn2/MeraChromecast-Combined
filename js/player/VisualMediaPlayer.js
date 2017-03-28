'use strict';

/**
 * VisualMediaPlayer object constructor.
 *
 * VisualMediaPlayer represents an object to be used for Video/Audio views
 * @param   {Object} config - Playback and player configuration.
 * @returns {Object}
 */
function VisualMediaPlayer(config) {
    MediaPlayer.apply(this, arguments);//Inherit MediaPlayer
    registerCallbacks();

    var self = this;
    self._className = 'VisualMediaPlayer';

    function registerCallbacks() {
        if (!mPlayerCallbacks) return;
        mPlayerCallbacks.registerHTML5Callbacks();
    };

    /**
     * Start media playback.
     * @param {string} url URL of media content.
     * @return {undefined} Result: starting media playback.
     */
    var parentPlay = self.play;
    self.play = function(url) {
        parentPlay(url);
        self._log('play:' + url);
        self.registerEvents();
    }

    /**
     * Stop media playback.
     * @return {undefined} Result: stopping media playback.
     */
    var parentStop = self.stop;
    self.stop = function() {
        parentStop();
        self.unregisterEvents();
    }

    /**
     * Register player events
     * @return {undefined}
     */
    self.registerEvents = function() {
        self._log('registerEvents');

        self._player.addEventListener('abort', onAbort, false);
        self._player.addEventListener('canplay', onCanplay, false);
        self._player.addEventListener('canplaythrough', onCanplayThrough, false);
        self._player.addEventListener('durationchange', onDurationChange, false);
        self._player.addEventListener('loadeddata', onLoadedData, false);
        self._player.addEventListener('loadedmetadata', onLoadedMetadata, false);
        self._player.addEventListener('loadstart', onLoadstart, false);
        self._player.addEventListener('pause', onPause, false);
        self._player.addEventListener('play', onPlay, false);
        self._player.addEventListener('playing', onPlaying, false);
        self._player.addEventListener('progress', onProgress, false);
        self._player.addEventListener('ratechange', onRatechange, false);
        self._player.addEventListener('seeked', onSeeked, false);
        self._player.addEventListener('seeking', onSeeking, false);
        self._player.addEventListener('stalled', onStalled, false);
        self._player.addEventListener('suspend', onSuspend, false);
        self._player.addEventListener('timeupdate', onTimeUpdate, false);
        self._player.addEventListener('volumechange', onVolumechange, false);
        self._player.addEventListener('waiting', onWaiting, false);
        self._player.addEventListener('ended', onEnded, false);
        self._player.addEventListener('error', onError, false);
    };

    /**
     * Unregister player events
     * @return {undefined}
     */
    self.unregisterEvents = function() {
        self._log('unregisterEvents');

        self._player.removeEventListener('abort', onAbort, false);
        self._player.removeEventListener('canplay', onCanplay, false);
        self._player.removeEventListener('canplaythrough', onCanplayThrough, false);
        self._player.removeEventListener('durationchange', onDurationChange, false);
        self._player.removeEventListener('loadeddata', onLoadedData, false);
        self._player.removeEventListener('loadedmetadata', onLoadedMetadata, false);
        self._player.removeEventListener('loadstart', onLoadstart, false);
        self._player.removeEventListener('pause', onPause, false);
        self._player.removeEventListener('play', onPlay, false);
        self._player.removeEventListener('playing', onPlaying, false);
        self._player.removeEventListener('progress', onProgress, false);
        self._player.removeEventListener('ratechange', onRatechange, false);
        self._player.removeEventListener('seeked', onSeeked, false);
        self._player.removeEventListener('seeking', onSeeking, false);
        self._player.removeEventListener('stalled', onStalled, false);
        self._player.removeEventListener('suspend', onSuspend, false);
        self._player.removeEventListener('timeupdate', onTimeUpdate, false);
        self._player.removeEventListener('volumechange', onVolumechange, false);
        self._player.removeEventListener('waiting', onWaiting, false);
        self._player.removeEventListener('ended', onEnded, false);
        self._player.removeEventListener('error', onError, false);
    };

    function onAbort() {
        self._log('event: abort');
        var onAbort = new CustomEvent('mp_abort');
        document.dispatchEvent(onAbort);
    }

    function onCanplay() {
        self._log('event: canplay');

        var onCanplay = new CustomEvent('mp_canplay', {detail: {url: self._player.src}});
        document.dispatchEvent(onCanplay);
    }

    function onCanplayThrough() {
        self._log('event: canplaythrough');
        var onCanplayThrough = new CustomEvent('mp_canplaythrough');
        document.dispatchEvent(onCanplayThrough);
    }

    function onDurationChange() {
        self._log('event: durationchange');
        var onDurationChange = new CustomEvent('mp_durationchange', {detail: {duration: self._player.duration}});
        document.dispatchEvent(onDurationChange);
    }

    function onLoadedData() {
        self._log('event: loadeddata');
        var onLoadedData = new CustomEvent('mp_loadeddata');
        document.dispatchEvent(onLoadedData);
    }

    function onLoadedMetadata(e) {
        self._log('event: loadedmetadata: duration:'+self._player.duration);
        var onLoadedMetadata = new CustomEvent('mp_loadedmetadata', {detail: {duration: self._player.duration}});
        document.dispatchEvent(onLoadedMetadata);
    }

    function onLoadstart() {
        self._log('event: loadstart');
        var onLoadstart = new CustomEvent('mp_loadstart');
        document.dispatchEvent(onLoadstart);
    }

    function onPause() {
        self._log('event: pause');
        var onPause = new CustomEvent('mp_pause');
        document.dispatchEvent(onPause);
    }

    function onPlay() {
        self._log('event: play');
        var onPlay = new CustomEvent('mp_play');
        document.dispatchEvent(onPlay);
    }

    function onPlaying(e) {
        self._log('event: playing');
        var onPlaying = new CustomEvent('mp_playing');
        document.dispatchEvent(onPlaying);
    }

    function onProgress(e) {
        self._log('event: progress');
        var onProgress = new CustomEvent('mp_progress');
        document.dispatchEvent(onProgress);
    }

    function onRatechange() {
        self._log('event: ratechange');
        var onRatechange = new CustomEvent('mp_ratechange', {detail: {playbackRate: self._player.playbackRate}});
        document.dispatchEvent(onRatechange);
    }

    function onSeeked() {
        self._log('event: seeked');
        var onSeeked = new CustomEvent('mp_seeked', {detail: {currentTime: self._player.currentTime}});
        document.dispatchEvent(onSeeked);
    }

    function onSeeking() {
        self._log('event: seeking');
        var onSeeking = new CustomEvent('mp_seeking', {detail: {currentTime: self._player.currentTime}});
        document.dispatchEvent(onSeeking);
    }

    function onStalled() {
        self._log('event: stalled');
        var onStalled = new CustomEvent('mp_stalled');
        document.dispatchEvent(onStalled);
    }

    function onSuspend() {
        self._log('event: suspend');
        var onSuspend = new CustomEvent('mp_suspend');
        document.dispatchEvent(onSuspend);
    }

    function onTimeUpdate() {
        self._log('event: timeupdate: currentTime:'+self._player.currentTime);
        var onTimeUpdate = new CustomEvent('mp_timeupdate', {detail: {currentTime: self._player.currentTime, duration: self._player.duration}});
        document.dispatchEvent(onTimeUpdate);
    }

    function onVolumechange() {
        self._log('event: volumechange: volume:' + self._player.volume);
        var onVolumechange = new CustomEvent('mp_volumechange', {detail: {volume: self._player.volume}});
        document.dispatchEvent(onVolumechange);
    }

    function onWaiting() {
        self._log('event: waiting');
        var onWaiting = new CustomEvent('mp_waiting');
        document.dispatchEvent(onWaiting);
    }

    function onEnded() {
        self._log('event: ended');
        var onEnded = new CustomEvent('mp_ended');
        document.dispatchEvent(onEnded);
    }

    function onError(e) {
        var code = self._player.error && self._player.error.code,
            error = new MediaError(code);

        self._log('Load error: ' + self._player.src);
        self._log('Load error: internal code: ' + code);
        self._log('Load error: MediaError', error);

        var onErrorPlayingEvent = new CustomEvent('mp_error', {detail: {url: self._player.src, error: error}});
        document.dispatchEvent(onErrorPlayingEvent);
    }
}
