/*
loader.js
variable app is in global scope - i.e. a property of window.
app is our single global object literal - all other functions and properties of 
the bubbles game will be properties of app.
*/
"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// CONSTANTS of app
app.KEYBOARD = 
{
	"KEY_LEFT": 	37, 
	"KEY_UP": 	38, 
	"KEY_RIGHT": 	39, 
	"KEY_DOWN": 	40,
	"KEY_SPACE": 	32,
	"KEY_W":	87,
	"KEY_A":	65,
	"KEY_S":	83,
	"KEY_D":	68
};

app.IMAGES = 
{
	"IMG_SOLDIER":	undefined
};

app.MATERIALS =
{
	"MAT_CHARACTER_P0":	undefined,
	"MAT_CHARACTER_P1": undefined,
	"MAT_CHARACTER_P2":	undefined,
	"MAT_CHARACTER_P3": undefined
};

// properties of app
app.animationID = undefined;
app.paused = false;

// key daemon array
app.keydown = [];

app.DEBUG = true;
app.log = function(string)
{
	if(app.DEBUG)
		console.log(string);
};

(function(){
	var queue = new createjs.LoadQueue(false);
	queue.on("fileload", handleFileLoad, this);
	queue.on("complete", complete, this);
	queue.loadFile("js/lib/three.min.js");
	queue.loadFile("js/controls.js");
	queue.loadFile("js/game.js");
	queue.loadFile("js/zone.js");
	queue.loadFile("js/character.js");
	queue.loadFile("js/player.js");
	queue.loadFile("js/statusbar.js");
	queue.loadFile("js/animator.js");
	
	function handleFileLoad(e){
		console.log(e + " loaded");
	}
	
	function handleComplete(e){
		app.city.init();
	}
	
	// when the loading is complete, this function will be called
		 function complete(){
			
			// set up event handlers
			window.onblur = function(){
				app.paused = true;
				cancelAnimationFrame(app.animationID);
				app.keydown = []; // clear key daemon
				// call update() so that our paused screen gets drawn
				//app.city.update();
				app.game.gameLoop();
			};
			
			window.onfocus = function(){
				app.paused = false;
				cancelAnimationFrame(app.animationID);
				// start the animation back up
				//app.city.update();
				app.game.gameLoop();
			};
			
			// event listeners
			window.addEventListener("keydown",function(e){
				if(!app.keydown[e.keyCode])
				{
					app.keydown[e.keyCode] = true;
					app.controls.injectKeyDown(e);
				}
			});
				
			window.addEventListener("keyup",function(e){
				if(app.keydown[e.keyCode])
				{
					app.keydown[e.keyCode] = false;
					app.controls.injectKeyUp(e);
				}
			});
			
			
			// start game
			app.game.init();
		} // end complete

}());



		
		
		

