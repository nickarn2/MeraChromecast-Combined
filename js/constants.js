/**
 * @module Constants
 * @description Common constants
 */
var Constants = (function(){

    return {
        APP_NAMESPACE: 		'urn:x-cast:com.verizon.smartview',
        APP_INFO: 			'v' + Config.app.version + ' ' + Config.app.tv_type + ' : ',
        FAILED_TO_LOAD_MSG: 'Failed to load resource',
        ANIMATION_DURATION: 2000,
        SLIDE_DURATION: 3000,
        MediaEvent: {
            MEDIA_ABORT: "abort",
            MEDIA_CANPLAY: "canplay",
            MEDIA_CANPLAY_THROUGH: "canplaythrough",
            MEDIA_DURATION_CHANGE: "durationchange",
            MEDIA_LOADED_DATA: "loadeddata",
            MEDIA_LOADED_METADATA: "loadedmetadata",
            MEDIA_LOAD_START: "loadstart",
            MEDIA_PLAY: "play",
            MEDIA_PLAYING: "playing",
            MEDIA_PROGRESS: "progress",
            MEDIA_RATECHANGE: "ratechange",
            MEDIA_SEEKED: "seeked",
            MEDIA_SEEKING: "seeking",
            MEDIA_STALLED: "stalled",
            MEDIA_SUSPEND: "suspend",
            MEDIA_TIMEUPDATE: "timeupdate",
            MEDIA_VOLUME_CHANGE: "volumechange",
            MEDIA_WAITING: "waiting",
            MEDIA_LOAD_COMPLETE: "loadcomplete",
            MEDIA_ENDED: "ended",
            MEDIA_PAUSE: "pause",
            MEDIA_RESUME: "resume",
            MEDIA_ERROR: "error",
            SLIDESHOW_STARTED: "slideshowstarted",
            SLIDESHOW_STOPPED: "slideshowstopped",
            MEDIA_STOPPED: "mediastopped"
        },
        MediaDescription: {
            MediaType: {
                PICTURE: "PICTURE",
                VIDEO: "VIDEO",
                AUDIO: "AUDIO"
            }
        }
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Constants = Constants;
}
