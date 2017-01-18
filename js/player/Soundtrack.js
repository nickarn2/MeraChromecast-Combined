'use strict';

/**
 * Soundtrack object constructor.
 *
 * Soundtrack represents an object to be used for slideshow soundtrack
 * @param   {Object} config - Playback and player configuration.
 * @returns {Object}
 */
function Soundtrack(config) {
    MediaPlayer.apply(this, arguments);//Inherit MediaPlayer

    var self = this,
        callback = null,
        timeoutFn = null,
        timeout = 5000;
    self._className = 'Soundtrack';

    self.url = null;
    self.loaded = false;
    self.error = false;
    self.stopped = false;
    self.setCallback = function(cb) {
        self._log('setCallback', typeof cb);
        callback = cb;
    }

    /**
     * Start media playback.
     *
     * @param {string} url URL of media content.
     * @return {undefined} Result: starting media playback.
     */
    var parentPlay = self.play;
    self.load = function(url, onSuccess, onError) {
        self.url = url;
        if (!url) {
            self.error = true;
            return;
        }
        parentPlay(url);
        self._log('load:' + url);
        self.loaded = false;
        self.error = false;
        self.stopped = false;
        self.registerEvents();

        timeoutFn = setTimeout(function() {
            self._log('request timed out => stop loading');
            self.stop();
            callback && callback();
        }, 5000);
    }

    self.play = function() {
        if (!self.url) return;
        self._log('play:' + self._player.src);
        self._player.play();
    }

    var parentResume = self.resume;
    self.resume = function() {
        if (!self.url) return;
        parentResume();
    };

    var parentStop = self.stop;
    self.stop = function() {
        parentStop();
        clearTimeout(timeoutFn);
        self.unregisterEvents();
        self.loaded = false;
        self.error = false;
        self.stopped = true;
    }

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
    }

    function onCanplay() {
        self._log('event: canplay');
        self.loaded = true;
        clearTimeout(timeoutFn);
        callback && callback();
    }

    function onCanplayThrough() {
        self._log('event: canplaythrough');
    }

    function onDurationChange() {
        self._log('event: durationchange');
    }

    function onLoadedData() {
        self._log('event: loadeddata');
    }

    function onLoadedMetadata(e) {
        self._log('event: loadedmetadata: duration:'+self._player.duration);
    }

    function onLoadstart() {
        self._log('event: loadstart');
    }

    function onPause() {
        self._log('event: pause');
    }

    function onPlay() {
        self._log('event: play');
    }

    function onPlaying(e) {
        self._log('event: playing');
    }

    function onProgress(e) {
        self._log('event: progress');
    }

    function onRatechange() {
        self._log('event: ratechange');
    }

    function onSeeked() {
        self._log('event: seeked');
    }

    function onSeeking() {
        self._log('event: seeking');
    }

    function onStalled() {
        self._log('event: stalled');
    }

    function onSuspend() {
        self._log('event: suspend');
    }

    function onTimeUpdate() {
        self._log('event: timeupdate: currentTime:'+self._player.currentTime);
    }

    function onVolumechange() {
        self._log('event: volumechange: volume:' + self._player.volume);
    }

    function onWaiting() {
        self._log('event: waiting');
    }

    function onEnded() {
        self._log('event: ended');
    }

    function onError(e) {
        var code = self._player.error && self._player.error.code ? self._player.error.code : 0,
            desc = self._ERROR_CODES[code] || false;

        self._log('Load error: ' + self._player.src);
        self._log('Load error desc: ' + desc);
        self._log('Load error code: ' + code);

        self.error = true;
        clearTimeout(timeoutFn);
        callback && callback();
    }
}
