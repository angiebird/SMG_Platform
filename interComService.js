'use strict';

angular.module('myApp')
.service('interComService', function($window, $timeout, $log, $rootScope) {

	var user = {};
	var game = {}
	var match = {};
	var playMode;
	var gameList = [];
	function setUser(obj){
		if (obj.displayName !== undefined){
			user.dispayName = obj.displayName;
		}
		if (obj.playerId !== undefined){
			user.playerId = obj.playerId;
		}
		if (obj.accessSignature !== undefined){
			user.accessSignature = obj.accessSignature;
		}
		if (obj.avartarUrl !== undefined){
			user.avartarUrl = obj.avartarUrl;
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
		if(obj.matchId !== undefined){
			match.matchId = obj.matchId;
		}
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
});
