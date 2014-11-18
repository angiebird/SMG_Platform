'use strict';

angular.module('myApp')
.service('interComService', function($window, $interval, $timeout, $log, $rootScope) {

	var user = {};
	var game = {}
	var match = {};
	var playMode;
	var gameList = [];
	var gameMessagerStarted = false;
	var serviceTimer;
	var timerStarted = false;
	
	function isMessagerStarted(){
		return gameMessagerStarted;
	}
	function messagerStarted(){
		gameMessagerStarted = true;
	}
	function registerTimer(timer){
		serviceTimer = timer;
	}
	function resetTimer(){
		$interval.cancel(serviceTimer);
		timerStarted = false;
	}
	function isTimerStarted(){
		return timerStarted;
	}
	function setUser(obj){
		if (obj.displayName !== undefined){
			user.displayName = obj.displayName;
		}
		if (obj.myPlayerId !== undefined){
			user.myPlayerId = obj.myPlayerId;
		}
		if (obj.accessSignature !== undefined){
			user.accessSignature = obj.accessSignature;
		}
		if (obj.avatarImageUrl !== undefined){
			user.avatarImageUrl = obj.avatarImageUrl;
		}
	}
	function setGame(obj){
		if (obj.gameId !== undefined){
			game.gameId = obj.gameId;
		}
		if (obj.gameUrl !== undefined){
			game.gameUrl = obj.gameUrl;
		}
		if (obj.developerEmail !== undefined){
			game.developerEmail = obj.developerEmail;
		}
	}
	function setMatch(obj){
		//if(obj.matchId !== undefined){
		//	match.matchId = obj.matchId;
		//}
		match = obj;
	}
	function setPlayMode(mode){
		playMode = mode;
	}
	function setGameList(obj){
		gameList = obj;
	}
	function getUser(){
		return user;
	}
	function getGame(){
		return game;
	}
	function getMatch(){
		return match;
	}
	function getMode(){
		return playMode;
	}
	function getGameList(){
		return gameList;
	}
	this.setUser = setUser;
	this.setGame = setGame;
	this.setMatch = setMatch;
	this.setPlayMode = setPlayMode;
	this.setGameList = setGameList;
	this.getUser = getUser;
	this.getGame = getGame;
	this.getMatch = getMatch;
	this.getMode = getMode;
	this.getGameList = getGameList;
	this.isMessagerStarted = isMessagerStarted;
	this.messagerStarted = messagerStarted
	this.registerTimer = registerTimer;
	this.resetTimer = resetTimer;
	this.isTimerStarted = isTimerStarted;
});
