"use strict";
var app = app || {};

app.animationID = undefined;
app.paused = false;

app.debug = true;
app.log = function(msg)
{
	if(app.debug)
		console.log(msg);
}


app.keydown = [];

(function()
{
	var queue = new createjs.LoadQueue(false);
	queue.on("fileload", handleFileLoad, this);
	queue.on("complete", complete, this);
	queue.loadFile("js/lib/three.min.js");
	queue.loadFile("js/game.js");

	function handleFileLoad(e)
	{
		app.log(e + " loaded");
	}

	function complete(e)
	{
		window.onblur = function()
		{
			app.paused = true;
			cancelAnimationFrame(app.animationID);
			app.keydown = [];
		};

		window.onfocus = function()
		{
			app.paused = false;
			cancelAnimationFrame(app.animationID);
		};

		window.addEventListener("keydown", function(e)
			{
				app.log("keydown = " + e.keyCode);
				app.keydown[e.keyCode] = true;
			});

		window.addEventListener("keyup", function(e)
			{
				app.log("keyup = " + e.keyCode);
				app.keydown[e.keyCode] = false;
			});

		app.game.init();
	}
}());
