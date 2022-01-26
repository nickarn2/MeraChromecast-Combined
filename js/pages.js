'use strict';

/**
 * @module Page
 * @description The Page module
 */
var Page = (function(){

    var TAG = "Page";

    /**
     * Reset a screen state by default.
     *
     * @param {object} options Options.
     * @return {undefined} Result: reset a screen state by default (hide messages, reset a media player state, show a empty picture container, hide a headband, show/hide a loading).
     */
    function clearStage(options) {
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
    }

    /**
     * Display a header with Verizon logo.
     * @param {boolean} flag Show/hide header?
     * @return {undefined} Result: displaying a header.
     */
    function displayHeader(flag) {
        var disp = 'displayed',
        header = tvApp.header;

        if (flag) {
            header.addClass(disp);
        } else {
            header.removeClass(disp);
        }
    }

    /**
     * Display a headband screen.
     *
     * @param {boolean} flag Do you need display a headband screen?
     * @return {undefined} Result: show/hide a headband screen.
     */
    function displayHeadband(flag) {
        var disp = 'displayed',
        headband = tvApp.headband;

        if (flag) {
            headband.addClass(disp);
        } else {
            headband.removeClass(disp);
        }
    }

    /**
     * Display a loading screen.
     *
     * @param {boolean} flag Do you need display a loading screen?
     * @return {undefined} Result: show/hide a loading screen.
     */
    function displayLoading(flag) {
        var disp = 'displayed',
            loadingPage = tvApp.loading;

        if (flag) {
            loadingPage.addClass(disp);
        } else {
            loadingPage.removeClass(disp);
        }
    }

    /**
     * Display a thumbnail.
     *
     * @argument {object}   opt             Options, extracts from arguments array
     * @param {boolean}     opt.flag        Do you need display a thumbnail?
     * @param {boolean}     opt.showLoading Display thumbnail with loading spinner? (It's implied thumbnail is shown already)
     * @param {boolean}     opt.type        Display thumbnail either for 'video' or 'picture'
     * @param {Function}    opt.cb          Callback: apply changes when thumbnail is loaded and ready to be displayed
     * @param {boolean}     opt.cache       Do you need get thumbnail from cache?
     *
     * @return {undefined}  Result: display a thumbnail.
     */
    function displayThumbnail() {
        var opt = arguments[0] && (typeof arguments[0] === 'object') && arguments[0] || {},
            flag =          opt.flag === undefined || opt.flag === null ? true : opt.flag,
            loadThumb =     opt.loadThumb === undefined || opt.flag === null ? false : opt.loadThumb,
            withSpinner =   opt.withSpinner === undefined || opt.withSpinner === null ? false : opt.withSpinner,
            showOnlyThumb = opt.showOnlyThumb === undefined || opt.flag === null ?false: opt.showOnlyThumb,
            showLoading =   opt.showLoading,
            type =          opt.type,
            cb =            opt.cb,
            cache =         opt.cache;

        console.log(Constants.APP_INFO, TAG, 'displayThumbnail', flag);
        var disp = 'displayed',
            videoThumbnail = tvApp.videoThumbnail,
            thumbnailUrl = tvApp.stateObj.media.thumbnail,
            DEFAULT_THUMBNAIL = {
                video:      'images/placeholder-video.png',
                picture:    'images/placeholder-photo.png',
                default:    'images/placeholder-song.png'
            };

        if (!flag) {
            displayThumbnail.preloadThumb.src = "";
            displayThumbnail.preloadThumb.onload = null;
            displayThumbnail.preloadThumb.onerror = null;
            videoThumbnail.removeClass(disp);
            return;
        }

        if (showLoading) {
            //It's implied thumbnail is shown already
            videoThumbnail.find('.play-button').removeClass(disp);
            videoThumbnail.find('.loading').addClass(disp);
            return;
        }

        if (cache) {
            videoThumbnail.find('.loading').removeClass(disp);
            if (showOnlyThumb) {
                videoThumbnail.find('.play-button').removeClass(disp);
            } else {
                videoThumbnail.find('.play-button').addClass(disp);
            }

            videoThumbnail.addClass(disp);
            return;
        }

        thumbnailUrl = thumbnailUrl || DEFAULT_THUMBNAIL[type] || DEFAULT_THUMBNAIL.default;
        display(thumbnailUrl);

        /**
         * Display a thumbnail.
         *
         * @param {string} thumbnail URL of thumbnail.
         * @return {undefined} Result: displaying a thumbnail.
         */
        function display(thumbnail) {
            displayThumbnail.preloadThumb.src = "";
            displayThumbnail.preloadThumb.onload = function() {
                console.log(Constants.APP_INFO, TAG, 'Thumbnail is loaded');
                if (!loadThumb) updateThumbnailPageStyles();
                videoThumbnail.find('.thumbnail').css('background-image', 'url(' + thumbnail + ')');
                cb && cb();
            }
            displayThumbnail.preloadThumb.onerror = function() {
                console.log(Constants.APP_INFO, TAG, 'Thumbnail load error');
                if (thumbnailUrl !== DEFAULT_THUMBNAIL[type] && thumbnailUrl !== DEFAULT_THUMBNAIL.default) {
                    displayDefaultThumbnail();
                } else {
                    updateThumbnailPageStyles();
                    cb && cb();
                }
            }
            displayThumbnail.preloadThumb.src = thumbnail;
        }

        function updateThumbnailPageStyles() {
            videoThumbnail.addClass('displayed');
            switch(type) {
                case 'video':
                    if (withSpinner) {
                        videoThumbnail.find('.play-button').removeClass(disp);
                        videoThumbnail.find('.loading').addClass(disp);
                    } else {
                        videoThumbnail.find('.play-button').addClass(disp);
                        videoThumbnail.find('.loading').removeClass(disp);
                    }

                    PictureManager.stopLoading();
                    break;
                case 'picture':
                default:
                    videoThumbnail.find('.play-button').removeClass(disp);
                    videoThumbnail.find('.loading').addClass(disp);
                    break;
            }
        }

        /**
         * Display default thumbnail.
         */
        function displayDefaultThumbnail() {
            thumbnailUrl = DEFAULT_THUMBNAIL[type] || DEFAULT_THUMBNAIL.default;
            display(thumbnailUrl);
        }
    }
    displayThumbnail.preloadThumb = new Image();

    /**
     * Display a message ("Paused", errors).
     *
     * @param {boolean} flag Do you need display a message?
     * @return {undefined} Result: display a message.
     */
    function displayMessage(flag) {
        var disp = 'displayed';

        if (flag !== false) {
            tvApp.message.addClass(disp);
        } else {
            tvApp.message.removeClass(disp);
        }
    }

    /**
     * Display picture.
     *
     * @argument {object}   opt             Options, extracts from arguments array
     * @param {boolean}     opt.flag        Do you need display a picture?
     * @param {boolean}     opt.elem        Jquery element (picture container) to be displayed
     *
     * @return {undefined}  Result: display/hide a picture.
     */
    function displayPicture() {
        var opt = arguments[0] && (typeof arguments[0] === 'object') && arguments[0] || {},
            flag = opt.flag === undefined || opt.flag === null ? true : opt.flag,
            elem = opt.elem,
            disp = 'displayed';

        if (!elem) return;

        if (flag) elem.addClass(disp);
        else elem.removeClass(disp);
    }

    /**
     * Display music player page.
     */
    function displayMusicPlayer() {
        console.log(Constants.APP_INFO, 'Show audio page');
        tvApp.stateObj.loadStarted = true;

        PictureManager.stopLoading();
        Utils.ui.viewManager.setView('audio-player');

        //checking if thumbnail is present is inside the following function
        Utils.ui.setArtwork(tvApp.playerContainer.find(".artwork"), tvApp.stateObj.media.thumbnail);
        Utils.ui.setMediaInfo(tvApp.playerContainer.find(".info"), tvApp.stateObj);
        Utils.ui.updatePlayerCurtimeLabel();
        Page.header.display(true); // display a header with Verizon logo
    }

    return {
        clearStage: clearStage,
        header: {
            display: displayHeader
        },
        headband: {
            display: displayHeadband
        },
        loading: {
            display: displayLoading
        },
        thumbnail: {
            display: displayThumbnail
        },
        message: {
            set: function(msg) {
                tvApp.message.find('.message').html(msg);
                return this;
            },
            display: displayMessage
        },
        picture: {
            display: displayPicture
        },
        musicPlayer: {
            display: displayMusicPlayer
        }
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Page = Page;
}
