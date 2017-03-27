'use strict';

/**
 * HttpService constructor.
 *
 * @returns {Object}
 */
function HttpService() {
    var STATUS_TEXT = {
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

            console.log(Constants.APP_INFO, 'getAuthResource url', url);
            console.log(Constants.APP_INFO, 'getAuthResource parameters', parameters);

            var headers = parameters && parameters.headers,
                body = parameters && parameters.body;

            httpRequest.onreadystatechange = function() {
                console.log(Constants.APP_INFO, 'onreadystatechange', httpRequest);
                if (httpRequest.readyState == 4 ) {
                    switch ( httpRequest.status ) {
                        case 200://OK
                            console.log(Constants.APP_INFO, 'httpRequest success');
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
                            console.log(Constants.APP_INFO, 'url', respUrl);
                            callbackSuccess && callbackSuccess(null, respUrl, httpRequest.response);
                            break;
                        case 0:
                            console.log(Constants.APP_INFO, 'httpRequest aborted');
                            /*
                             * Mostly this calls when CORS error occurs
                             * (in case of remote images from other domain and without authorization
                             * used in the sample app)
                             * So call success callback, without args, which will try to load the image via img tag
                             */
                            callbackSuccess();
                            break;
                        default://ERRORS
                            console.log(Constants.APP_INFO, 'httpRequest error');
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
                        console.log(Constants.APP_INFO, "body key " + key + ", value is" + body[key]);
                        var pair = key + "=" + body[key];
                        params += params == "" ? "?"+pair : "&"+pair;
                    }
                }
                if ( params != "" ) {
                    url += params;
                    console.log(Constants.APP_INFO, 'get url with params', url);
                }
            }

            httpRequest.open("GET", url, true); // true for asynchronous
            if ( headers ) setHeaders(headers);
            httpRequest.send(null);

            function setHeaders(headers) {
                for(var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        console.log(Constants.APP_INFO, "header key " + key + ", value is" + headers[key]);
                        httpRequest.setRequestHeader(key, headers[key]);
                    }
                }
            }
        },
        /**
         * Cancel current HTTP-query.
         *
         * @return {undefined}
         */
        stop: function() {
            console.log(Constants.APP_INFO, 'stop httpRequest');
            httpRequest.onreadystatechange = null;
            httpRequest.abort();
            if (this.respUrl) {
                var windowURL = window.URL || window.webkitURL;
                console.log(Constants.APP_INFO, 'windowURL', windowURL);
                if (!windowURL) return;
                console.log(Constants.APP_INFO, "windowURL.revokeObjectURL url", this.respUrl);
                windowURL.revokeObjectURL(this.respUrl);
                this.respUrl = null;
            }
        }
    }
}
