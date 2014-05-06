/**
* zone.js
*/
"use strict"

var app = app || {};

app.zone = function()
{
	function zone()
	{
		this.mMesh = undefined;
	};

	var p = zone.prototype;

	return zone;
}();
