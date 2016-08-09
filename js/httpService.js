'use strict';

/**
 * HttpService constructor.
 *
 * @returns {Object}
 */
function HttpService() {
    var TAG = "Smartview",
        APP_INFO = "v" + Config.app.version + " " + Config.app.tv_type + " : ",
        STATUS_TEXT = {
            TIMED_OUT: "Request timed out"
        };
    var httpRequest = new XMLHttpRequest();
    httpRequest.responseType = 'arraybuffer';

    return {
        respUrl: null,
        /**
         * Get a secure resource.
         *
         * @param {object} media Media object.
         * @param {object} parameters Parameters for HTTP-query.
         * @param {function} callbackSuccess Function callback at success.
         * @param {function} callbackError Function callback at failure.
         * @return {object} Current class instance.
         */
        getAuthResource: function(media, parameters, callbackSuccess, callbackError) {
            var url = media.url,
                type = media.type,
                mime = media.mime,
                that = this;

            console.log(APP_INFO, TAG, 'getAuthResource url', url);
            console.log(APP_INFO, TAG, 'getAuthResource parameters', parameters);

            var headers = parameters && parameters.headers,
                body = parameters && parameters.body;

            httpRequest.onreadystatechange = function() {
                console.log(APP_INFO, TAG, 'onreadystatechange', httpRequest);
                if (httpRequest.readyState == 4 ) {
                    switch ( httpRequest.status ) {
                        case 200://OK
                            console.log(APP_INFO, TAG, 'httpRequest success');
                            var objType;
                            switch (type) {
                                case "PICTURE":
                                    objType = mime ? {type: mime} : {type: 'image/jpg'}; break;
                                case "AUDIO":
                                case "VIDEO":
                                    objType = mime ? {type: mime} : {type: type.toLowerCase()+'/mp4'}; break;
                            }
                            var blb = new Blob([httpRequest.response], objType);
                            var respUrl = (window.URL || window.webkitURL).createObjectURL(blb);
                            that.respUrl = respUrl;
                            console.log(APP_INFO, TAG, 'url', respUrl);
                            callbackSuccess && callbackSuccess(null, respUrl, httpRequest.response);
                            break;
                        case 0:
                            console.log(APP_INFO, TAG, 'httpRequest aborted');
                            break;
                        default://ERRORS
                            console.log(APP_INFO, TAG, 'httpRequest error');
                            var description = httpRequest.statusText.length == 0 ? httpRequest.errorString : httpRequest.statusText,
                                e = {
                                    detail: {
                                        url: url,
                                        desc: description,
                                        code: httpRequest.status
                                    }
                                };
                            callbackError && callbackError(e);
                            break;
                    }
                }
            };

            if ( body ) {
                var params = "";
                for(var key in body) {
                    if (body.hasOwnProperty(key)) {
                        console.log(APP_INFO, TAG, "body key " + key + ", value is" + body[key]);
                        var pair = key + "=" + body[key];
                        params += params == "" ? "?"+pair : "&"+pair;
                    }
                }
                if ( params != "" ) {
                    url += params;
                    console.log(APP_INFO, TAG, 'get url with params', url);
                }
            }

            httpRequest.open("GET", url, true); // true for asynchronous
            if ( headers ) setHeaders(headers);
            httpRequest.send(null);

            function setHeaders(headers) {
                for(var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        console.log(APP_INFO, TAG, "header key " + key + ", value is" + headers[key]);
                        httpRequest.setRequestHeader(key, headers[key]);
                    }
                }
            }
        },
        /**
         * Cancel current HTTP-query.
         *
         * @return {object} Current class instance.
         */
        stop: function() {
            console.log(APP_INFO, TAG, 'stop httpRequest');
            httpRequest.abort();
            if (this.respUrl) {
                var windowURL = window.URL || window.webkitURL;
                console.log(APP_INFO, TAG, 'windowURL', windowURL);
                if (!windowURL) return;
                console.log(APP_INFO, TAG, "windowURL.revokeObjectURL url", this.respUrl);
                windowURL.revokeObjectURL(this.respUrl);
                this.respUrl = null;
            }
        }
    }
}