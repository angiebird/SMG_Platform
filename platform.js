'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {
  getGames();
  var platformUrl = $window.location.search;
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  if (gameUrl === null) {
  	gameUrl = "http://punk0706.github.io/SMGGomoku/game.html"
    //$log.error("You must pass the game url like this: ...platform.html?<GAME_URL> , e.g., http://yoav-zibin.github.io/emulator/platform.html?http://yoav-zibin.github.io/TicTacToe/game.html");
    //$window.alert("You must pass the game url like this: ...platform.html?<GAME_URL> , e.g., ...platform.html?http://yoav-zibin.github.io/TicTacToe/game.html");
    //return;
  }
  $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
  var gotGameReady = false;
  $scope.startNewMatch = function () {
    stateService.startNewMatch();
  };
  $scope.getStatus = function () {
    if (!gotGameReady) {
      return "Waiting for 'gameReady' message from the game...";
    }
    var matchState = stateService.getMatchState();
    if (matchState.endMatchScores) {
      return "Match ended with scores: " + matchState.endMatchScores;
    }
    return "Match is ongoing! Turn of player index " + matchState.turnIndex;
  };
  $scope.playMode = "passAndPlay";
  stateService.setPlayMode($scope.playMode);
  $scope.$watch('playMode', function() {
    stateService.setPlayMode($scope.playMode);
  });
  $scope.guestLogin = function (){
	  $scope.displayName = "angie";
	  $scope.avatarImageUrl = "avatar.png"
  };
  function sendServerMessage(t, obj) {
      var type = t;
      serverApiService.sendMessage(obj, function (response) {
        processServerResponse(type, response);
      });
    };
  function processServerResponse(type, resObj){
  	if (type == 'GET_GAMES'){
  		updateGameList(resObj);
  	}
  }
  function getGames(){
  	sendServerMessage('GET_GAMES', [{getGames: {}}]);
  }
  function updateGameList(obj){
  	var gamesObj = obj[0].games;
  	var gamelist = [];
  	var i;
  	for (i=0; i< gamesObj.length; i++){
  		var g = {gameId: gamesObj[i].gameId, gamename: gamesObj[i].languageToGameName.en};
  		gamelist.push(g)
  	}
  }
  platformMessageService.addMessageListener(function (message) {
    if (message.gameReady !== undefined) {
      gotGameReady = true;
      var game = message.gameReady;
      game.isMoveOk = function (params) {
        platformMessageService.sendMessage({isMoveOk: params});
        return true;
      };
      game.updateUI = function (params) {
        platformMessageService.sendMessage({updateUI: params});
      };
      stateService.setGame(game);
    } else if (message.isMoveOkResult !== undefined) {
      if (message.isMoveOkResult !== true) {
        $window.alert("isMoveOk returned " + message.isMoveOkResult);
      }
    } else if (message.makeMove !== undefined) {
      stateService.makeMove(message.makeMove);
    }
  });
});
