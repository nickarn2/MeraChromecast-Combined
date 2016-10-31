'use strict';

/**
 * @module Page
 * @description The Page module
 */
var Page = (function(){

    var TAG = "Page",
        APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ",
        tvApp = null;

    /**
     * Display a header with Verizon logo.
     *
     * @return {undefined} Result: displaying a header.
     */
    function displayHeader() {
        tvApp.headband.classList.add('displayed');
    }

    /**
     * Display a headband screen.
     *
     * @param {boolean} flag Do you need display a headband screen?
     * @return {undefined} Result: show/hide a headband screen.
     */
    function displayHeadband(flag) {
        var disp = 'displayed',
            headband = tvApp.headband,
            headbandEl = headband.querySelector('.headband'),
            loadingEl = headband.querySelector('.loading');

        if (flag) {
            headband.classList.add(disp);
            headbandEl.classList.add(disp);
            loadingEl.classList.remove(disp);
        } else {
            headband.classList.remove(disp);
            headbandEl.classList.remove(disp);
            loadingEl.classList.remove(disp);
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
            headband = tvApp.headband,
            headbandEl = headband.querySelector('.headband'),
            loadingEl = headband.querySelector('.loading');

        if (flag) {
            headband.classList.add(disp);
            loadingEl.classList.add(disp);
            headbandEl.classList.remove(disp);
        } else {
            headband.classList.remove(disp);
            loadingEl.classList.remove(disp);
            headbandEl.classList.remove(disp);
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
            showLoading =   opt.showLoading,
            type =          opt.type,
            cb =            opt.cb,
            cache =         opt.cache;

        var videoThumbnail = tvApp.videoThumbnail,
            preloadImg = tvApp.preloadImg,
            stateObj = tvApp.stateObj;

        console.log(TAG, APP_INFO, 'displayThumbnail', flag);
        var disp = 'displayed',
            thumbnailUrl = tvApp.stateObj.media.thumbnail,
            DEFAULT_THUMBNAIL = {
                video:      'images/song-default@3x.png',
                picture:    'images/song-default@3x.png',
                default:    'images/song-default@3x.png'
            };

        if (!flag) {
            displayThumbnail.preloadThumb.src = "";
            displayThumbnail.preloadThumb.onload = null;
            displayThumbnail.preloadThumb.onerror = null;
            videoThumbnail.classList.remove(disp);
            return;
        }

        if (showLoading) {
            //It's implied thumbnail is shown already
            videoThumbnail.querySelector('.play-button').classList.remove(disp);
            videoThumbnail.querySelector('.loading').classList.add(disp);
            return;
        }

        if (cache) {
            videoThumbnail.querySelector('.play-button').classList.add(disp);
            videoThumbnail.querySelector('.loading').classList.remove(disp);

            videoThumbnail.classList.add(disp);
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
                console.log(TAG, APP_INFO, 'Thumbnail is loaded');
                updateThumbnailPageStyles();
                videoThumbnail.querySelector('.thumbnail').style.backgroundImage = 'url(' + thumbnail + ')';
                cb && cb();
            }
            displayThumbnail.preloadThumb.onerror = function() {
                console.log(TAG, APP_INFO, 'Thumbnail load error');
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
            videoThumbnail.classList.add(disp);
            switch(type) {
                case 'video':
                    videoThumbnail.querySelector('.play-button').classList.add(disp);
                    videoThumbnail.querySelector('.loading').classList.remove(disp);

                    preloadImg.src = "";
                    preloadImg.onload = null;
                    preloadImg.onerror = null;
                    break;
                case 'picture':
                default:
                    videoThumbnail.querySelector('.play-button').classList.remove(disp);
                    videoThumbnail.querySelector('.loading').classList.add(disp);
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

    return {
        init: function(_tvApp) {
            tvApp = _tvApp;
        },
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
        }
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Page = Page;
}
