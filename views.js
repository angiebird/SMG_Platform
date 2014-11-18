'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']).config(function($provide) {
  $provide.decorator("$exceptionHandler", function($delegate) {
    return function(exception, cause) {
      $delegate(exception, cause);
      alert(exception.message);
      //var obj = [{emailJavaScriptError: {gameDeveloperEmail: $scope.developerEmail, emailSubject: "error", emailBody: e}}];
    };
  });
});

var myApp = angular.module('myApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap']);
myApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'login.html',
        controller: 'loginCtrl',
        controllerAs: 'loginCtrl'
        	
      })
      .when('/index.html', {
        templateUrl: 'login.html',
        controller: 'loginCtrl'
      })
      .when('/login', {
        templateUrl: 'login.html',
        controller: 'loginCtrl'
      })
      .when('/modeSelect', {
        templateUrl: 'modeSelect.html',
        controller: 'modeCtrl'
      })
      .when('/game', {
        templateUrl: 'game.html',
        controller: 'gameCtrl'
      })
      .when('/results', {
        templateUrl: 'results.html',
        controller: 'resultsCtrl'
      })
    $locationProvider.html5Mode(true);
  }
])
myApp.controller('routeCtrl',
  function($route, $routeParams, $location, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
  	platformScaleService.scaleBody({width: 320, height: 528});
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
    $scope.$on("$routeChangeSuccess", function(event, current, previous) {
        var previousCtrl = previous && previous.$$route && previous.$$route.controller;
        var currentCtrl = current && current.$$route && current.$$route.controller;
        if (previousCtrl === "loginCtrl" && (currentCtrl === "modeCtrl" || currentCtrl === "gameCtrl")) {
            $scope.animationStyle = "slideLeft";
        } 
        else if (previousCtrl === "gameCtrl" && (currentCtrl === "loginCtrl" || currentCtrl === "modeCtrl")) {
            $scope.animationStyle = "slideRight";
        }
        if(!$scope.$$phase) {
          $scope.$apply();
        }
    });
  })
myApp.controller('loginCtrl', function($routeParams, $location, $interval, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
  platformScaleService.stopScaleService();
  platformScaleService.scaleBody({width: 320, height: 528});
  platformScaleService.startScaleService();
  interComService.resetTimer();
  this.name = "loginCtrl";
  this.params = $routeParams;
  var playerInfo = null;
  getGames();
  $scope.guestLogin = function() {
    var avatarLs = ["bat", "devil", "mike", "scream", "squash"];
    var rand = Math.floor(Math.random() * 5);
    var name = avatarLs[rand] + Math.floor(Math.random() * 1000);
    var img = "img/" + avatarLs[rand] + ".png";
    var obj = [{
      registerPlayer: {
        displayName: name,
        avatarImageUrl: img
      }
    }];
    sendServerMessage('REGISTER_PLAYER', obj);
  };
  $scope.updatePlayer = function() {
    if (typeof(Storage) != "undefined") {
      playerInfo = angular.fromJson(localStorage.getItem("playerInfo"));
    }
    if (playerInfo != null) {
    	$scope.playerInfo = playerInfo;
      interComService.setUser(playerInfo);
    }
  }
  $scope.updatePlayer();
  if (playerInfo == null) {
  	$scope.guestLogin();
  }

  function sendServerMessage(t, obj) {
    var type = t;
    serverApiService.sendMessage(obj, function(response) {
      processServerResponse(type, response);
    });
  };

  function processServerResponse(type, resObj) {
    if (type === 'GET_GAMES') {
      updateGameList(resObj);
    } else if (type === 'REGISTER_PLAYER') {
      updatePlayerInfo(resObj);
    }
  }

  function getGames() {
    sendServerMessage('GET_GAMES', [{
      getGames: {gameId: "5682617542246400"}
    }]);
  }

  function updateGameList(obj) {
    var gamelist = obj[0].games;
    interComService.setGameList(gamelist);
    if (gamelist.length > 0) {
    	$scope.gameName = gamelist[0].languageToGameName.en;
    	interComService.setGame(gamelist[0]);
    }
  }

  function updatePlayerInfo(obj) {
    playerInfo = obj[0].playerInfo;
    localStorage.setItem("playerInfo", angular.toJson(playerInfo, true));
    $scope.updatePlayer();
  };

  $scope.gotoMatches = function() {
  	$location.path('/modeSelect');
  };

  $scope.gotoGame = function (playMode) {
    interComService.setPlayMode(playMode);
    $location.path('game');
  };
  
  $scope.gotoResults = function () {
    $location.path('/results');
  };
})

myApp.controller('modeCtrl', function($routeParams, $location, $scope, $interval, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
  this.name = "modeCtrl";
  $scope.allMatches = true;
  $scope.myMatches = false;
  $scope.listMode = "all";
  $scope.displayTab = function(tab){
  	if(tab === "allMatches"){
  		$scope.allMatches = true;
  		$scope.myMatches = false;
  	}
  	else if(tab === "myMatches"){
  		$scope.allMatches = false;
  		$scope.myMatches = true;
  	}
  }
  platformScaleService.stopScaleService();
  platformScaleService.scaleBody({width: 320, height: 528});
  platformScaleService.startScaleService();
  interComService.resetTimer();
  var height = $window.innerHeight;
  if($window.innerHeight < 528 && $window.innerHeight < $window.innerWidth ){
  	height = $window.innerHeight * (528/320);
  }
  $scope.matchListStyle = {
  	"width" : "100%",
  	"height" : Math.floor((height*0.4)).toString()+"px",
  	"overflow": "auto"
  }
  if (interComService.getUser() === undefined || interComService.getGame() === undefined){
  	$location.path('/');
  }
  $scope.joinBtTitle = "Join Game"
  var theGame = interComService.getGame();
  var thePlayer = interComService.getUser();
  var theMatchList = [];
  var theMatch = undefined;
  $scope.matchStrings = [];
  $scope.playMode = "playWhite"
  var game = interComService.getGame();
  this.params = $routeParams;
  $scope.$watch('playMode', function() {
    $scope.currentPlayMode = $scope.playMode
  });
  $scope.startGame = function() {
    interComService.setPlayMode($scope.currentPlayMode);
    $location.path('game');
  }
  $scope.goBackToMenu = function(){
  	$location.path('/');
  }
  getMatchList();
  $scope.matchListSelected = function(match){
  	$scope.selectedMatch = match;
  	if(match.joinable){
  		$scope.joinBtTitle = "Join Game"
  	}
  	else{
  		$scope.joinBtTitle = "Watch Game"
  	}
  	theMatch = theMatchList[match.idx];
  }
  $scope.joinMatch = function(){
  	//get match ID from $scope.selectedMatch; check if it is defined first
  }
  function getMatchList(){
    var resMatchObj = [{
      getPlayerMatches: {
        gameId: theGame.gameId,
        myPlayerId: thePlayer.myPlayerId,
        getCommunityMatches: false,
        accessSignature: thePlayer.accessSignature
      }
    }];
    $scope.getPlayerMatches = angular.toJson(resMatchObj, true);
    sendServerMessage('GET_MATCHES', resMatchObj);
  };

  function sendServerMessage(t, obj) {
    var type = t;
    serverApiService.sendMessage(obj, function(response) {
      processServerResponse(type, response);
    });
  };

  function processServerResponse(type, resObj) {
    if (type === 'GET_MATCHES') {
      updateMatchList(resObj);
    } 
  };
  function matchInfoForDisplay(){
  	var i ;
  	var currentMatchInfo =[];
  	for(i = 0; i < theMatchList.length; i++){
  		var matchInfoObj
  		if (theMatchList[i].playersInfo[1]){
  			matchInfoObj = {
  								 infoString : theMatchList[i].playersInfo[0].displayName + " vs " + theMatchList[i].playersInfo[1].displayName + " on move " + theMatchList[i].history.moves.length,
  								 joinable : true,
  								 matchId : theMatchList[i].matchId,
  								 idx : i
  								}
  		}
  		else if(!theMatchList[i].playersInfo[1]){
  			matchInfoObj = {
  								 infoString : theMatchList[i].playersInfo[0].displayName + " is awaiting.",
  								 joinable : true,
  								 matchId : theMatchList[i].matchId,
  								 idx : i
  								}
  		}
  		currentMatchInfo.push(matchInfoObj);
  	}
  	$scope.matchStrings = currentMatchInfo;
  }
  function updateMatchList(resObj){
  	//$scope.theMatchList = angular.toJson(resObj);
  	var matches = resObj[0].matches;
  	for(var i = 0; i < matches.length; i++){
  		theMatchList.push(matches[i]);
  	}
  	matchInfoForDisplay();
  	//$scope.theMatchListJson = angular.toJson(theMatchList, true);
  	//$scope.theMatchList = theMatchList;
  };
  
  function resumeMatch(){
  	if(theMatch !== undefined){
  		interComService.setMatch(theMatch);
    	$location.path('game');
    	if(theMatch.playersInfo[0].myPlayerId=== thePlayer.myPlayerId){
    		interComService.setPlayMode('playWhite');
    	}
    	else{
    		interComService.setPlayMode('playBlack');
    	}
  	}
  }
  $scope.resumeMatch = resumeMatch;
})

myApp.controller('gameCtrl',
  function($routeParams, $location, $sce, $scope, $interval, $rootScope, $log, $window, $modal, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
    if (interComService.getUser() === undefined || interComService.getGame() === undefined){
  		$location.path('/');
  	}
  	platformScaleService.stopScaleService();
  	platformScaleService.scaleBody({width: 320, height: 320});
  	platformScaleService.startScaleService();
  	interComService.resetTimer();
    var theGame = interComService.getGame();
    var thePlayer = interComService.getUser();
    var theMatch = interComService.getMatch();
    $scope.selectedGame = theGame.gameId;
    $scope.myPlayerId = thePlayer.myPlayerId;
    $scope.myAccessSignature = thePlayer.accessSignature;
    $scope.displayName = thePlayer.displayName;
    $scope.avatarImageUrl = thePlayer.avatarImageUrl;
    $scope.thePlayer = angular.toJson(thePlayer);
    $scope.theGame = angular.toJson(theGame);
    var myLastMove;
    var myTurnIndex = 0;
    var numOfMove = 0;
    var AutoGameRefresher;
    var myLastState;
    var matchOnGoing = false;
    var myMatchId = theMatch.matchId;
    var resultsLock = true;
    if(myMatchId !== undefined){
    	matchOnGoing = true;
    }
    $scope.playMode = interComService.getMode();
    $scope.gameUrl = $sce.trustAsResourceUrl(theGame.gameUrl);
    $scope.avatarImageUrl2 = "img/unknown.png";


    $scope.updateOpponent = function() {
      if ($scope.playMode == "playAgainstTheComputer") {
        $scope.displayName2 = "computer";
        $scope.avatarImageUrl2 = "img/computer.png";
      }
      else if(theMatch.playersInfo !== undefined){
      	for(var i = 0; i < theMatch.playersInfo.length; i++){
      		var p = theMatch.playersInfo[i];
      		if(p && p.myPlayerId !== $scope.myPlayerId){
      			$scope.displayName2 = p.displayName;
      			$scope.avatarImageUrl2 = p.avatarImageUrl;
      		}
      	}
      }
    };
    $scope.updateOpponent();

    var gotGameReady = false;

    function startNewMatch() {
      stateService.startNewMatch();
      if ($scope.playMode === 'playBlack') {
        var resMatchObj = [{
          reserveAutoMatch: {
            tokens: 0,
            numberOfPlayers: 2,
            gameId: $scope.selectedGame,
            myPlayerId: $scope.myPlayerId,
            accessSignature: $scope.myAccessSignature
          }
        }];
        sendServerMessage('RESERVE_MATCH', resMatchObj);
        myTurnIndex = 1;
      }
    };

    $scope.getStatus = function() {
      if (!gotGameReady) {
        return "";
      }
      var matchState = stateService.getMatchState();
      if (matchState.endMatchScores) {
        //$rootScope.endGameMyTurnIndex = myTurnIndex;
        //$location.path('/results');
        if (resultsLock)
        {
            resultsLock = false;
            $scope.displayResults();
        }
        
        return "Match ended with scores: " + matchState.endMatchScores;
      }
      
      if (matchState.turnIndex === myTurnIndex)
        return "Your turn.";
      else
        return "Opponent's turn.";
    };

    stateService.setPlayMode($scope.playMode);

    function sendServerMessage(t, obj) {
      var type = t;
      serverApiService.sendMessage(obj, function(response) {
        processServerResponse(type, response);
      });
    };

    function processServerResponse(type, resObj) {
      if (type === 'GET_MATCHES') {
        updateMatchList(resObj);
      } else if (type === 'CHECK_UPDATE') {
        handleUpdates(resObj);
      } else if (type === 'NEW_MATCH' || type === 'RESERVE_MATCH') {
        handleResAutoMatch(resObj);
      } 
    }

    function isEqual(object1, object2) {
      var obj1Str = JSON.stringify(object1);
      var obj2Str = JSON.stringify(object2);
      return obj1Str === obj2Str;
    }

    function formatMoveObject(obj) {
      var moveObj = [];
      if (obj.length === 3) {
        if (obj[0].setTurn !== undefined && obj[1].set !== undefined && obj[2].set !== undefined) {
          moveObj.push({
            setTurn: {
              turnIndex: obj[0].setTurn.turnIndex
            }
          });
          moveObj.push({
            set: {
              key: "board",
              value: obj[1].set.value
            }
          });
          moveObj.push({
            set: {
              key: "delta",
              value: obj[2].set.value
            }
          });
          return moveObj
        }
      }
      return false;
    }

    function formatStateObject(obj, lastObj){
      var stateObj;
      var indexBefore;
      var indexAfter;
      if (obj[0].setTurn !== undefined) {
        if (obj[0].setTurn.turnIndex === 1) {
          indexBefore = 0;
          indexAfter = 1
        } else {
          indexBefore = 1;
          indexAfter = 0;
        }
        var cState = {
          board: obj[1].set.value,
          delta: obj[2].set.value
        };
        stateObj = {
          turnIndexBeforeMove: indexBefore,
          turnIndex: indexAfter,
          endMatchScores: null,
          currentState: cState,
          lastMove: obj,
          lastVisibleTo: {},
          currentVisibleTo: {}
        };
        if(lastObj){
          var lState = {
            board: lastObj[1].set.value,
            delta: lastObj[2].set.value
          };
          stateObj.lastState = lState;
        }
        myLastState = cState;
        return stateObj;
      } else if (obj[0].endMatch !== undefined) {
        var indexBeforeMove = 0
        if (myTurnIndex === 0) {
          var indexBeforeMove = 1;
        }
        var cState = {
          board: obj[1].set.value,
          delta: obj[2].set.value
        };
        stateObj = {
          turnIndexBeforeMove: indexBeforeMove,
          turnIndex: myTurnIndex,
          endMatchScores: obj[0].endMatch.endMatchScores,
          currentState: cState,
          lastMove: obj,
          lastVisibleTo: {},
          currentVisibleTo: {}
        };
        return stateObj;
      }
    }

    function checkGameUpdates() {
      var resMatchObj = [{
        getPlayerMatches: {
          gameId: $scope.selectedGame,
          myPlayerId: $scope.myPlayerId,
          getCommunityMatches: false,
          accessSignature: $scope.myAccessSignature
        }
      }];
      sendServerMessage('CHECK_UPDATE', resMatchObj);
    }

    function handleResAutoMatch(message) {
      if (message[0].matches !== undefined) {
        var matchObj = message[0].matches[0];
        if (myMatchId !== matchObj.matchId) {
          myMatchId = matchObj.matchId;
        }
        if (myLastMove === undefined || !isEqual(formatMoveObject(myLastMove), formatMoveObject(matchObj.newMatch.move))) {
          stateService.gotBroadcastUpdateUi(formatStateObject(matchObj.newMatch.move), null);
        }
        theMatch = matchObj;
        $scope.updateOpponent();
      }
    }

    function handleUpdates(message) {
      if (message[0].matches !== undefined) {
        var matchObj = message[0].matches;
        var i;
        for (i = 0; i < matchObj.length; i++) {
          if (myMatchId === matchObj[i].matchId) {
            var movesObj = matchObj[i].history.moves;
            if (myLastMove === undefined || !isEqual(formatMoveObject(myLastMove), formatMoveObject(movesObj[movesObj.length - 1]))) {
            	var data;
              if(movesObj.length >= 2){
                data = formatStateObject(movesObj[movesObj.length - 1], movesObj[movesObj.length - 2]);
              }
              else{
                data = formatStateObject(movesObj[movesObj.length - 1], null);
              }
              stateService.gotBroadcastUpdateUi(data);
              myLastMove = movesObj[movesObj.length - 1];
              numOfMove = numOfMove + 1;
            }
            theMatch = matchObj[i];
            $scope.updateOpponent();
          }
        }
      }
    }
    if (!interComService.isMessagerStarted()){
    platformMessageService.addMessageListener(function(message) {
      //this function only handles local messages, server messages will be filtered out
      if (message.reply === undefined) {
        if (message.gameReady !== undefined) {
          gotGameReady = true;
          var game = message.gameReady;
          game.isMoveOk = function(params) {
            platformMessageService.sendMessage({
              isMoveOk: params
            });
            return true;
          };
          game.updateUI = function(params) {
            platformMessageService.sendMessage({
              updateUI: params
            });
          };
          stateService.setGame(game);
          if (!matchOnGoing) {
            startNewMatch();
            matchOnGoing = true;
          }
          else{
          	checkGameUpdates();
          }
        } else if (message.isMoveOkResult !== undefined) {
          if (message.isMoveOkResult !== true) {
            $window.alert("isMoveOk returned " + message.isMoveOkResult);
          }
        } else if (message.makeMove !== undefined) {
          stateService.makeMove(message.makeMove);
          myLastMove = message.makeMove;
          if ($scope.playMode !== 'passAndPlay' && $scope.playMode !== 'playAgainstTheComputer') {
            if (!numOfMove && $scope.playMode === 'playWhite') {
              var newMatchObj = [{
                newMatch: {
                  gameId: $scope.selectedGame,
                  tokens: 0,
                  move: message.makeMove,
                  startAutoMatch: {
                    numberOfPlayers: 2
                  },
                  myPlayerId: $scope.myPlayerId,
                  accessSignature: $scope.myAccessSignature
                }
              }];
              sendServerMessage('NEW_MATCH', newMatchObj);
            var t = interComService.isTimerStarted();
              if (! interComService.isTimerStarted()) {
                AutoGameRefresher = $interval(function() {
                  checkGameUpdates()
                }, 10000);
                interComService.registerTimer(AutoGameRefresher);
              }
            } else {
              numOfMove = numOfMove + 1;
              var moveObj = [{
                madeMove: {
                  matchId: myMatchId,
                  move: message.makeMove,
                  moveNumber: numOfMove,
                  myPlayerId: $scope.myPlayerId,
                  accessSignature: $scope.myAccessSignature
                }
              }];
              sendServerMessage('MADE_MOVE', moveObj);
              if (! interComService.isTimerStarted()) {
                AutoGameRefresher = $interval(function() {
                  checkGameUpdates()
                }, 10000);
                interComService.registerTimer(AutoGameRefresher);
              }
            }
          }
        }
      }
    });
    interComService.messagerStarted();
    };

    $scope.gotoMatches = function () {
      $location.path('/modeSelect');
    };

    $scope.displayResults = function () {
        var modalInstance = $modal.open({
            templateUrl: 'results.html',
            controller: 'resultsCtrl'
        });
    };
    $scope.dismissMatch = function() {
    	var dismissObj =[{
    		dismissMatch: {matchId:theMatch.matchId, myPlayerId:thePlayer.myPlayerId,accessSignature:thePlayer.accessSignature}
    	}];
      sendServerMessage('DISMISS_MATCH', dismissObj);
      $location.path('/');
    }

  });

myApp.controller('resultsCtrl', function ($routeParams, $location, $scope, $rootScope, $log, $window, $modalInstance, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
    this.name = "resultsCtrl";
    /*
    var height = $window.innerHeight;
    if ($window.innerHeight < 528 && $window.innerHeight < $window.innerWidth) {
      height = $window.innerHeight * (528 / 320);
    }
    */
    $scope.goBackToMenu = function () {
      $modalInstance.close();
      $location.path('/');
    }

    $scope.close = function () {
      $modalInstance.close();
    }

    function sendServerMessage(t, obj) {
        var type = t;
        serverApiService.sendMessage(obj, function (response) {
            processServerResponse(type, response);
        });
    };

    function processServerResponse(type, resObj) {
        if (type === 'GET_PLAYERSTATS') {
            updatePlayerStats(resObj);
        } 
    }

    function getPlayerStats() {
        var thePlayer = interComService.getUser();
        var resPlayerStatsObj = [{
            getPlayerGameStats: {
                accessSignature: thePlayer.accessSignature,
                gameId: interComService.getGame().gameId,
                myPlayerId: thePlayer.myPlayerId
            }
        }];
        sendServerMessage('GET_PLAYERSTATS', resPlayerStatsObj);
    }

    function updatePlayerStats(obj)
    {
        var playerStats = obj[0].playerGameStats;
        $scope.playerRank = playerStats.rank;

        if (playerStats.outcomesCount.W)
            $scope.totalWins = playerStats.outcomesCount.W;
        else
            $scope.totalWins = 0;

        if (playerStats.outcomesCount.L)
            $scope.totalLoses = playerStats.outcomesCount.L;
        else
            $scope.totalLoses = 0;
        
        if (playerStats.outcomesCount.T)
            $scope.totalTies = playerStats.outcomesCount.T;
        else
            $scope.totalTies = 0;

        if ($scope.winPercent = $scope.totalWins / ($scope.totalWins + $scope.totalLoses + $scope.totalTies)) { }
        else
            $scope.winPercent = 0;
    }

    getPlayerStats();
    var matchState = stateService.getMatchState();
    $scope.winLoseAnnouncement = "NOT ASSIGNED";

    if ((interComService.getMode() === "playWhite" && matchState.endMatchScores[0] === 1)
        || (interComService.getMode() === "playBlack" && matchState.endMatchScores[1] === 1)
        || (interComService.getMode() === "playAgainstTheComputer" && matchState.endMatchScores[0] === 1))
      $scope.winLoseAnnouncement = "YOU WIN";
    else if (interComService.getMode() === "passAndPlay" && matchState.endMatchScores[0] === 1)
      $scope.winLoseAnnouncement = "PLAYER 1 WINS";
    else if (interComService.getMode() === "passAndPlay" && matchState.endMatchScores[1] === 1)
      $scope.winLoseAnnouncement = "PLAYER 2 WINS";
    else if (matchState.endMatchScores[0] === matchState.endMatchScores[1])
      $scope.winLoseAnnouncement = "TIE GAME";
    else
      $scope.winLoseAnnouncement = "YOU LOSE";

});
