/**
 * @class Slideshow
 * @description The singleton class is used to manage slideshow feature
 */
var Slideshow = (function () {

    var TAG = "Slideshow";
    var soundtrackUrl = null;
    var timeoutId = null;
    var pictureSlideTimeout = null;
    var defaultTimeout = 3000;
    var slideTaskTimeoutId = null;

    var slideState = {};
    var slideDescriptions = [];
    var slideDuration = null;
    var slideTrigger = Constants.MediaEvent.MEDIA_LOAD_COMPLETE;

    /**
     * Timestamp to remember when the load_start message was sent last time
     * @type {Number} lastTimestamp in millisecs
     */
    var lastTimestamp = 0;
    /**
     * Do not send load_start message more often than once a second
     * @type {Number} MESSAGE_TIMEOUT in millisecs
     */
    var MESSAGE_TIMEOUT = 1000;

    var instance = {
        started: false,// isSlided
        resumed: true,
        slide: -1,
        isSlideRepeated: true,
        shownSlidesCount: 0,
        custom: false,
        start: function(config) {
            if (!config) return;
            removeSlideTask();
            /**
             * @type {Array} descriptions medias for slide show (may include PICTURE, VIDEO, IMAGE)
             * @type {Number} duration slide show duration (after animation is completed) in ms
             * @type {Number} animationDuration animation duration in ms
             * @type {Boolean} isRepeated if true slideshow is cycled, otherwise it stops when there is no content to fetch
             */
            var descriptions = config.slides;
            var duration = config.slide_duration || Constants.SLIDE_DURATION;
            var animationDuration = config.animation_duration || Constants.ANIMATION_DURATION;
            var isRepeated = config.is_repeated;

            instance.resumed = true;
            instance.slide = -1;
            instance.isSlideRepeated = isRepeated;

            slideDescriptions = descriptions;
            slideDuration = duration + animationDuration;
            instance.setSoundTrackUrl(config.media);

            pictureSlideTimeout =  slideDuration + defaultTimeout;
            Animation.config({
                type: config && config.type,
                duration: config && config.animation_duration
            });

            document.addEventListener('onMediaEvent', instance.onMediaEvent);
            console.log(Constants.APP_INFO, TAG, 'Picture slide timeout: ', pictureSlideTimeout);
        },
        stop: function() {
            instance.started = false;
            instance.custom = false;
            instance.slide = -1;
            instance.shownSlidesCount = 0;

            tvApp.soundtrack.stop();
            instance.setSoundTrackUrl(null);
            clearTimeoutSlideshow();
            slideState = {};

            document.removeEventListener('onMediaEvent', instance.onMediaEvent);
        },
        pause: function() {
            console.log(Constants.APP_INFO, TAG, 'pause slideshow');
            instance.resumed = false;
            if (Utils.ui.viewManager.getRecentViewInfo().mode == 'photo') tvApp.soundtrack.pause();

            Page.message.set('<span> PAUSED </span>').display();
            tvApp.pause();

            clearTimeoutSlideshow();

            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : Constants.MediaEvent.MEDIA_PAUSE }
            };
            Utils.sendMessageToSender(message);
        },
        resume: function() {
            instance.resumed = true;
            if (Utils.ui.viewManager.getRecentViewInfo().mode == 'photo') {
                stopSlideshowByTimeout(pictureSlideTimeout);
                if (tvApp.soundtrack.loaded) tvApp.soundtrack.resume();
            } else {
                if (slideState.status == Constants.MediaEvent.MEDIA_ENDED) stopSlideshowByTimeout(defaultTimeout);
            }
        },
        next: function() {
            turnOnCustomSlideshow();
            nextSlide();
        },
        previous: function() {
            turnOnCustomSlideshow();
            previousSlide();
        },
        onMediaEvent: function(e) {
            var event = e && e.detail && e.detail.event;
            console.log('onMediaEvent', event);

            switch (event) {
                // stop slide show
                case Constants.MediaEvent.SLIDESHOW_STOPPED: {
                    instance.started = false;
                    break;
                };
                // start slide show
                case Constants.MediaEvent.SLIDESHOW_STARTED: {
                    instance.started = true;
                    postSlideTask(nextSlideTask, 0);
                    break;
                };
                // stop slide show
                case Constants.MediaEvent.MEDIA_STOPPED: {
                    stopSlideshow();
                    break;
                };
                // resume slide show
                case Constants.MediaEvent.MEDIA_RESUME: {
                    instance.resumed = true;

                    if (Constants.MediaEvent.MEDIA_LOAD_COMPLETE == slideTrigger) {
                        postSlideTask(nextSlideTask, slideDuration);
                    }
                    break;
                };
                // pause slide show
                case Constants.MediaEvent.MEDIA_PAUSE: {
                    instance.resumed = false;

                    removeSlideTask();
                    break;
                };
                //slide to next on loading complete for pictures or ended event for videos and music
                case slideTrigger: {
                    if (instance.resumed) postSlideTask(nextSlideTask, Constants.MediaEvent.MEDIA_LOAD_COMPLETE == slideTrigger ? slideDuration : 0);
                    break;
                };
                // if there is any error in content loading slide to next
                case Constants.MediaEvent.MEDIA_ERROR: {
                    if (instance.resumed) postSlideTask(nextSlideTask, 0);
                    break;
                };
            }
        },
        onSlideLoadStart: function(slideInfo) {
            clearTimeoutSlideshow();
            slideState = {
                type: slideInfo && slideInfo.type,
                status: 'loadstart'
            }
            if (slideState.type == 'PICTURE') {
                if (!tvApp.soundtrack.url) {
                    var url = instance.getSoundTrackUrl();
                    tvApp.soundtrack.load(url);
                }
            }
        },
        onSlideLoadComplete: function() {
            turnOffCustomSlideshow();

            slideState.status = Constants.MediaEvent.MEDIA_LOAD_COMPLETE;
            instance.shownSlidesCount += 1;

            if (slideState.type == 'PICTURE') stopSlideshowByTimeout(pictureSlideTimeout);
            else tvApp.soundtrack.stop();
        },
        onSlideLoadError: function() {
            slideState.status = Constants.MediaEvent.MEDIA_ERROR;
            stopSlideshowByTimeout(defaultTimeout);
        },
        onSlideMediaEnded: function() {
            slideState.status = Constants.MediaEvent.MEDIA_ENDED;
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
        },
        isLoadingPageRequired: function() {
            return instance.shownSlidesCount == 0;
        }
    }

    /**
     * Trigger stop_media event
     */
    function stopMedia() {
        console.log(Constants.APP_INFO, TAG, 'stopMedia');

        var event = new CustomEvent("stop_media");
        document.dispatchEvent(event);
    }

    /**
     * Trigger stop_slideshow event
     */
    function stopSlideshow() {
        console.log(Constants.APP_INFO, TAG, 'stopSlideshow');
        removeSlideTask();

        var event = new CustomEvent("stop_slideshow");
        document.dispatchEvent(event);
    }

    /**
     * Show next slide if slide show is active
     */
    function nextSlide() {
        if (instance.started) {
            if (!instance.resumed) {
                Utils.triggerEvent("resume", {});
            }
            postSlideTask(nextSlideTask, 0);
        }
    }

    /**
     * Show previous slide if slide show is active
     */
    function previousSlide() {
        if (instance.started) {
            if (!instance.resumed) {
                Utils.triggerEvent("resume", {});
            }
            postSlideTask(previousSlideTask, 0);
        }
    }

    /**
     * Add task to slide message queue
     * @param {Function} task task to post
     * @param {Number} delay delay for task
     */
    function postSlideTask(task, delay) {
        console.log(Constants.APP_INFO, TAG, 'postSlideTask, delay:', delay);
        removeSlideTask();
        slideTaskTimeoutId = setTimeout(task, delay);
    }

    /**
     * Clear slide message queue
     */
    function removeSlideTask() {
        clearTimeout(slideTaskTimeoutId);
    }

    /**
     * Show next slide in slideshow
     */
    function nextSlideTask() {
        showSlide(getNextSlideIndex(1));
    }

    /**
     * Show previous slide in slideshow
     */
    function previousSlideTask() {
        showSlide(getNextSlideIndex(-1));
    }

    /**
     * Change slide index
     * @param {Number} delta increment/decrement value
     * @return {Number} new slide index
     */
    function getNextSlideIndex(delta) {
        console.log(Constants.APP_INFO, TAG, 'getNextSlideIndex, delta:', delta);
        //error descriptions
        if (!slideDescriptions || !slideDescriptions.length) {
            return -1;
        }

        instance.slide += delta;

        if (instance.slide < 0) {
            instance.slide = instance.isSlideRepeated ? slideDescriptions.length - 1 : 0;
        } else if (instance.slide == slideDescriptions.length) {
            instance.slide = 0;
        }

        console.log(Constants.APP_INFO, TAG, 'nextSlideIndex', instance.slide);
        return instance.slide;
    }

    /**
     * Show slide
     * @param {Number} index slide's index to show
     */
    function showSlide(index) {
        console.log(Constants.APP_INFO, TAG, 'showSlide', index);

        if (slideDescriptions && index >= 0 && index < slideDescriptions.length) {
            var description = slideDescriptions[index];

            slideTrigger = Constants.MediaDescription.MediaType.PICTURE == description.type ? Constants.MediaEvent.MEDIA_LOAD_COMPLETE : Constants.MediaEvent.MEDIA_ENDED;

            isWaited(function(delay) {
                //Postpone fetching new content
                postSlideTask(function() {fetchNext(description);}, delay);
            }, function() {
                fetchNext(description);
            })
        } else {
            stopMedia();
        }
    }

    /**
     * Load next media to the TV
     *
     * @param {Object} mediaDescription Media content description
     */
    function fetchNext(mediaDescription) {
        var type = mediaDescription.type;
        type = type && typeof type == 'string' && type.toLowerCase();

        Utils.triggerEvent("load_start_"+type, {media: mediaDescription});
    }

    /**
     * Check if we fetch content more often than once a second. If we does - postpone it. If does not - execute.
     * Use case - user taps next slide/previous slide too often
     */
    function isWaited(postponeFn, execFn) {
        var currentTimestamp = (new Date()).getTime();
        if (currentTimestamp - lastTimestamp < MESSAGE_TIMEOUT) {
            postponeFn(lastTimestamp + MESSAGE_TIMEOUT - currentTimestamp);
        } else {
            lastTimestamp = currentTimestamp;
            execFn();
        }
    }

    /**
     * @function turnOnCustomSlideshow
     * Set flag "custom" to true. So it will show thumbnail with spinner for pictures and audio, loading page - for videos
     * Use case - user taps next slide/previous slide btn
     */
    function turnOnCustomSlideshow() {
        if (!instance.started) return;
        instance.custom = true;
    }

    /**
     * @function turnOffCustomSlideshow
     * Set flag "custom" to false. Reset behaviour for next slide/previous slide buttons
     */
    function turnOffCustomSlideshow() {
        instance.custom = false;
    }

    /**
     * @function stopSlideshowByTimeout
     * If TV didn't receive message to play next slide in some timeout - stop it
     */
    function stopSlideshowByTimeout(timeout) {
        timeout = timeout || defaultTimeout;
        console.log(Constants.APP_INFO, TAG, 'Stop slideshow by timeout: ', timeout);

        timeoutId = setTimeout(function() {
            console.log(Constants.APP_INFO, TAG, 'Timed out');
            stopMedia();//then it will trigger stop_slideshow event
        }, timeout);
    }

    /**
     * @function clearTimeoutSlideshow
     * Clear timeout on load start event, on pause, on stop slideshow
     */
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
