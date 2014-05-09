/**
* player.js
*/
"use strict"

var app = app || {};

app.player = function()
{
	/**
	* player
	*	Represents a player in the game. A player takes controls of units
	* 	and may issue orders to them.
	*
	* @param id : Player ID, used for referencing
	* @param col : Player color
	* @param human : True if this is a human controlled player, false for ai
	*/
	function player(id, col, human)
	{
		this.mPlayerID 		= id;
		this.mColor 		= col;
		
		if(human)
			this.mController = new app.humanController(this.mPlayerID);
		else
			this.mController = new app.aiController(this.mPlayerID);
	};

	var p = player.prototype;
	
	return player;
}();
