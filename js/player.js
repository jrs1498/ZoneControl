/**
* player.js
*/
"use strict"

var app = app || {};

app.player = function()
{
	function player()
	{
		this.mColor = undefined;
	};

	var p = player.prototype;

	return player;
}();
