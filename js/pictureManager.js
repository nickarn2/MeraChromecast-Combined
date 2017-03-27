'use strict';

/**
 * @module PictureManager
 * @description
 */
var PictureManager = (function(){

    var CLASS_NAME = 'PictureManager',

        picturesObjCollection = {},
        picturesEls = [],
        countPictures = 0;

    return {
        addPicture: function(obj) {
            if (!obj || !(obj instanceof Picture)) return;

            var id = obj.getContainer().attr('id');
            console.log(Constants.APP_INFO, CLASS_NAME, 'addPicture: id: ', id);

            picturesObjCollection[id] = obj;
            countPictures++;
            picturesEls = $('#pictures').find('.picture-container');
        },
        getBottomPictureObj: function() {
            var id = null,
                pictureObj = null,
                bottomPicture = null;

            if (countPictures == 0 || !picturesEls.length) return;
            picturesEls = $('#pictures').find('.picture-container');//update array

            bottomPicture = picturesEls[0];
            bottomPicture.classList.remove('hidden');

            id = bottomPicture.id;//get bottom picture id
            pictureObj = picturesObjCollection[id];

            console.log(Constants.APP_INFO, CLASS_NAME, 'getBottomPictureObj: id: ', id);
            return pictureObj;
        },
        getTopPictureObj: function() {
            var id = null, pictureObj = null;
            if (countPictures == 0 || !picturesEls.length) return;
            picturesEls = $('#pictures').find('.picture-container');//update array

            var topPicture = picturesEls[picturesEls.length-1];
            topPicture.classList.remove('hidden');

            id = topPicture.id;
            pictureObj = picturesObjCollection[id];

            console.log(Constants.APP_INFO, CLASS_NAME, 'getTopPictureObj: id: ', id);
            return pictureObj;
        },
        getPictureContainers: function() {
            return picturesEls;
        },
        animate: function(bPicture, tPicture) {
            if (!tPicture || !bPicture) return;
            if (!(bPicture instanceof Picture) || !(tPicture instanceof Picture)) return;
            var animations = [],
                bPictureContainer = bPicture.getContainer(),
                tPictureContainer = tPicture.getContainer();

            switch(Animation.getType()) {
                case "ROTATION":
                    animations.push(Animation.rotateZoomOut(tPictureContainer)); break;
                case "ZOOM_CORNER":
                    animations.push(Animation.zoomCornerOut(tPictureContainer));
                    animations.push(Animation.zoomCornerIn(bPictureContainer));
                    break;
                case "ZOOM_CENTER":
                    animations.push(Animation.zoomCenterOut(tPictureContainer));
                    animations.push(Animation.zoomCenterIn(bPictureContainer));
                    break;
                case "MOSAIC":
                    animations.push(Animation.mosaic.animate(tPictureContainer)); break;
                case "FADE":
                default:
                    animations.push(Animation.fadeOut(tPictureContainer)); break;
            }

            $.when.apply(null, animations)
            .done(function() {
                console.log(Constants.APP_INFO, CLASS_NAME, 'Animation complete');
                tPicture.movePictureToBottomLayer();
                Animation.reset(bPictureContainer, tPictureContainer);
            });
        },
        stopLoading: function() {
            console.log(Constants.APP_INFO, CLASS_NAME, 'stopLoading');
            for (var id in picturesObjCollection) {
                var picture = picturesObjCollection[id];
                picture.stopLoading();
            }
        }
    }

}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.PictureManager = PictureManager;
}
