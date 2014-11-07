'use strict';

angular.module('myApp', ['ngRoute', 'ngAnimate']).config(function($provide) {
  $provide.decorator("$exceptionHandler", function($delegate) {
    return function(exception, cause) {
      $delegate(exception, cause);
      alert(exception.message);
      //var obj = [{emailJavaScriptError: {gameDeveloperEmail: $scope.developerEmail, emailSubject: "error", emailBody: e}}];
    };
  });
});

var myApp = angular.module('myApp', ['ngRoute', 'ngAnimate']);
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
      });
    $locationProvider.html5Mode(true);
  }
])
myApp.controller('routeCtrl',
  function($route, $routeParams, $location, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, interComService) {
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
  })
myApp.controller('loginCtrl', function($routeParams, $location, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, interComService) {
  this.name = "loginCtrl";
  this.params = $routeParams;
  var playerInfo = null;
  this.playerInfo = playerInfo;
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
      //console.log("playerInfo" + localStorage.getItem("playerInfo"));
    }
    if (playerInfo != null) {
      $scope.displayName = playerInfo.displayName;
      $scope.avatarImageUrl = playerInfo.avatarImageUrl;
      $scope.myPlayerId = playerInfo.myPlayerId;
      $scope.myAccessSignature = playerInfo.accessSignature;
      $scope.myTokens = playerInfo.tokens;
      var userObj = {
        displayName: $scope.displayName,
        playerId: $scope.myPlayerId,
        accessSignature: $scope.myAccessSignature,
        avartarUrl: $scope.avatarImageUrl
      };
      interComService.setUser(userObj);
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
      getGames: {}
    }]);
  }

  function updateGameList(obj) {
    var gamesObj = obj[0].games;
    var gamelist = [];
    var i;
    for (i = 0; i < gamesObj.length; i++) {
      var g = {
        gameId: gamesObj[i].gameId,
        gameName: gamesObj[i].languageToGameName.en,
        gameUrl: gamesObj[i].gameUrl,
        developerEmail: gamesObj[i].gameDeveloperEmail
      };
      gamelist.push(g)
    }
    $scope.availableGames = gamelist;
    interComService.setGameList(gamelist);
  }

  function updatePlayerInfo(obj) {
    playerInfo = obj[0].playerInfo;
    localStorage.setItem("playerInfo", angular.toJson(playerInfo, true));
    //console.log("playerInfo: " + localStorage.getItem("playerInfo"));
    $scope.updatePlayer();
  };
  $scope.gameSelected = function() {
    console.log("game Selected");
    var i;
    for (i = 0; i < $scope.availableGames.length; i++) {
      if ($scope.selectedGame === $scope.availableGames[i].gameId) {
        $scope.gameUrl = $scope.availableGames[i].gameUrl;
        $scope.developerEmail = $scope.availableGames[i].developerEmail;
      }
    }
    if ($scope.myPlayerId !== undefined) {
      var gameObj = {
        gameId: $scope.selectedGame,
        gameUrl: $scope.gameUrl,
        developerEmail: $scope.developerEmail
      };
      interComService.setGame(gameObj);
      $location.path('/modeSelect');
    }
  };
})

myApp.controller('modeCtrl', function($routeParams, $location, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, interComService) {
  this.name = "modeCtrl";
  var theGame = interComService.getGame();
  var thePlayer = interComService.getUser();
  var theMatchList = [];

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

  getMatchList();
  
  function getMatchList(){
    var resMatchObj = [{
      getPlayerMatches: {
        gameId: theGame.gameId,
        myPlayerId: thePlayer.playerId,
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
  
  function updateMatchList(resObj){
  	//$scope.theMatchList = angular.toJson(resObj);
  	var matches = resObj[0].matches;
  	for(var i = 0; i < matches.length; i++){
  		theMatchList.push(matches[i]);
  	}
  	$scope.theMatchListJson = angular.toJson(theMatchList, true);
  	$scope.theMatchList = theMatchList;
  };
  
  function resumeMatch(matchObj){
    $location.path('game');
  }
  $scope.resumeMatch = resumeMatch;
})

myApp.controller('gameCtrl',
  function($routeParams, $location, $sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService, interComService) {
    var theGame = interComService.getGame();
    var thePlayer = interComService.getUser();
    $scope.selectedGame = theGame.gameId;
    $scope.myPlayerId = thePlayer.playerId;
    $scope.myAccessSignature = thePlayer.accessSignature;
    $scope.displayName = thePlayer.displayName;
    $scope.avatarImageUrl = thePlayer.avartarUrl;
    $scope.thePlayer = angular.toJson(thePlayer);
    $scope.theGame = angular.toJson(theGame);
    var matchOnGoing = false;
    var myLastMove;
    var myTurnIndex = 0;
    var numOfMove = 0;
    var AutoGameRefresher;
    var myLastState;
    var myMatchId = "";
    $scope.playMode = interComService.getMode();
    var playerInfo = null;
    $scope.gameUrl = $sce.trustAsResourceUrl(theGame.gameUrl);
    $scope.avatarImageUrl2 = "img/unknown.png";


    $scope.updateOpponent = function() {
      if ($scope.playMode == "playAgainstTheComputer") {
        $scope.displayName2 = "computer";
        $scope.avatarImageUrl2 = "img/computer.png";
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
        return "Waiting for 'gameReady' message from the game...";
      }
      var matchState = stateService.getMatchState();
      if (matchState.endMatchScores) {
        return "Match ended with scores: " + matchState.endMatchScores;
      }
      return "Match is ongoing! Turn of player index " + matchState.turnIndex;
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

    function formatStateObject(obj) {
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
        var lState;
        stateObj = {
          turnIndexBeforeMove: indexBefore,
          turnIndex: indexAfter,
          endMatchScores: null,
          currentState: cState,
          lastMove: obj,
          lastVisibleTo: {},
          currentVisibleTo: {}
        };
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
          stateService.gotBroadcastUpdateUi(formatStateObject(matchObj.newMatch.move));
        }
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
              stateService.gotBroadcastUpdateUi(formatStateObject(movesObj[movesObj.length - 1]));
              myLastMove = movesObj[movesObj.length - 1];
              numOfMove = numOfMove + 1;
            }
          }
        }
      }
    }
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
              if (AutoGameRefresher === undefined) {
                AutoGameRefresher = setInterval(function() {
                  checkGameUpdates()
                }, 10000);
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
              if (AutoGameRefresher === undefined) {
                AutoGameRefresher = setInterval(function() {
                  checkGameUpdates()
                }, 10000);
              }
            }
          }
        }
      }
    });
  });