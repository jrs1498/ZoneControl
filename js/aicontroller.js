/**
* aicontroller.js
*/
"use strict"

var app = app || {};

app.aiController = function()
{
	/**
	* aiController
	*/
	function aiController(pid)
	{
		this.mPlayerID 		= pid;
		this.mTimePerAction	= app.game.mTimePerSpawn;
		this.mLastAction	= this.mTimePerAction;
		this.mHostile		= true;
	};
	
	var p = aiController.prototype;
	
	/**
	* update
	*	Update this controller functionality
	*
	* @param dt : delta time
	*/
	p.update = function(dt)
	{
		this.mLastAction += dt;
		if(this.mLastAction >= this.mTimePerAction)
		{
			this.mLastAction %= this.mTimePerAction;
			
			var chars = this.getPlayerCharacters();
			for(var i = 0; i < chars.length; i++)
			{
				chars[i].setDestination(
					Math.random() * app.game.mWorldXMax,
					Math.random() * app.game.mWorldZMax,
					true);
			}
			//for(var i = 0; i < chars.length; i++)
			//	chars[i].setDestination(
			//		chars[i].mMesh.position.x + Math.random() * app.game.mZoneWidth,
			//		chars[i].mMesh.position.z + Math.random() * app.game.mZoneDepth,
			//		this.mHostile);
		}
	};
	
	/**
	* getPlayerCharacters
	*	Get all of the characters owned by the player this controller is attached to
	*
	* @returns : array of player's characters
	*/
	p.getPlayerCharacters = function()
	{
		var p = app.game.mPlayers[this.mPlayerID];
		return app.game.mCharacters.filter(function(c)
			{
				return c.mOwner == p;
			});
	};
	
	return aiController;
}();