var mPlayerCallbacks = {

    registerHTML5Callbacks: function() {
        var TAG = "mPlayerCallbacks";
        console.log(Constants.APP_INFO, 'registerHTML5Callbacks');

        document.addEventListener('mp_abort', onAbort, false);
        document.addEventListener('mp_canplay', onCanplay, false);
        document.addEventListener('mp_canplaythrough', onCanplayThrough, false);
        document.addEventListener('mp_durationchange', onDurationChange, false);
        document.addEventListener('mp_error', onErrorPlaying, false);
        document.addEventListener('mp_loadeddata', onLoadedData, false);
        document.addEventListener('mp_loadedmetadata', onLoadedMetadata, false);
        document.addEventListener('mp_loadstart', onLoadstart, false);
        document.addEventListener('mp_pause', onPause, false);
        document.addEventListener('mp_play', onPlay, false);
        document.addEventListener('mp_playing', onPlaying, false);
        document.addEventListener('mp_progress', onProgress, false);
        document.addEventListener('mp_ratechange', onRatechange, false);
        document.addEventListener('mp_seeked', onSeeked, false);
        document.addEventListener('mp_seeking', onSeeking, false);
        document.addEventListener('mp_stalled', onStalled, false);
        document.addEventListener('mp_suspend', onSuspend, false);
        document.addEventListener('mp_timeupdate', onTimeupdate, false);
        document.addEventListener('mp_ended', onEnded, false);
        document.addEventListener('mp_volumechange', onVolumechange, false);
        document.addEventListener('mp_waiting', onWaiting, false);

        function onAbort() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "abort" }
            };
            Utils.sendMessageToSender(message);
        }

        function onCanplay(e) {
            console.log(Constants.APP_INFO, TAG, 'onCanplay: ', e);
            var media = tvApp.stateObj.media;
            if (tvApp.slideshow.started) tvApp.slideshow.onSlideLoadComplete();

            switch (media.type) {
                case "VIDEO":
                    if (tvApp.slideshow.started) {
                        tvApp.clearStage({showLoader: false, showCastMsg: true});
                        Page.picture.display({flag: false, elem: $('#pictures')});

                        PictureManager.stopLoading();
                    }
                    Utils.ui.viewManager.setView('video-player');
                    if (media.thumbnail) tvApp.playerContainer.attr("poster", media.thumbnail);
                    Page.thumbnail.display({flag: false});
                    break;
                case "AUDIO":
                    if (tvApp.slideshow.started) {
                        if (!tvApp.slideshow.custom) {
                            tvApp.clearStage({showLoader: false, showCastMsg: true});
                            tvApp.showAudioPage();
                            Utils.ui.updatePlayerStyles();
                        }
                    }
                    tvApp.playerContainer.find('.artwork .loader').removeClass('displayed');
                    break;
            }

            /* Send messages to Sender app*/
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
            Utils.sendMessageToSender(message_1);
            Utils.sendMessageToSender(message_2);
        }

        function onCanplayThrough(e) {
            console.log(Constants.APP_INFO, TAG, 'onCanplayThrough: ', e);
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "canplaythrough" }
            };
            Utils.sendMessageToSender(message);
        }

        function onDurationChange(e) {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "durationchange",
                    "duration": e.detail && e.detail.duration || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onErrorPlaying(e) {
            console.log(Constants.APP_INFO, TAG, 'onErrorPlaying: ', e);
            var error = e && e.detail && e.detail.error;

            if (!tvApp.slideshow.started) {
                tvApp.clearStage({showLoader: false});

                PictureManager.stopLoading();
                Page.header.display(true);
                Page.message.set((error && error.description) || Constants.FAILED_TO_LOAD_MSG).display();
            } else tvApp.slideshow.onSlideLoadError();

            /* Send messages to Sender app*/
            var message_1 = {
                "event": "ERROR",
                "media": {"url": e.detail.url},
                "error": error
            };
            var message_2 = {
                "event": "MEDIA_PLAYBACK",
                "message": e.detail.url,
                "media_event": {
                    "event": "error",
                    "code": error && error.code,
                    "description": error && error.description
                }
            };

            Utils.sendMessageToSender(message_1);
            Utils.sendMessageToSender(message_2);
        }

        function onLoadedData() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "loadeddata" }
            };
            Utils.sendMessageToSender(message);
        }

        function onLoadedMetadata(e) {
            var type = tvApp.stateObj.media && tvApp.stateObj.media.type
            tvApp.stateObj.media.duration = e.detail.duration;

            if (
                type =='AUDIO' &&
                (!tvApp.slideshow.started ||
                tvApp.slideshow.custom)
            ) Utils.ui.updatePlayerStyles();

            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "loadedmetadata" }
            };
            Utils.sendMessageToSender(message);
        }

        function onLoadstart() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "loadstart" }
            };
            Utils.sendMessageToSender(message);
        }

        function onPause() {
            if (tvApp.slideshow.started) return;
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "pause" }
            };
            Utils.sendMessageToSender(message);
        }

        function onPlay() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "play" }
            };
            Utils.sendMessageToSender(message);
        }

        function onPlaying() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "playing" }
            };
            Utils.sendMessageToSender(message);
        }

        function onProgress() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "progress" }
            };
            Utils.sendMessageToSender(message);
        }

        function onRatechange(e) {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "ratechange",
                    "playbackRate": e.detail && e.detail.playbackRate || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onSeeked(e) {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "seeked",
                    "currentTime": e.detail && e.detail.currentTime || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onSeeking(e) {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "seeking",
                    "currentTime": e.detail && e.detail.currentTime || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onStalled() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "stalled" }
            };
            Utils.sendMessageToSender(message);
        }

        function onSuspend() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "suspend" }
            };
            Utils.sendMessageToSender(message);
        }

        function onTimeupdate(e) {
            var type = tvApp.stateObj.media && tvApp.stateObj.media.type;
            if (type =='AUDIO') {
                if (!tvApp.stateObj.media && !tvApp.stateObj.media.duration) return;
                if (e.detail.duration && tvApp.stateObj.media.duration != e.detail.duration) {
                    console.log(Constants.APP_INFO, TAG, 'Duration has updated. Prev value: ', tvApp.stateObj.media.duration, '. Cur value: ', e.detail.duration);
                    //Possible fix for VZMERA-79
                    tvApp.stateObj.media.duration = e.detail.duration;
                    Utils.ui.updatePlayerStyles();
                }

                var progressBarWidth = tvApp.playerContainer.find(".controls .progress-bar").outerWidth(),
                    progress = tvApp.playerContainer.find(".controls .progress"),
                    tick = tvApp.playerContainer.find(".controls .tick"),
                    value = Math.floor( e.detail.currentTime * progressBarWidth / e.detail.duration );

                progress.css("width", value + "px");
                tick.css("left", (value-1) + "px");// 1 - half of tick's width, minus to center element horizontally
            }

            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "timeupdate",
                    "currentTime": e.detail && e.detail.currentTime || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onVolumechange(e) {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": {
                    "event": "volumechange",
                    "volume": e.detail && e.detail.volume || 0
                }
            };
            Utils.sendMessageToSender(message);
        }

        function onEnded() {
            var type = tvApp.stateObj.media && tvApp.stateObj.media.type;

            switch (type) {
                case 'AUDIO':
                    //Utils.ui.updatePlayerCurtimeLabel.stop(); // update current time label when playback is stopped
                    break;
                case 'VIDEO':
                    if (!tvApp.slideshow.started) Page.thumbnail.display({flag: true, type: 'video', cache: true}); // display a thumbnail
                    else Page.thumbnail.display({flag: true, type:'video', showOnlyThumb: true, cache: true});
                    break;
            }

            if (tvApp.slideshow.started) tvApp.slideshow.onSlideMediaEnded();

            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "ended" }
            };
            Utils.sendMessageToSender(message);
        }

        function onWaiting() {
            /* Send messages to Sender app*/
            var message = {
                "event": "MEDIA_PLAYBACK",
                "message": tvApp.stateObj.media && tvApp.stateObj.media.url || "",
                "media_event": { "event" : "waiting" }
            };
            Utils.sendMessageToSender(message);
        }
    }
};
