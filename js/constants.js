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
        SLIDE_DURATION: 3000
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.Constants = Constants;
}
