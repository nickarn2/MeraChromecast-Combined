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
    /**
     * Reset a screen state by default.
     *
     * @param {object} options Options.
     * @return {undefined} Result: reset a screen state by default (hide messages, reset a media player state, show a empty picture container, hide a headband, show/hide a loading).
     */
    clearStage: function(options) {
        console.log(Constants.APP_INFO, 'clearStage: options: ', options);
        $('.page').removeClass('displayed');

        if (!options || !options.showCastMsg) Page.message.set('');
        else if (options.showCastMsg) Page.message.display();

        tvApp.playerContainer.removeAttr("poster");
        tvApp.playerContainer.find(".artwork").css("background-image", "");
        tvApp.playerContainer.find(".artwork .loader").removeClass("displayed");
        tvApp.playerContainer.find(".info .title").empty();
        tvApp.playerContainer.find(".info .desc").empty();
        tvApp.playerContainer.find(".controls").css("display", "none");
        tvApp.playerContainer.find(".controls .durtime").empty().html("0:00");
        tvApp.playerContainer.find(".controls .curtime").empty().html("0:00");

        if (!options || options.showLoader) Page.loading.display(true); // display a loading screen
    },
    showAudioPage: function() {
        console.log(Constants.APP_INFO, 'Show audio page');
        tvApp.stateObj.loadStarted = true;

        PictureManager.stopLoading();
        Utils.ui.viewManager.setView('audio-player');

        //checking if thumbnail is present is inside the following function
        Utils.ui.setArtwork(tvApp.playerContainer.find(".artwork"), tvApp.stateObj.media.thumbnail);
        Utils.ui.setMediaInfo(tvApp.playerContainer.find(".info"), tvApp.stateObj);
        //Utils.ui.updatePlayerCurtimeLabel();
        Page.header.display(true); // display a header with Verizon logo
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

            if (tvApp.slideshow.started) tvApp.slideshow.onSlideLoadStart({type: "PICTURE"});

            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": url,
                "media_event": {"event" : "loadstart"}
            };
            Utils.sendMessageToSender(message);

            console.log(Constants.APP_INFO, 'url', url);
            console.log(Constants.APP_INFO, 'orientation', orientation);

            if (tvApp.slideshow.isSlideNumber(1)) {
                if (!prepareStage.prepared) prepareStage();
                Page.loading.display(true);
            } else if (!tvApp.slideshow.started || tvApp.slideshow.custom) {
                if (tvApp.stateObj.media.thumbnail) {
                    Page.thumbnail.display({flag: true, type: 'picture', cb: function() {
                        console.log(Constants.APP_INFO, 'Stage is prepared', prepareStage.prepared);
                        if (!prepareStage.prepared) prepareStage();
                        tvApp.videoThumbnail.addClass('displayed');
                    }});
                } else {
                    if (!prepareStage.prepared) prepareStage();
                    Page.loading.display(true);
                }
            }

            if (tvApp.slideshow.started && Animation.getType() == 'MOSAIC' && !Animation.mosaic.initialized) {
                $.when(Animation.mosaic.init())
                .done(function() {
                    console.log(Constants.APP_INFO, 'Animation mosaic: initialized');
                    displayImage();
                });
            } else displayImage();

            function prepareStage() {
                prepareStage.prepared = true;
                tvApp.clearStage({showLoader: false});
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
                    Utils.ui.viewManager.setView('photo');

                    /*Here image is fully loaded and displayed*/
                    if (hasOrientation) bPicture.rotate(orientation);

                    Page.thumbnail.display({flag: false});
                    Page.loading.display(false);

                    var tPicture = PictureManager.getTopPictureObj();

                    Animation.reset(bPicture.getContainer(), tPicture.getContainer());

                    if (tvApp.slideshow.started &&
                        !tvApp.slideshow.isSlideNumber(1) &&
                        !tvApp.slideshow.custom &&
                        Utils.ui.viewManager.getRecentViewInfo().mode == 'photo'
                    ) {
                        PictureManager.animate(bPicture, tPicture);
                    } else {
                        tPicture.hide();
                    }

                    if (tvApp.slideshow.started) tvApp.slideshow.onSlideLoadComplete();

                    var message = {
                        "event": "MEDIA_PLAYBACK",
                        "message": url,
                        "media_event": {"event": "loadcomplete"}
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
                            "event": "error",
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

            if (tvApp.slideshow.started) tvApp.slideshow.onSlideLoadStart({type: "MEDIA"});
            if (
                tvApp.slideshow.started &&
                !tvApp.slideshow.custom &&
                Utils.ui.viewManager.getRecentViewInfo().mode == 'video-player' &&
                !tvApp.slideshow.isSlideNumber(1)
            ) {
                Page.thumbnail.display({flag: true, type:'video', showOnlyThumb: true, cache: true});
            }

            tvApp.player.stop();
            tvApp.player.play(url);

            if (!tvApp.slideshow.started || tvApp.slideshow.custom) {
                tvApp.clearStage({showLoader: false});
                tvApp.showAudioPage();
            } else if (tvApp.slideshow.isSlideNumber(1)) {
                tvApp.clearStage({showLoader: false});
                Page.loading.display(true);
            }
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

            if (tvApp.slideshow.started) tvApp.slideshow.onSlideLoadStart({type: "MEDIA"});
            if (
                tvApp.slideshow.started &&
                !tvApp.slideshow.custom &&
                Utils.ui.viewManager.getRecentViewInfo().mode == 'video-player' &&
                !tvApp.slideshow.isSlideNumber(1)
            ) {
                Page.thumbnail.display({flag: true, type: 'video', showOnlyThumb: true, cache: true});
            }

            if (!tvApp.slideshow.started) {
                Page.thumbnail.display({flag: true, type: 'video', cb: function() {
                    tvApp.player.stop();
                    tvApp.clearStage({showLoader: false});
                    tvApp.videoThumbnail.addClass('displayed');
                }});
            } else {
                tvApp.stateObj.loadStarted = true;
                if (tvApp.slideshow.isSlideNumber(1)) {
                    tvApp.clearStage({showLoader: false});
                    Page.loading.display(true);
                    Page.thumbnail.display({flag: true, type:'video', loadThumb: true});
                    tvApp.player.stop();
                    tvApp.player.play(tvApp.stateObj.media.url);
                } else if (tvApp.slideshow.custom) {
                    Page.thumbnail.display({flag: true, type: 'video', withSpinner: true, cb: function() {
                        tvApp.clearStage({showLoader: false});
                        tvApp.videoThumbnail.addClass('displayed');
                        tvApp.player.stop();
                        tvApp.player.play(url);
                    }});
                } else {
                    Page.thumbnail.display({flag: true, type:'video', loadThumb: true});
                    tvApp.player.stop();
                    tvApp.player.play(url);
                }
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

            if (tvApp.slideshow.started) tvApp.slideshow.resume();

            if (!tvApp.stateObj.loadStarted && media.type == 'VIDEO') {
                tvApp.stateObj.loadStarted = true;

                Page.thumbnail.display({showLoading: true});
                tvApp.player.play(media.url); // start media playback
            } else {
                var message = {
                    "event": "MEDIA_PLAYBACK",
                    "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                    "media_event": { "event" : "resume" }
                };
                Utils.sendMessageToSender(message);
                Page.message.set('');

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
                "media_event": { "event" : "slideshowstarted" }
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
                "media_event": { "event" : "slideshowstopped" }
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
                "media_event": { "event" : "mediastopped" }
            };
            Utils.sendMessageToSender(message);

            tvApp.player.stop();
            PictureManager.stopLoading();

            tvApp.clearStage({showLoader: false});
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
