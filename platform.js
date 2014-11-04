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
    function($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {
      getGames();
      //getMatches();
      var myLastMove;
      var myTurnIndex = 0;
      var numOfMove = 0;
      var AutoGameRefresher;
      var myLastState;
      var myMatchId = "";
      var platformUrl = $window.location.search;
      var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;

      var playerInfo = null;

      $scope.avatarImageUrl = "img/unknown.png";
      $scope.avatarImageUrl2 = "img/unknown.png";

      var colorSetAlready = false; // set once at beginning of a game to determine if you should be the black player


      //updatePlayer();
      guestLogin();

      $scope.updateOpponent = function(name, imageUrl) {
        if ($scope.playMode == "playAgainstTheComputer") {
          $scope.displayName2 = "computer";
          $scope.avatarImageUrl2 = "img/computer.png";
        } else if (name !== undefined && imageUrl !== undefined) {
          $scope.displayName2 = name;
          $scope.avatarImageUrl2 = imageUrl;
        }
      };
      $scope.updateOpponent();

      if (gameUrl === null) {
        gameUrl = ""
      }
      $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
      var gotGameReady = false;
      // Starts a local game.  e.g. pass-and-play
      $scope.startNewMatch = function() {
        stateService.startNewMatch();
      };
      // Starts a multiplayer game
      $scope.autoMatch = function() {
        stateService.startNewMatch();

        $scope.playMode = 'playWhite';
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

      };
      $scope.gameSelected = function() {
        console.log("game Selected");
        var i;
        for (i = 0; i < $scope.availableGames.length; i++) {
          if ($scope.selectedGame === $scope.availableGames[i].gameId) {
            $scope.gameUrl = $sce.trustAsResourceUrl($scope.availableGames[i].gameUrl);
            $scope.developerEmail = $scope.availableGames[i].developerEmail;
          }
        }
        //getMatches();
      };
      $scope.matchSelected = function() {
        console.log("match selected");
        // Need to do something after a match is selected
      }
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
      $scope.playMode = "passAndPlay";
      stateService.setPlayMode($scope.playMode);
      $scope.$watch('playMode', function() {
        stateService.setPlayMode($scope.playMode);
      });

      function guestLogin() {
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

      function updatePlayer() {
        //Check browser support
        if (typeof(Storage) != "undefined") {
          playerInfo = angular.fromJson(localStorage.getItem("playerInfo"));
          //console.log("playerInfo" + localStorage.getItem("playerInfo"));
          if (playerInfo != null) {
            $scope.displayName = playerInfo.displayName;
            $scope.avatarImageUrl = playerInfo.avatarImageUrl;
            $scope.myPlayerId = playerInfo.myPlayerId;
            $scope.myAccessSignature = playerInfo.accessSignature;
            $scope.myTokens = playerInfo.tokens;
          }
        }
      };

      function updatePlayerInfo(obj) {
        playerInfo = obj[0].playerInfo;
        localStorage.setItem("playerInfo", angular.toJson(playerInfo, true));
        //console.log("playerInfo: " + localStorage.getItem("playerInfo"));
        updatePlayer();
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
        } else if (type === 'GET_MATCHES') {
          updateMatchList(resObj);
        } else if (type === 'CHECK_UPDATE') {
          handleUpdates(resObj);
        } else if (type === 'NEW_MATCH' || type === 'RESERVE_MATCH') {
          handleResAutoMatch(resObj);
        }
      }

      function getGames() {
          sendServerMessage('GET_GAMES', [{
            getGames: {}
          }]);
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
      }

      function updateMatchList(obj) {
        var matchesObj = obj[0].matches;
        var matchList = [];
        for (var i = 0; i < matchesObj.length; i++) {
          var match = {
            id: i /*get data from the message response*/
          };
          matchList.push(match);
        }
        $scope.availableMatches = matchList;
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
        // If there is an existing game, then you play black
        if (message[0].matches[0] !== undefined) {
          console.log("            >>> ENTERED <<<              ");
          $log.info(message[0].matches);
          if (colorSetAlready === false) {
            $scope.playMode = 'playBlack';
            myTurnIndex = 1;
            colorSetAlready = true;
          }

          var matchObj = message[0].matches[0];
          if (myMatchId !== matchObj.matchId) {
            myMatchId = matchObj.matchId;
          }
          if (myLastMove === undefined || !isEqual(formatMoveObject(myLastMove), formatMoveObject(matchObj.newMatch.move))) {
            stateService.gotBroadcastUpdateUi(formatStateObject(matchObj.newMatch.move));
          }

          if (message[0].matches[0].playersInfo[0] != null && message[0].matches[0].playersInfo[1] != null) {
            // update opponent name and avatar
            if ($scope.displayName === message[0].matches[0].playersInfo[0].displayName)
              $scope.updateOpponent(message[0].matches[0].playersInfo[1].displayName, message[0].matches[0].playersInfo[1].avatarImageUrl);
            else
              $scope.updateOpponent(message[0].matches[0].playersInfo[0].displayName, message[0].matches[0].playersInfo[0].avatarImageUrl);

          }
        }

        colorSetAlready = true; // You are white
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
          if (message[0].matches[0].playersInfo[0] != null && message[0].matches[0].playersInfo[1] != null) {
            // update opponent name and avatar
            if ($scope.displayName === message[0].matches[0].playersInfo[0].displayName)
              $scope.updateOpponent(message[0].matches[0].playersInfo[1].displayName, message[0].matches[0].playersInfo[1].avatarImageUrl);
            else
              $scope.updateOpponent(message[0].matches[0].playersInfo[0].displayName, message[0].matches[0].playersInfo[0].avatarImageUrl);
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