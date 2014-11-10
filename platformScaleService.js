'use strict';

angular.module('myApp')
  .service('platformScaleService', function($window, $log) {
    var doc = $window.document;
    var body = doc.body;
    var gameSize = null;
    var oldSizes = null;
    var autoService;

    function scaleBody(_gameSize) {
      gameSize = _gameSize;
      rescale();
    }
	function getGameSize(){
		return gameSize;
	}
	function stopScaleService(){
		if (autoService !==  undefined){
			clearInterval(autoService);
		}
	}
    function rescale() {
      if (gameSize === null) {
        return;
      }
      var myGameWidth = gameSize.width;
      var myGameHeight = gameSize.height;
      var windowWidth = $window.innerWidth;
      var windowHeight = $window.innerHeight;
      if (oldSizes !== null) {
        if (oldSizes.myGameWidth === myGameWidth &&
            oldSizes.myGameHeight === myGameHeight &&
            oldSizes.windowWidth === windowWidth &&
            oldSizes.windowHeight === windowHeight) {
          return; // nothing changed, so no need to change the transformations.
        }
      }
      $log.info(["Scaling the body to size: ", gameSize]);
      oldSizes = {
          myGameWidth: myGameWidth,
          myGameHeight: myGameHeight,
          windowWidth: windowWidth,
          windowHeight: windowHeight
      };

      var scaleX = windowWidth / myGameWidth;
      var scaleY = windowHeight / myGameHeight;
      var scale = Math.min(scaleX, scaleY);
      var tx = ((windowWidth / scale - myGameWidth) / 2) * scale;
      var ty = ((windowHeight / scale - myGameHeight) / 2) * scale;
      var transformString = "scale(" + scale + "," + scale + ")  translate(" + tx + "px, " + ty + "px)";
      var gameContent = document.getElementById("gameContent");
      gameContent.style['height'] = (gameSize.height*scale).toString() + "px";
      gameContent.style['width'] = (gameSize.width*scale).toString() + "px";
      gameContent.style['left'] = tx + "px";
      gameContent.style['top'] = ty + "px";
      /*
      gameContent.style['transform'] = transformString;
      gameContent.style['-o-transform'] = transformString;
      gameContent.style['-webkit-transform'] = transformString;
      gameContent.style['-moz-transform'] = transformString;
      gameContent.style['-ms-transform'] = transformString;
      var transformOriginString = "top left";
      gameContent.style['transform-origin'] = transformOriginString;
      gameContent.style['-o-transform-origin'] = transformOriginString;
      gameContent.style['-webkit-transform-origin'] = transformOriginString;
      gameContent.style['-moz-transform-origin'] = transformOriginString;
      gameContent.style['-ms-transform-origin'] = transformOriginString;
      */
    }

    $window.onresize = rescale;
    $window.onorientationchange = rescale;
    doc.addEventListener("orientationchange", rescale);
    autoService = setInterval(rescale, 1000);
	this.getGameSize = getGameSize;
    this.scaleBody = scaleBody;
  });