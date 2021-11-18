'use strict';

/**
 * @class Picture
 */
;function Picture(options){
    var self = this;

    var container = options.container;
    if (!container) return;

    var parentContainer = container.parent();
    var picture = container.find('.picture');
    var preloader = new Image();

    self.load = function(src, onSuccess, onError) {
        console.log(Constants.APP_INFO, 'Picture: load');

        preloader.onload = function () {
            console.log(Constants.APP_INFO, 'Load image success: ', src);

            Utils.ui.setVendorStyle(picture, "transform", "none");//nn
            picture.css('backgroundImage', 'url(' + src + ')');

            onSuccess();
        }
        preloader.onerror = onError;
        preloader.src = src;
    }

    self.stopLoading = function() {
        console.log(Constants.APP_INFO, 'Picture: stopLoading');
        preloader.src = "";
        preloader.onload = null;
        preloader.onerror = null;
    }

    self.rotate = function(ori) {
        console.log(Constants.APP_INFO, 'rotate');

        var transStyle = "",
            deg = "",
            flipV = false, //Flip vertically
            flipH = false; //Flip horizontally

        switch (ori) {
            case 2: flipV = true; break;
            case 3: deg = "180deg"; break;
            case 4: flipH = true; break;
            case 5:
            case 7:
                flipV = true;
                deg = ori == 7 ? "90deg" : "-90deg";
                picture.css('backgroundSize', picture.offsetHeight + 'px auto');
                break;
            case 6:
            case 8:
                deg = ori == 6 ? "90deg" : "-90deg";
                picture.css('backgroundSize', picture.offsetHeight + 'px auto');
                break;
        }

        console.log(Constants.APP_INFO, 'rotateImage deg: ', deg, ' ori:', ori);
        console.log(Constants.APP_INFO, 'rotateImage picture.offsetHeight: ', picture.offsetHeight);

        if (deg.length) transStyle += " rotate(" + deg + ")";
        if (flipV) transStyle += " scaleX(-1)";
        if (flipH) transStyle += " scaleY(-1)";

        if (transStyle.length) Utils.ui.setVendorStyle(picture, "transform", transStyle);
    }

    self.hide = function() {
        console.log(Constants.APP_INFO, 'Picture: hide');
        container.addClass('hidden');
        self.movePictureToBottomLayer();
    }

    self.removeBackground = function() {
        console.log(Constants.APP_INFO, 'Picture: removeBackground');
        picture.css('backgroundImage', '');
        picture.css('backgroundSize', 'contain');
    }

    self.movePictureToBottomLayer = function() {
        console.log(Constants.APP_INFO, 'Picture: movePictureToBottomLayer');
        parentContainer.prepend( container );
    }

    self.getContainer = function() {
        return container;
    }
};

