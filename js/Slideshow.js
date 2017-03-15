/**
 * @class Slideshow
 * @description The singleton class is used to manage slideshow feature
 */
var Slideshow = (function () {

    var TAG = "Slideshow";
    var soundtrackUrl = null,
        timeoutId = null,
        pictureSlideTimeout = null,
        defaultTimeout = 3000;

    var slideState = {};

    var instance = {
        started: false,
        paused: false,
        slide: 1,
        custom: false,
        start: function(config) {
            instance.started = true;

            if (config && config.media) tvApp.slideshow.setSoundTrackUrl(config.media);
            tvApp.soundtrack.load(tvApp.slideshow.getSoundTrackUrl());

            Animation.config({
                type: config && config.type,
                duration: config && config.animation_duration
            });

            pictureSlideTimeout =   (config && config.animation_duration || Constants.ANIMATION_DURATION) +
                                    (config && config.slide_duration || Constants.SLIDE_DURATION) +
                                    defaultTimeout;

            console.log(Constants.APP_INFO, TAG, 'Picture slide timeout: ', pictureSlideTimeout);
        },
        stop: function() {
            instance.started = false;
            instance.custom = false;
            instance.slide = 1;

            tvApp.soundtrack.stop();
            instance.setSoundTrackUrl(null);
            clearTimeoutSlideshow();
            slideState = {};
        },
        pause: function() {
            console.log(Constants.APP_INFO, TAG, 'pause slideshow');
            instance.paused = true;
            if (Utils.ui.viewManager.getRecentViewInfo().mode == 'photo') tvApp.soundtrack.pause();

            Page.message.set('<span> PAUSED </span>').display();
            tvApp.pause();

            clearTimeoutSlideshow();

            var message = {
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "pause" }
            };
            Utils.sendMessageToSender("MEDIA_PLAYBACK", message);
        },
        resume: function() {
            instance.paused = false;
            if (Utils.ui.viewManager.getRecentViewInfo().mode == 'photo') {
                stopSlideshowByTimeout(pictureSlideTimeout);
                if (tvApp.soundtrack.loaded) tvApp.soundtrack.resume();
            } else {
                if (slideState.status == 'ended') stopSlideshowByTimeout(defaultTimeout);
            }
        },
        next: function() {
            turnOnCustomSlideshow();
        },
        previous: function() {
            turnOnCustomSlideshow();
        },
        onSlideLoadStart: function(slideInfo) {
            clearTimeoutSlideshow();
            slideState = {
                type: slideInfo && slideInfo.type,
                status: 'loadstart'
            }
        },
        onSlideLoadComplete: function() {
            instance.slide++;
            turnOffCustomSlideshow();

            slideState.status = 'loadcomplete';
            if (slideState.type == 'PICTURE') stopSlideshowByTimeout(pictureSlideTimeout);
        },
        onSlideLoadError: function() {
            slideState.status = 'error';
            stopSlideshowByTimeout(defaultTimeout);
        },
        onSlideMediaEnded: function() {
            slideState.status = 'ended';
            stopSlideshowByTimeout(defaultTimeout);
        },
        setSoundTrackUrl: function(media) {
            if (media && media.url && media.type == 'AUDIO')  soundtrackUrl = media.url;
            else {
                soundtrackUrl = null;
                if (tvApp.soundtrack) tvApp.soundtrack.lastCurrentTime = 0;
            }
        },
        getSoundTrackUrl: function() {
            return soundtrackUrl;
        },
        isSlideNumber: function(number) {
            return instance.started && instance.slide === number;
        }
    }

    function turnOnCustomSlideshow() {
        if (!instance.started) return;
        instance.custom = true;
    }

    function turnOffCustomSlideshow() {
        instance.custom = false;
    }

    function stopSlideshowByTimeout(timeout) {
        timeout = timeout || defaultTimeout;
        console.log(Constants.APP_INFO, TAG, 'Stop slideshow by timeout: ', timeout);

        timeoutId = setTimeout(function() {
            console.log(Constants.APP_INFO, TAG, 'Timed out');
            instance.stop();

            var event = new CustomEvent("stop_media");
            document.dispatchEvent(event);
        }, timeout);
    }

    function clearTimeoutSlideshow() {
        console.log(Constants.APP_INFO, TAG, 'Clear timeout');
        clearTimeout(timeoutId);
    }

    return {
        getInstance: function () {
            return instance;
        }
    };
})();
