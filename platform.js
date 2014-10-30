'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {
    getGames();
    //getMatches();
  var platformUrl = $window.location.search;
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;

  var playerInfo = null;

  //Check browser support
  if (typeof(Storage) != "undefined") {
      playerInfo = angular.fromJson(localStorage.getItem("playerInfo"));
      //console.log("playerInfo" + localStorage.getItem("playerInfo"));
	  $scope.displayName = playerInfo.displayName;
	  $scope.avatarImageUrl = playerInfo.avatarImageUrl;
	  $scope.myPlayerId = playerInfo.myPlayerId;
	  $scope.myAccessSignature = playerInfo.myAccessSignature;
	  $scope.myTokens = playerInfo.tokens;
  };

  // Used to determine whether to hide match options or not
  $scope.hideMatchOptions = false;
  if (gameUrl === null) {
  		gameUrl = ""
  }
  $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
  var gotGameReady = false;
  $scope.startNewMatch = function () {
    stateService.startNewMatch();
  };
  $scope.gameSelected = function(){
     console.log("game Selected");
     var i;
     for (i = 1; i < $scope.availableGames.length; i++){
     	if ($scope.selectedGame === $scope.availableGames[i].gameId){
     		$scope.gameUrl = $sce.trustAsResourceUrl($scope.availableGames[i].gameUrl);
     		$scope.developerEmail = $scope.availableGames[i].developerEmail;
     	}
     }
     //getMatches();
  };
  $scope.matchSelected = function () {
      console.log("match selected");
      // Need to do something after a match is selected
  }
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
	  var avatarLs = ["bat", "devil", "mike", "scream", "squash"];
	  var rand = Math.floor(Math.random()*5);
	  var name = avatarLs[rand] + Math.floor(Math.random()*1000);
	  var img = "img/" + avatarLs[rand] + ".png";
	  var obj = [{registerPlayer:{displayName: name, avatarImageUrl: img}}];
	  sendServerMessage('REGISTER_PLAYER', obj);
  };
  function updatePlayerInfo(obj){
	  playerInfo = obj[0].playerInfo;
	  localStorage.setItem("playerInfo", angular.toJson(playerInfo, true));
      //console.log("playerInfo: " + localStorage.getItem("playerInfo"));

	  $scope.displayName = playerInfo.displayName;
	  $scope.avatarImageUrl = playerInfo.avatarImageUrl;
	  $scope.myPlayerId = playerInfo.myPlayerId;
	  $scope.myAccessSignature = playerInfo.myAccessSignature;
	  $scope.myTokens = playerInfo.tokens;
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
  	else if(type == 'REGISTER_PLAYER'){
  		updatePlayerInfo(resObj);
  	}
  	else if (type == 'GET_MATCHES') {
  	    updateMatchList(resObj);
  	}
  }
  function getGames(){
  	sendServerMessage('GET_GAMES', [{getGames: {}}]);
  }
  /*
  function getMatches() {
      if (playerInfo !== undefined)
      {
          console.log("PLAYER INFO IS DEFINED");
          sendServerMessage('GET_MATCHES', [{
              reserveAutoMatch: {
                  tokens: 0, numberOfPlayers: 2, gameId: $scope.selectedGame,
                  myPlayerId: playerInfo.displayName, accessSignature: playerInfo.accessSignature
              }
          }]);
      }
      console.log("PLAYER INFO IS UNDEFINED");
  }
  */
  function updateGameList(obj){
  	var gamesObj = obj[0].games;
  	var gamelist = [];
  	var i;
  	for (i=0; i< gamesObj.length; i++){
  		var g = {gameId: gamesObj[i].gameId, gameName: gamesObj[i].languageToGameName.en, gameUrl:gamesObj[i].gameUrl, developerEmail:gamesObj[i].gameDeveloperEmail};
  		gamelist.push(g)
  	}
  	$scope.availableGames = gamelist;
  }
  function updateMatchList(obj) {
      var matchesObj = obj[0].matches;
      var matchList = [];
      for (var i = 0; i < matchesObj.length; i++) {
          var match = {id: i/*get data from the message response*/};  
      matchList.push(match);
      }
      $scope.availableMatches = matchList;
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
