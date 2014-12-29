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
      .when('/gameId/:gameId', {
        templateUrl: 'login.html',
        controller: 'loginCtrl',
        controllerAs: 'loginCtrl'
        	
      })
      .when('/accessToken/:accessToken', {
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
  fbLogin($routeParams.accessToken);
  updatePlayer();

  $scope.guestLogin = guestLogin;
  $scope.gotoMatches = function() {
  	$location.path('/modeSelect');
  };

  $scope.gotoGame = function (playMode) {
    interComService.setPlayMode(playMode);
    var obj = {};
    interComService.setMatch(obj);
    $location.path('game');
  };
  
  $scope.gotoResults = function () {
    $location.path('/results');
  };

  function updatePlayer() {
    if (typeof(Storage) != "undefined" && localStorage.getItem("playerInfo") != "undefined") {
      playerInfo = angular.fromJson(localStorage.getItem("playerInfo"));
    }
    if (playerInfo) {
    	$scope.playerInfo = playerInfo;
      interComService.setUser(playerInfo);

    }
    else{
    	guestLogin();
    }
  }
  
  function fbLogin(accessToken){
  	if(accessToken){
    	var obj = [ // SOCIAL_LOGIN - MERGE ACCOUNTS
    	                {
    	                  socialLogin: {
    	                    accessToken: accessToken,
    	                    uniqueType: "F"
    	                  }
    	                }
    	];
    	sendServerMessage('FB_LOGIN', obj);
  	}
  }
  
  $scope.fbLogin = function(){
    FB.getLoginStatus(fbCallback);
  }
  
  function fbCallback(response){
  	console.log(response);
  	$scope.fbAccessToken = response.authResponse.accessToken;
    var obj = [ // SOCIAL_LOGIN - MERGE ACCOUNTS
                    {
                      socialLogin: {
                        accessToken: $scope.fbAccessToken,
                        uniqueType: "F"
                      }
                    }
    ];
    sendServerMessage('FB_LOGIN', obj);
  }
  
  function guestLogin() {
    var avatarLs = ["bat", "devil", "mike", "scream", "squash"];
    var rand = Math.floor(Math.random() * 5);
    var name = avatarLs[rand] + Math.floor(Math.random() * 1000);
    var img = "https://angiebird.github.io/SMG_Platform/img/" + avatarLs[rand] + ".png";
    var obj = [{
      registerPlayer: {
        displayName: name,
        avatarImageUrl: img
      }
    }];
    sendServerMessage('REGISTER_PLAYER', obj);
  };

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
    } else if (type === 'FB_LOGIN') {
    	//alert("FB_LOGIN: " + JSON.stringify(resObj));
      updatePlayerInfo(resObj);
      //updateFBInfo(resObj);
    }
  }

  function getGames() {
  	if($routeParams.gameId){
  		$rootScope.gameId = $routeParams.gameId;
  	}
  	if($rootScope.gameId){
  		sendServerMessage('GET_GAMES', [{
      getGames: { gameId: $rootScope.gameId }
      }]);
  	}
  	else{
  		sendServerMessage('GET_GAMES', [{
        getGames: { gameId: "5207025210359808" }
      }]);
  	}
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
    updatePlayer();
  };

  platformMessageService.removeMessageListener();
  platformMessageService.addMessageListener(function(message) {
    if (message.token !== undefined) {
      //alert("get token!!! " + JSON.stringify(message));
    	console.log("get token!!! " + JSON.stringify(message));
    	fbLogin(message.token);
    }
    else if(message.regid !== undefined){
    	//alert("get regid: " + message.regid);
    	console.log("get regid: " + message.regid);
    	$rootScope.regid = message.regid;
    }
  })
})

myApp.controller('modeCtrl', function($routeParams, $location, $scope, $interval, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, platformScaleService, interComService) {
  this.name = "modeCtrl";

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

  $scope.allMatches = false;
  $scope.myMatches = true;
  $scope.listMode = "all";
  $scope.joinBtTitle = "Join Game"
  $scope.myMatchStrings = [];
  $scope.allMatchStrings = [];
  $scope.playMode = "playWhite"

  var theGame = interComService.getGame();
  var thePlayer = interComService.getUser();
  var theMatch = interComService.getMatch();
  var theMatchList = [];
  this.params = $routeParams;

  getMatchList();


  $scope.startGame = function() {
    interComService.setPlayMode($scope.currentPlayMode);
    $location.path('game');
  };

  $scope.gotoMenu = function(){
  	$location.path('/');
  };

  $scope.gotoGame = function(){
  	if(theMatch.matchId !== undefined){
  		$location.path('/game');
  	}
  };

  $scope.matchListSelected = function(match){
  	$scope.selectedMatch = match;
  	if(match.joinable){
  		$scope.joinBtTitle = "Join Game"
  	}
  	else{
  		$scope.joinBtTitle = "Watch Game"
  	}
  	theMatch = theMatchList[match.idx];
  };

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

  $scope.resumeMatch = function(){
  	if(theMatch.matchId !== undefined){
  		interComService.setMatch(theMatch);
    	if(theMatch.playersInfo[0].playerId=== thePlayer.myPlayerId){
    		interComService.setPlayMode('playWhite');
    	}
    	else{
    		interComService.setPlayMode('playBlack');
    	}
    	$location.path('game');
  	}
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
  	var currentMatchInfo = [];
  	for (i = 0; i < theMatchList.length; i++) {
  	    if (theMatchList[i] != null)
  	    {
  	        var matchInfoObj
  	        if (theMatchList[i].playersInfo[1]) {
  	            matchInfoObj = {
  	                infoString: theMatchList[i].playersInfo[0].displayName + " vs " + theMatchList[i].playersInfo[1].displayName + " on move " + theMatchList[i].history.moves.length,
  	                joinable: true,
  	                matchId: theMatchList[i].matchId,
  	                idx: i
  	            }
  	        }
  	        else if (!theMatchList[i].playersInfo[1]) {
  	            matchInfoObj = {
  	                infoString: theMatchList[i].playersInfo[0].displayName + " is awaiting.",
  	                joinable: true,
  	                matchId: theMatchList[i].matchId,
  	                idx: i
  	            }
  	        }
  	        currentMatchInfo.push(matchInfoObj);
  	    }
  	        
  	}
  	
  	$scope.myMatchStrings = currentMatchInfo;
  }
  function updateMatchList(resObj){
  	theMatchList = resObj[0].matches;

    // Filter out the matches that has already ended
  	for (var i = theMatchList.length - 1; i >= 0; i--)
  	{
  	    if (theMatchList[i].endMatchReason)
  	    {
  	        delete theMatchList[i];
  	    }
  	}
   
  	matchInfoForDisplay();
  };
  
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
    //$rootScope.regid = -1;
    registerDevice();
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
    stateService.setPlayMode($scope.playMode);
    $scope.gameUrl = $sce.trustAsResourceUrl(theGame.gameUrl);
    $scope.avatarImageUrl2 = "img/unknown.png";
    updateOpponent();
    var gotGameReady = false;
    resumeTurns();

    AutoGameRefresher = $interval(function() {
      checkGameUpdates()
    }, 10000);

    function stopAutoGameRefresher() {
        if (angular.isDefined(AutoGameRefresher)) {
            $interval.cancel(AutoGameRefresher);
            AutoGameRefresher = undefined;
        }
    };

    function updateOpponent() {
      if ($scope.playMode == "playAgainstTheComputer") {
        $scope.displayName2 = "computer";
        $scope.avatarImageUrl2 = "img/computer.png";
      }
      else if(theMatch.playersInfo !== undefined){
      	for(var i = 0; i < theMatch.playersInfo.length; i++){
      		var p = theMatch.playersInfo[i];
      		if(p && p.playerId !== $scope.myPlayerId){
      			$scope.displayName2 = p.displayName;
      			$scope.avatarImageUrl2 = p.avatarImageUrl;
      		}
      	}
      }
    };


    function resumeTurns()
    {
        if (theMatch.history !== undefined)
        {
            if (theMatch.playersInfo[0].playerId === thePlayer.myPlayerId)
            {
                myTurnIndex = 0;
            }
            else if (theMatch.playersInfo[1].playerId === thePlayer.myPlayerId)
            {
                myTurnIndex = 1;
            }
        }
    }

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
      	$log.info(interComService.getMatch());
      	if (resultsLock && matchState.endMatchScores)
        {
            resultsLock = false;
            $scope.displayResults();
        }
        else if (resultsLock && ($scope.playMode === 'passAndPlay'  || $scope.playMode === 'playAgainstTheComputer'))
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
      } else if (type === 'REGISTER_DEVICE') {
          $info.log("Device Registered");
      }
    }

    function isEqual(object1, object2) {
    	return angular.equals(object1, object2);
    }

    function formatStateObject(obj, currState, prevState){
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
        var cState = currState;
        /*
        var cState = {
          board: obj[1].set.value,
          delta: obj[2].set.value
        };
        */
        stateObj = {
          turnIndexBeforeMove: indexBefore,
          turnIndex: indexAfter,
          endMatchScores: null,
          currentState: cState,
          lastMove: obj,
          lastVisibleTo: {},
          currentVisibleTo: {}
        };
        if(prevState){
        	var lState = prevState;
        	/*
          var lState = {
            board: lastObj[1].set.value,
            delta: lastObj[2].set.value
          };
          */
          stateObj.lastState = lState;
        }
        myLastState = cState;
        return stateObj;
      } else if (obj[0].endMatch !== undefined) {
        var indexBeforeMove = 0
        if (myTurnIndex === 0) {
          var indexBeforeMove = 1;
        }
        var cState = currState;
        /*
        var cState = {
          board: obj[1].set.value,
          delta: obj[2].set.value
        };
        */
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
    	if($scope.selectedGame){
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
    }

    function handleResAutoMatch(message) {
      if (message[0].matches !== undefined) {
        var matchObj = message[0].matches[0];
        if (myMatchId !== matchObj.matchId) {
          myMatchId = matchObj.matchId;
        }
        if (myLastMove === undefined || !isEqual(myLastMove, matchObj.newMatch.move)) {
          var movesObj = matchObj.history.moves;
          var stateObj = matchObj.history.stateAfterMoves;
          var data;
          if(stateObj.length >= 2){
            data = formatStateObject(movesObj[movesObj.length - 1], stateObj[stateObj.length - 1], stateObj[stateObj.length-2]);
          }
          else{
            data = formatStateObject(movesObj[movesObj.length - 1], stateObj[stateObj.length - 1], null);
          }
          stateService.gotBroadcastUpdateUi(data);
        }
        theMatch = matchObj;
        interComService.setMatch(theMatch);
        updateOpponent();
      }
    }

    function handleUpdates(message) {
      if (message[0].matches !== undefined) {
        var matchObj = message[0].matches;
        var i;
        for (i = 0; i < matchObj.length; i++) {
          if (myMatchId === matchObj[i].matchId) {
          	if (matchObj[i].endMatchReason && matchObj[i].endMatchReason === 'DISMISSED' && matchObj[i].endMatchScores){
          		var movesObj = [{endMatch: {endMatchScores: matchObj[i].endMatchScores}}];
          		var stateObj = matchObj[i].history.stateAfterMoves;
          		var data;
          		if(stateObj.length >= 2){
            		data = formatStateObject(movesObj, stateObj[stateObj.length - 1], stateObj[stateObj.length-2]);
          		}
          		else{
            		data = formatStateObject(movesObj, stateObj[stateObj.length - 1], null);
          		}
          		stateService.gotBroadcastUpdateUi(data);
          	}
          else{
            var movesObj = matchObj[i].history.moves;
            var stateObj = matchObj[i].history.stateAfterMoves;
            numOfMove = movesObj.length-1;
            theMatch = matchObj[i];
            interComService.setMatch(theMatch);
            updateOpponent();
            if (myLastMove === undefined || !isEqual(myLastMove, movesObj[movesObj.length - 1])) {
            	var data;
            	if(stateObj.length >= 2){
            	  data = formatStateObject(movesObj[movesObj.length - 1], stateObj[stateObj.length - 1], stateObj[stateObj.length-2]);
            	}
            	else{
            	  data = formatStateObject(movesObj[movesObj.length - 1], stateObj[stateObj.length - 1], null);
            	}
              stateService.gotBroadcastUpdateUi(data);
              myLastMove = movesObj[movesObj.length - 1];
            }
            }
          }
        }
      }
    }

    platformMessageService.removeMessageListener();
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
            //$window.alert("isMoveOk returned " + message.isMoveOkResult);
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
            }
          }
        } else if(message.notification !== undefined){
        	console.log("got notification");
        	//alert("got notification");
          stopAutoGameRefresher();
          checkGameUpdates();
        }
      }
    });

    $scope.gotoMatches = function () {
      $interval.cancel(AutoGameRefresher);
      $location.path('/modeSelect');
    };

    $scope.displayResults = function () {
      $interval.cancel(AutoGameRefresher);
        var modalInstance = $modal.open({
            templateUrl: 'results.html',
            controller: 'resultsCtrl'
        });
    };
    $scope.dismissMatch = function() {
      $interval.cancel(AutoGameRefresher);
    	var dismissObj =[{
    		dismissMatch: {matchId:theMatch.matchId, myPlayerId:thePlayer.myPlayerId,accessSignature:thePlayer.accessSignature}
    	}];
      sendServerMessage('DISMISS_MATCH', dismissObj);
      $location.path('/');
    }


    // register the current device with regid with serverApi
    function registerDevice() {
        var thePlayer = interComService.getUser();
        var regObj = [{
            registerForPushNotifications: {
                myPlayerId: thePlayer.myPlayerId,
                accessSignature: thePlayer.accessSignature,
                gameId: interComService.getGame().gameId,
                registrationId: $rootScope.regid,
                platformType: "ANDROID"
            }
        }];
        sendServerMessage('REGISTER_DEVICE', regObj);
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

    $scope.winLoseAnnouncement = "...waiting for server";
    $scope.W = 0;
    $scope.L = 0;
    $scope.T = 0;
    $scope.playerRank = 0;
    $scope.winPercent = 0;

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

    // Account for the delay in communication between clients and server
    function delayCall() {
        setTimeout(getPlayerStats, 2000);
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

        if ($scope.winPercent = $scope.totalWins / ($scope.totalWins + $scope.totalLoses + $scope.totalTies) * 100) {
            $scope.winPercent = Math.round($scope.winPercent);
        }
        else
            $scope.winPercent = 0;
    }

    //getPlayerStats();
    delayCall();
    var matchState = stateService.getMatchState();

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

    if ((interComService.getMode() === "passAndPlay") || (interComService.getMode() === "playAgainstTheComputer"))
    {
        $scope.showOfflineNote = true;
    }
    else
    {
        $scope.showOfflineNote = false;
    }
});
