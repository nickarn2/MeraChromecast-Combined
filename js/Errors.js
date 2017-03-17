'use strict';

/*
 * @class MediaError
 * @description Creates error object with code and description properties
 * @param {Number} code Error code
 * @property {Number} code Error code 1xx
 * @property {String} description Error description
 * @example {code: 102, description: "Error occurred when downloading"}
 *
 * @comment Private object ERRORS has properties 1-4 which are HTML5 <audio>/<video> error codes. Please do not change.
 * @comment External code range 100-199
 */
function MediaError(code) {
    var ERRORS = {
            0: Constants.FAILED_TO_LOAD_MSG,
            1: "Fetching process aborted by user",//MEDIA_ERR_ABORTED
            2: "Error occurred when downloading",//MEDIA_ERR_NETWORK
            3: "Error occurred when decoding",//MEDIA_ERR_DECODE
            4: "There was an issue casting your content. Please try again."//MEDIA_ERR_SRC_NOT_SUPPORTED
        },
        CODE_INC  = 100;

    this.code = ERRORS[code] ? code + CODE_INC : CODE_INC;
    this.description = ERRORS[code] || ERRORS[0];
}

/*
 * @class SoundtrackMediaError
 * @description Creates slideshow soundtrack error
 * @property {Number} code Error code 2xx
 *
 * @comment External code range 200-299
 */
function SoundtrackMediaError(code) {
    MediaError.apply(this, arguments);

    var CODE_INC  = 100,
        TAG = "Soundtrack: ";

    this.code += CODE_INC;
    this.description = TAG + this.description;
}
SoundtrackMediaError.prototype = Object.create(MediaError.prototype);
SoundtrackMediaError.prototype.constructor = SoundtrackMediaError;

/*
 * @class VolumeError
 * @description Creates volume error
 */
function VolumeError() {
    this.code = 1008;
    this.description = "Control volume is failed";
}
