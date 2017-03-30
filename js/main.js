'use strict';

var tvApp = {

    senderId: null,
    stateObj: {},
    eventBus: null,
    /**
     * App initialization.
     *
     * @return {undefined} Result: app initialized.
     */
    init: function(){
        var tvApp = this;

        tvApp.eventBus = document;
        tvApp.header = $('#header');
        tvApp.headband = $('#headband');
        tvApp.videoThumbnail = $('#thumbnail');
        tvApp.loading = $('#loading');
        tvApp.message = $('#message');//PAUSED, errors, etc
        tvApp.playerContainer = $("#player-container");
        tvApp.playerEl = $("#html5-player");

        tvApp.picture1 = new Picture({
            container: $('#picture-1')
        });

        tvApp.picture2 = new Picture({
            container: $('#picture-2')
        });

        PictureManager.addPicture(tvApp.picture1);
        PictureManager.addPicture(tvApp.picture2);

        /*
         * Create player after all initialization steps
         */
        var config = {};
        config.player = tvApp.playerEl;
        tvApp.player = new VisualMediaPlayer(config);
        tvApp.soundtrack = new Soundtrack({player: $("#soundtrack")});
        tvApp.slideshow = Slideshow.getInstance();

        tvApp.registerFastCastEvents(); // registering of system events
    },
    pause: function() {
        if (!Utils.isEventValid()) return;
        tvApp.player.pause();
        Page.message.set('<span> PAUSED </span>').display();
    },
    /**
     * Add listeners for FastCast module events
     * FastCast module catchs events from Sender app and dispatches JS CustomEvent
     *
     * @return {undefined} Result: Sender event callbacks are registered.
     */
    registerFastCastEvents: function() {
        /*
         * Event load_start_picture
         * Fires when LOAD_START event is received to show picture
         */
        this.eventBus.addEventListener('load_start_picture', function(e) {
            console.log(Constants.APP_INFO, 'load_start_picture', e);
            tvApp.stateObj = e.detail;
            if (!tvApp.stateObj.media) return;

            var url = tvApp.stateObj.media.url,
                orientation = tvApp.stateObj.media.exif,
                hasOrientation = orientation !== null && orientation !== undefined;

            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": url,
                "media_event": {"event" : Constants.MediaEvent.MEDIA_LOAD_START}
            };
            Utils.sendMessageToSender(message);

            console.log(Constants.APP_INFO, 'url', url);
            console.log(Constants.APP_INFO, 'orientation', orientation);

            /*
             * SLIDESHOW
             ********************************************************************************/
            if (tvApp.slideshow.started) {
                tvApp.slideshow.onSlideLoadStart({type: "PICTURE"});

                /*
                 * FIRST SLIDE
                 * Show loading page
                 */
                if (tvApp.slideshow.isLoadingPageRequired()) {
                    showLoadingPage();
                /*
                 * NEXT_SLIDE || PREVIOUS_SLIDE
                 * Show audio page with spinner above thumbnail
                 */
                } else if (tvApp.slideshow.custom) {
                    if (tvApp.stateObj.media.thumbnail) showThumbnail();
                    else showLoadingPage();
                /*
                 * AUTO SLIDE
                 */
                } else {
                    //Just load picture in background then show
                }


                if (Animation.getType() == 'MOSAIC' && !Animation.mosaic.initialized) {
                    $.when(Animation.mosaic.init())
                    .done(function() {
                        console.log(Constants.APP_INFO, 'Animation mosaic: initialized');
                        displayImage();
                    });
                } else displayImage();
            /*
             * NO SLIDESHOW
             ********************************************************************************/
            } else {
                if (tvApp.stateObj.media.thumbnail) showThumbnail();
                else showLoadingPage();

                displayImage();
            }

            function showThumbnail() {
                Page.thumbnail.display({flag: true, type: 'picture', cb: function() {
                    console.log(Constants.APP_INFO, 'Stage is prepared', prepareStage.prepared);
                    if (!prepareStage.prepared) prepareStage();
                    tvApp.videoThumbnail.addClass('displayed');
                }});
            }

            function showLoadingPage() {
                if (!prepareStage.prepared) prepareStage();
                Page.loading.display(true);
            }

            function prepareStage() {
                prepareStage.prepared = true;
                Page.clearStage({showLoader: false});
                tvApp.player.stop();
            }
            prepareStage.prepared = false;

            /**
             * Load and display image.
             */
            function displayImage() {
                console.log(Constants.APP_INFO, 'Load image: ', url);

                PictureManager.stopLoading();

                var bPicture = PictureManager.getBottomPictureObj();
                if (!bPicture) {
                    onLoadImageError();
                    return;
                }

                bPicture.load(url, onLoadImageSuccess, onLoadImageError);

                function onLoadImageSuccess() {
                    console.log(Constants.APP_INFO, 'onLoadImageSuccess');
                    if (!prepareStage.prepared) prepareStage();

                    /*Here image is fully loaded and displayed*/
                    if (hasOrientation) bPicture.rotate(orientation);

                    Page.thumbnail.display({flag: false});
                    Page.loading.display(false);

                    var tPicture = PictureManager.getTopPictureObj();

                    Animation.reset(bPicture.getContainer(), tPicture.getContainer());

                    if (tvApp.slideshow.started) {
                        /*
                         * AUTO SLIDE
                         * It's the only case when we need animation
                         */
                        if (!tvApp.slideshow.isLoadingPageRequired() &&
                            !tvApp.slideshow.custom &&
                            Utils.ui.viewManager.getRecentViewInfo().mode == 'photo') {
                            PictureManager.animate(bPicture, tPicture);
                        /*
                         * FIRST SLIDE || NEXT_SLIDE || PREVIOUS_SLIDE
                         */
                        } else tPicture.hide();

                        tvApp.slideshow.onSlideLoadComplete();
                    } else {
                        tPicture.hide();
                    }

                    Utils.ui.viewManager.setView('photo');

                    var message = {
                        "event": "MEDIA_PLAYBACK",
                        "message": url,
                        "media_event": {"event": Constants.MediaEvent.MEDIA_LOAD_COMPLETE}
                    };
                    Utils.sendMessageToSender(message);
                }

                /**
                 * Function callback at failure.
                 *
                 * @param {object} e Object details.
                 * @param {undefined} Result: displaying an error.
                 */
                function onLoadImageError(e) {
                    var error = new MediaError();
                    console.log(Constants.APP_INFO, 'Load image error callback: ', url);
                    console.log(Constants.APP_INFO, 'Load image error: ', e);
                    console.log(Constants.APP_INFO, 'Load image: MediaError: ', error);

                    if (!tvApp.slideshow.started) {
                        // Hide whatever page is currently shown.
                        $('.page').removeClass('displayed');
                        Page.header.display(true);
                        Page.message.set(error.description).display()
                    } else tvApp.slideshow.onSlideLoadError();

                    /* Send messages to Sender app*/
                    var message_1 = {
                        "event": "ERROR",
                        "media": { "url": url },
                        "error": error
                    };
                    var message_2 = {
                        "event": "MEDIA_PLAYBACK",
                        "message": url,
                        "media_event": {
                            "event": Constants.MediaEvent.MEDIA_ERROR,
                            "code": error.code,
                            "description": error.description
                        }
                    };
                    Utils.sendMessageToSender(message_1);
                    Utils.sendMessageToSender(message_2);
                }
            }
        });
        /*
         * Event load_start_audio
         * Fires when LOAD_START event is received to play audio
         */
        this.eventBus.addEventListener('load_start_audio', function(e) {
            console.log(Constants.APP_INFO, 'load_start_audio', e);
            tvApp.stateObj = e.detail;
            tvApp.stateObj.loadStarted = false;

            if (!tvApp.stateObj.media) return;
            var url = tvApp.stateObj.media.url;
            console.debug(Constants.APP_INFO, "Received command to play url: " + url);

            /*
             * SLIDESHOW
             ********************************************************************************/
            if (tvApp.slideshow.started) {
                tvApp.slideshow.onSlideLoadStart({type: "MEDIA"});

                /*
                 * FIRST SLIDE
                 * Show loading page
                 */
                if (tvApp.slideshow.isLoadingPageRequired()) {
                    Page.clearStage({showLoader: false});
                    Page.loading.display(true);
                /*
                 * NEXT_SLIDE || PREVIOUS_SLIDE
                 * Show audio page with spinner above thumbnail
                 */
                } else if (tvApp.slideshow.custom) {
                    Page.clearStage({showLoader: false});
                    Page.musicPlayer.display();
                /*
                 * AUTO SLIDE
                 */
                } else {
                    //Audio page will be shown on canplay event
                }
            /*
             * NO SLIDESHOW
             ********************************************************************************/
            } else {
                Page.clearStage({showLoader: false});
                Page.musicPlayer.display();
            }

            /*
             * Start fix VZMERA-148 (Video/audio freeze)
             * Root cause: Media cannot be playing automatically if video tag is not displayed before setting src
             */
            tvApp.playerContainer.addClass("displayed");
            /* End fix */
            tvApp.player.stop();
            tvApp.player.play(url);
        });
        /*
         * Event load_start_video
         * Fires when LOAD_START event is received to play video in slideshow mode, otherwise to show thumbnail with play button
         */
        this.eventBus.addEventListener('load_start_video', function(e) {
            console.log(Constants.APP_INFO, 'load_start_video', e);
            tvApp.stateObj = e.detail;
            tvApp.stateObj.loadStarted = false;

            if (!tvApp.stateObj.media) return;
            var url = tvApp.stateObj.media.url;
            console.debug(Constants.APP_INFO, "Received command to play url: " + url);

            /*
             * SLIDESHOW
             ********************************************************************************/
            if (tvApp.slideshow.started) {
                tvApp.slideshow.onSlideLoadStart({type: "MEDIA"});
                /*
                 * FIRST SLIDE
                 * 1) Show loading page
                 * 2) Load thumbnail but don't show
                 * 3) Stop player
                 * 4) Trigger "resume" event
                 */
                if (tvApp.slideshow.isLoadingPageRequired()) {
                    Page.clearStage({showLoader: false});
                    Page.loading.display(true);
                    setTimeout(function() {
                        tvApp.player.stop();
                        Utils.triggerEvent("resume");
                    }, 500);
                /*
                 * NEXT_SLIDE || PREVIOUS_SLIDE
                 * 1) Load and show thumbnail with a spinner
                 * 2) Stop player
                 * 3) Trigger "resume" event
                 */
                } else if (tvApp.slideshow.custom) {
                    Page.thumbnail.display({flag: true, type: 'video', withSpinner: true, cb: function() {
                        Page.clearStage({showLoader: false});
                        tvApp.videoThumbnail.addClass('displayed');
                        tvApp.player.stop();
                        Utils.triggerEvent("resume");
                    }});
                /*
                 * AUTO SLIDE
                 * 1) Load thumbnail but don't show
                 * 2) Stop player
                 * 3) Trigger "resume" event
                 */
                } else {
                    setTimeout(function() {
                        tvApp.player.stop();
                        Utils.triggerEvent("resume");
                    }, 500);
                }
            /*
             * NO SLIDESHOW
             ********************************************************************************/
            } else {
                Page.thumbnail.display({flag: true, type: 'video', cb: function() {
                    tvApp.player.stop();
                    Page.clearStage({showLoader: false});
                    tvApp.videoThumbnail.addClass('displayed');
                }});
            }
        });
        /*
         * Event pause
         * Fires when PAUSE event is received to pause audio/video/slideshow
         */
        this.eventBus.addEventListener('pause', function(e) {
            console.log(Constants.APP_INFO, 'pause', e);
            if (tvApp.slideshow.started) tvApp.slideshow.pause();
            else tvApp.pause();
        });
        /*
         * Event resume
         * Fires when RESUME event is received either to resume audio/video/slideshow or load video and start playback
         */
        this.eventBus.addEventListener('resume', function(e) {
            console.log(Constants.APP_INFO, 'resume', tvApp.stateObj);

            var media = tvApp.stateObj.media;
            if (!media) return;

            if (!tvApp.stateObj.loadStarted && media.type == 'VIDEO') {
                tvApp.stateObj.loadStarted = true;

                if (!tvApp.slideshow.started) Page.thumbnail.display({showLoading: true});

                /*
                 * Start fix VZMERA-148 (Video/audio freeze)
                 * Root cause: Media cannot be playing automatically if video tag is not displayed before setting src
                 */
                tvApp.playerContainer.addClass("displayed");
                /* End fix */
                tvApp.player.play(media.url); // start media playback
            } else {
                var message = {
                    "event": "MEDIA_PLAYBACK",
                    "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                    "media_event": { "event" : Constants.MediaEvent.MEDIA_RESUME }
                };
                Utils.sendMessageToSender(message);
                Page.message.set('');

                if (tvApp.slideshow.started) tvApp.slideshow.resume();
                if (!Utils.isEventValid()) return;
                tvApp.player.resume();
            }
        });
        /*
         * Event start_slideshow
         */
        this.eventBus.addEventListener('start_slideshow', function(e) {
            console.log(Constants.APP_INFO, 'start_slideshow', e);
            tvApp.slideshow.start(e && e.detail);

            var message = {
                "event": "MEDIA_PLAYBACK",
                "media_event": { "event" : Constants.MediaEvent.SLIDESHOW_STARTED }
            };
            Utils.sendMessageToSender(message);
        });
        /*
         * Event stop_slideshow
         */
        this.eventBus.addEventListener('stop_slideshow', function() {
            console.log(Constants.APP_INFO, 'stop_slideshow');
            tvApp.slideshow.stop();

            var message = {
                "event": "MEDIA_PLAYBACK",
                "media_event": { "event" : Constants.MediaEvent.SLIDESHOW_STOPPED }
            };
            Utils.sendMessageToSender(message);
        });
        /*
         * Event next_slideshow
         */
        this.eventBus.addEventListener('next_slide', function(e) {
            console.log(Constants.APP_INFO, 'next_slide');
            tvApp.slideshow.next();
        });
        /*
         * Event previous_slideshow
         */
        this.eventBus.addEventListener('previous_slide', function(e) {
            console.log(Constants.APP_INFO, 'previous_slide');
            tvApp.slideshow.previous();
        });
        /*
         * Event stop_media
         * Stops playback and navigates to Landing page
         */
        this.eventBus.addEventListener('stop_media', function() {
            console.log(Constants.APP_INFO, 'stop_media');

            var message = {
                "event": "MEDIA_PLAYBACK",
                "media_event": { "event" : Constants.MediaEvent.MEDIA_STOPPED }
            };
            Utils.sendMessageToSender(message);

            tvApp.player.stop();
            PictureManager.stopLoading();

            Page.clearStage({showLoader: false});
            Page.headband.display(true);
        });
    }
};

window.onload = function() {
    tvApp.init();
    // Turn on debugging so that you can see what is going on.  Please turn this off
    // on your production receivers to improve performance.
    cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

    FastCast.init(Constants.APP_NAMESPACE, function(){
        FastCast.onSenderConnected(function(event) {
            console.log(Constants.APP_INFO, 'Received Sender Connected event: ' + event.data);
            console.log(Constants.APP_INFO, window.castReceiverManager.getSender(event.data).userAgent);
        });

        FastCast.onSenderDisconnected(function(event) {
            console.log(Constants.APP_INFO, 'Received Sender Disconnected event: ' + event.data);
            //if (window.castReceiverManager.getSenders().length == 0) window.close();
        });
        FastCast.connect();
    });
};
