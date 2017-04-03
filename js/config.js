/**
 * @module Config
 * @description The Config module defines some constants for a whole app
 */
var Config = (function(){

    return {
        app: {
            version: '2.1.3',
            tv_type: 'gcast'
        }
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Config = Config;
}
