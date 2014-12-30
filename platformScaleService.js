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
      var myFrame = document.getElementById("game_iframe");
      var myGameWidth = gameSize.width;
      var myGameHeight = gameSize.height;
      var windowWidth = $window.innerWidth;
      var windowHeight = $window.innerHeight;
      if(windowHeight < 528 && !myFrame){
      	windowHeight = 528;
      	/*
      	if (windowWidth > windowHeight){
      		var tmp = windowWidth;
      		windowWidth = windowHeight;
      		windowHeight = tmp
      	}
      	else{
      		windowHeight = 528;
      		windowWidth = 320;
      	}
      	*/
      }
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
      var myPanel = document.getElementById("myPanel");
      var oppPanel = document.getElementById("oppPanel");
      var matchListBt = document.getElementById("matchListBt");
      var dismissBt = document.getElementById("dismissBt");
      if(myPanel && oppPanel){
      	if ($window.innerWidth > $window.innerHeight){
      		myPanel.style.top = "0%";
      		myPanel.style.width = "30%";
      		myPanel.style.height = "20%";
      		myPanel.style.left = "-30%"
      		oppPanel.style.top = "0%";
      		oppPanel.style.width = "30%";
      		oppPanel.style.height = "20%";
      		oppPanel.style.left = "100%";
      		matchListBt.style.left = "-30%";
      		matchListBt.style.top = "90%";
      		dismissBt.style.left = "100%";
      		dismissBt.style.top = "90%";
      	}
      	else{
      		myPanel.style.top = "-25%";
      		myPanel.style.width = "30%";
      		myPanel.style.height = "20%";
      		myPanel.style.left = "0%"
      		oppPanel.style.top = "-25%";
      		oppPanel.style.width = "30%";
      		oppPanel.style.height = "20%";
      		oppPanel.style.left = "70%";
      		matchListBt.style.left = "0%";
      		matchListBt.style.top = "105%";
      		dismissBt.style.left = "70%";
      		dismissBt.style.top = "105%";
      	}
      }
      if (myFrame) {
      	if ($window.innerWidth > $window.innerHeight){
      		myFrame.style.width = (gameSize.height*scale).toString() + "px";
      		myFrame.style.height = (gameSize.height*scale).toString() + "px";
      		}
      	else{
      		myFrame.style.width = (gameSize.width*scale).toString() + "px";
      		myFrame.style.height = (gameSize.width*scale).toString() + "px";
      	}
      }
    }
	function startScaleService(){
		autoService = setInterval(rescale, 1000);
	}
    $window.onresize = rescale;
    $window.onorientationchange = rescale;
    doc.addEventListener("orientationchange", rescale);
    autoService = setInterval(rescale, 1000);
	this.getGameSize = getGameSize;
	this.stopScaleService = stopScaleService;
    this.scaleBody = scaleBody;
    this.startScaleService = startScaleService;
  });