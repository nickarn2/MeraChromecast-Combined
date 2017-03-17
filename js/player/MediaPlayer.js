'use strict';

/**
 * Player object constructor.
 *
 * @param   {Object} config - Playback and player configuration.
 * @returns {Object}
 */
function MediaPlayer(config) {
    var self = this;
    self._player = config && config.player[0] || null;

    self._className = 'MediaPlayer';
    self._appInfo = "v" + Config.app.version + " " + Config.app.tv_type + " : ";
    self._log = function() {
        var info = '';
        if (arguments.length) {
            for (var i=0; i < arguments.length; i++) {
                if (typeof arguments[i] == 'object') info += ' ' + JSON.stringify(arguments[i]);
                else info += ' ' + arguments[i];
            }
        }
        console.log(self._appInfo, self._className, 'Id: ' + self._player.id, info);
    }

    /*self.state = STATE[0];
    self._STATE = [
        "NONE",     // 0: initial state
        "PAUSED",   // 1: paused
        "RESUMED"   // 2: resumed
    ];*/

    /**
     * Start media playback.
     *
     * @param {string} url URL of media content.
     * @return {undefined} Result: starting media playback.
     */
    self.play = function(url) {
        if (!self._player || !url) return;
        self._player.src = url;
    };
    /**
     * Stop media playback.
     *
     * @return {undefined} Result: stopping media playback.
     */
    self.stop = function() {
        if ( !self._player ) return;

        if (self._player.src && self._player.src.length) {
            self._log('stop playback:' + self._player.src);
            self._player.pause();
            //self.state = STATE[0];
            self._player.src = "";
            self._player.removeAttribute('src');
            self._player.load();//force buffering
            self._player.removeAttribute('poster');
        }
    };
    /**
     * Control of a video playback.
     *
     * @param {string} event Type of action ("RESUME" or "PAUSE").
     * @return {undefined} Result: control of a video playback (playback/pause of video).
     */
    self.pause = function() {
        if ( !self._player ) return;

        self._log('pause ' + self._player.src);
        self._player.pause();
        //self.state = STATE[1];
    };
    self.resume = function() {
        if ( !self._player ) return;

        self._log('resume ' + self._player.src);
        self._player.play();
        //self.state = STATE[2];
    };
}
