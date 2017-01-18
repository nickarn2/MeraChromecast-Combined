'use strict';

/**
 * @module Animation
 * @description
 */
var Animation = (function(){

    var TAG = 'Animation';
    var config = {
        type: 'FADE',
        duration: 2000 //in ms
    };
    var classes = 'fadeOut rotateZoomOut zoomCornerOut zoomCornerIn zoomCenterOut zoomCenterIn';

    function animate(picture, classList, dfd)  {
        picture.addClass(classList);
        picture.one("webkitAnimationEnd oanimationnend oAnimationEnd msAnimationEnd animationend", function() {
            console.log(Constants.APP_INFO, TAG, 'ended', picture[0].id);
            dfd.resolve();
        });
    }

    /* Mosaic animation config: start */
    var configMosaic = {};
    configMosaic.tilesArr = [];
    configMosaic.MOSAIC_WH = 100; //100% width/height of the picture. Change it very carefully!
    configMosaic.DELAY = 50; //How often to hide tiles, ms
    configMosaic.tileWidth = 5;
    configMosaic.tileHeight = 5;
    configMosaic.tilesNum = (configMosaic.MOSAIC_WH / configMosaic.tileWidth) * (configMosaic.MOSAIC_WH / configMosaic.tileHeight);

    configMosaic.iterationNum = null;
    configMosaic.tilesPerIteration = null;
    /* Mosaic animation config: end */

    return {
        config: function(obj) {
            config = {
                type: 'FADE',
                duration: 2000 //in ms
            }
            if (obj && obj.type) config.type = obj.type;
            if (obj && obj.duration) {
                var duration = parseInt(obj.duration);
                if (Utils.isInt(duration) && duration>0) config.duration = duration;
            }
            if (config.type == 'MOSAIC') {
                configMosaic.iterationNum = Math.floor(config.duration / configMosaic.DELAY);
                configMosaic.tilesPerIteration = Math.ceil(configMosaic.tilesNum / configMosaic.iterationNum);

                console.log(Constants.APP_INFO, TAG, 'Mosaic: Count of tiles:', configMosaic.tilesNum);
                console.log(Constants.APP_INFO, TAG, 'Mosaic: Tiles per iteration to be hide', configMosaic.tilesPerIteration);
                console.log(Constants.APP_INFO, TAG, 'Mosaic: Iterations', configMosaic.iterationNum);
            }
            console.log(Constants.APP_INFO, TAG, 'config', config);

            var pictures = PictureManager.getPictureContainers();
            for (var i=0; i<pictures.length; i++) {
                var el = $("#" + pictures[i].id);
                Utils.ui.setVendorStyle(el, "animation-duration", (config.duration/1000)+"s");
            }
        },
        getType: function() {
            return config.type;
        },
        getDuration: function() {
            return config.duration;
        },
        fadeOut: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'fadeOut: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'fadeOut', dfd);
            }).promise();
        },
        rotateZoomOut: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'rotateZoomOut: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'rotateZoomOut', dfd);
            }).promise();
        },
        zoomCornerOut: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'zoomCornerOut: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'zoomCornerOut', dfd);
            }).promise();
        },
        zoomCornerIn: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'zoomCornerIn: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'zoomCornerIn', dfd);
            }).promise();
        },
        zoomCenterOut: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'zoomCenterOut: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'zoomCenterOut', dfd);
            }).promise();
        },
        zoomCenterIn: function(picture) {
            console.log(Constants.APP_INFO, TAG, 'zoomCenterIn: ', picture[0].id);
            return $.Deferred(function( dfd ) {
                animate(picture, 'zoomCenterIn', dfd);
            }).promise();
        },
        mosaic: {
            interval: null,
            dfd: null,
            initialized: false,
            init: function() {
                var me = this;
                console.log(Constants.APP_INFO, TAG, 'mosaic: init');
                return $.Deferred(function( dfd ) {
                    var tilePattern = "x1% y1%, x1% y2%, x2% y2%, x2% y1%",

                        height = configMosaic.tileHeight,
                        width = configMosaic.tileWidth,
                        yMax = configMosaic.MOSAIC_WH-height,
                        xMax = configMosaic.MOSAIC_WH-width;

                    for (var y = 0; y <= yMax; y += height) {
                        var row = [], cols = [];

                        //We should start and end each row in one certain point "separator"
                        //Otherwise polygon will be broken while removing rectangles
                        var separator = '0% ' + y + '%';
                        row.push(separator)

                        for (var x = 0; x <= xMax; x += width) {
                            var tile = tilePattern
                                      .replace(/x1/g, x)
                                      .replace(/y1/g, y)
                                      .replace(/x2/g, x+width)
                                      .replace(/y2/g, y+height);
                            cols.push(tile);
                        }

                        row.push(cols);
                        row.push(separator);
                        configMosaic.tilesArr.push(row);
                    }
                    me.initialized = true;
                    dfd.resolve();
                }).promise();
            },
            animate: function(picture) {
                console.log(Constants.APP_INFO, TAG, 'mosaic: ', picture[0].id);
                var me = this;
                return $.Deferred(function( dfd ) {
                    me.dfd = dfd;

                    var mosaic = $.extend(true, [], configMosaic.tilesArr),//deep clone
                        visibleTilesNum = configMosaic.tilesNum,
                        iteration = configMosaic.iterationNum,
                        tilesPerIteration = configMosaic.tilesPerIteration;

                    function removeRandomTile() {
                        var rowNum = Utils.getRandomInt(0, mosaic.length);
                        var colNum = Utils.getRandomInt(0, mosaic[rowNum][1].length);

                        mosaic[rowNum][1].splice(colNum, 1);
                        if (!mosaic[rowNum][1].length) mosaic.splice(rowNum, 1);
                    }

                    function hideTiles() {
                        if (iteration == 0 || visibleTilesNum == 0) {
                            clearInterval(me.interval);
                            me.interval = null;
                            dfd.resolve();
                        } else {
                            for (var i=0; i<tilesPerIteration; i++) {
                                removeRandomTile();
                            }
                            var polygon = mosaic.join(',');
                            Utils.ui.setVendorStyle(picture, 'clip-path', 'polygon(' + polygon + ')', false);

                            visibleTilesNum -= tilesPerIteration;
                            if (visibleTilesNum < tilesPerIteration) tilesPerIteration = visibleTilesNum;
                            iteration--;
                        }
                    };
                    hideTiles();
                    me.interval = setInterval(hideTiles, configMosaic.DELAY);
                }).promise();
            },
            stop: function() {
                var me = this;
                if (me.interval) {
                    console.log(Constants.APP_INFO, TAG, 'mosaic: stop');
                    clearInterval(me.interval);
                    me.interval = null;
                    me.dfd && me.dfd.resolve();
                }
            }
        },
        reset: function() {
            var pictures = arguments,
                me = this;

            me.mosaic.stop();
            for (var i=0; i<pictures.length; i++) {
                console.log(Constants.APP_INFO, TAG, 'reset', pictures[i][0].id);
                pictures[i].removeClass(classes);
                Utils.ui.setVendorStyle(pictures[i], 'clip-path', 'none');
            }
        }
    }
}());

