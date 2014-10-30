'use strict';

angular.module('myApp', []).config(function($provide) {
    $provide.decorator("$exceptionHandler", function($delegate) {
		return function(exception, cause) {
			$delegate(exception, cause);
            alert(exception.message);
		    //var obj = [{emailJavaScriptError: {gameDeveloperEmail: $scope.developerEmail, emailSubject: "error", emailBody: e}}];
		};
	});
});

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {
    getGames();
    //getMatches();
  var isFirstMove = true;
  var myLastMove;
  var myMatchId = "";
  var platformUrl = $window.location.search;
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;

  var playerInfo = null;

  $scope.avatarImageUrl = "img/unknown.png";
  $scope.avatarImageUrl2 = "img/unknown.png";
  

  //Check browser support
  $scope.updatePlayer = function(){
	  if (typeof(Storage) != "undefined") {
          playerInfo = angular.fromJson(localStorage.getItem("playerInfo"));
          //console.log("playerInfo" + localStorage.getItem("playerInfo"));
          if(playerInfo != null){
        	  $scope.displayName = playerInfo.displayName;
	    	  $scope.avatarImageUrl = playerInfo.avatarImageUrl;
	    	  $scope.myPlayerId = playerInfo.myPlayerId;
	    	  $scope.myAccessSignature = playerInfo.accessSignature;
	    	  $scope.myTokens = playerInfo.tokens;
          }
	  }
  }
  $scope.updatePlayer();
  
  $scope.updateOpponent = function(){
	  if($scope.playMode == "playAgainstTheComputer"){
	      $scope.displayName2 = "computer";
	      $scope.avatarImageUrl2 = "img/computer.png";
	  }
  };
  $scope.updateOpponent();

  // Used to determine whether to hide match options or not
  $scope.hideMatchOptions = false;
  if (gameUrl === null) {
  		gameUrl = ""
  }
  $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
  var gotGameReady = false;
  $scope.startNewMatch = function () {
    stateService.startNewMatch();
    if($scope.playMode === 'playBlack'){
    var resMatchObj = [{reserveAutoMatch: {tokens:0, numberOfPlayers:2, gameId: $scope.selectedGame, myPlayerId:$scope.myPlayerId, accessSignature:$scope.myAccessSignature}}];
    sendServerMessage('RESERVE_ MATCH', resMatchObj);
    }
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
	  $scope.updatePlayer();
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
  	sendServerMessage('GET_GAMES', [{getGames: {gameId: "5682617542246400"}}]);
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
  function isEqual(object1, object2) {
  	var obj1Str = JSON.stringify(object1);
  	var obj2Str = JSON.stringify(object2);
	return obj1Str === obj2Str;
  }
  function formatMoveObject(obj){
  	var moveObj = [];
  	if(obj.length === 3){
  		if(obj[0].setTurn !== undefined && obj[1].set !== undefined && obj[2].set !== undefined){
  			moveObj.push({setTurn:{turnIndex:obj[0].setTurn.turnIndex}});
  			moveObj.push({set:{key:"board", value:obj[1].set.value}});
  			moveObj.push({set:{key:"delta", value:obj[2].set.value}});
  			return moveObj
  			}
  	}
  	return false;
  }
  function formatStateObject(obj){
  	var stateObj;
  	var indexBefore;
  	var indexAfter;
  	if (obj.move[0].setTurn.turnIndex === 1){
  		indexBefore = 0;
  		indexAfter = 1
  	}
  	else{
  		indexBefore = 1;
  		indexAfter = 0;
  	}
  	var cState = {board: obj.move[1].set, delta: obj.move[2].set};
  	stateObj = {turnIndexBeforeMove : indexBefore, turnIndex: indexAfter, endMatchScores: null, currentState: cState, lastMove: obj.move, lastVisibleTo:{}, currentVisibleTo:{}, lastState:{}};
  	return stateObj
  }
  platformMessageService.addMessageListener(function (message) {
  	if (message.reply !== undefined){
  		var replyObj = message.reply;
  		if (replyObj[0].matches !== undefined){
  			var matchObj = (message.reply)[0].matches[0];
  			if (myMatchId !== matchObj.matchId){
  			myMatchId = matchObj.matchId
  			}
  			if (myLastMove === undefined || !isEqual(formatMoveObject(myLastMove), formatMoveObject(matchObj.newMatch.move))){
  				stateService.gotBroadcastUpdateUi(formatStateObject(matchObj.newMatch));
  			}
  		}
  	}
  	else{
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
      myLastMove = message.makeMove;
      if ($scope.playMode !== 'passAndPlay' && $scope.playMode !== 'playAgainstTheComputer'){
      	if(isFirstMove && $scope.playMode === 'playWhite'){
            var newMatchObj = [{newMatch: {gameId: $scope.selectedGame, tokens: 0, move: message.makeMove, startAutoMatch: { numberOfPlayers : 2 }, myPlayerId:$scope.myPlayerId,accessSignature:$scope.myAccessSignature}}];
      		sendServerMessage('NEW_MATCHES', newMatchObj);
      		isFirstMove = false;
      	}
      	else{
      		var moveObj = [{madeMove: {matchId:myMatchId, move: message.makeMove, moveNumber: 1, myPlayerId:$scope.myPlayerId,accessSignature:$scope.myAccessSignature}}];
      		sendServerMessage('MADE_MOVE', moveObj);
      	}
       }
     }
    }
  });
});
