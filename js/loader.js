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
	"KEY_D":	68,
	"KEY_H":	72,
	"KEY_J":	74,
	"KEY_N":	78,
	"KEY_M":	77,
	"KEY_P":	80
};

app.IMAGES = 
{
	"IMG_SOLDIER":	undefined,
	"IMG_DIRT":	undefined,
	"IMG_ROCK":	undefined,
	"IMG_INSTRUCTIONS":	undefined
};

app.MATERIALS =
{
	"MAT_CHARACTER_P0":	undefined,
	"MAT_CHARACTER_P1": undefined,
	"MAT_CHARACTER_P2":	undefined,
	"MAT_CHARACTER_P3": undefined,
	"MAT_DIRT":	undefined,
	"MAT_ROCK":	undefined,
	"MAT_SELECTION":	undefined,
	"MAT_INSTRUCTIONS":	undefined
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
	queue.loadFile("js/lib/dat.gui.js");
	queue.loadFile("js/game.js");
	queue.loadFile("js/zone.js");
	queue.loadFile("js/character.js");
	queue.loadFile("js/player.js");
	queue.loadFile("js/humancontroller.js");
	queue.loadFile("js/aicontroller.js");
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
					app.game.injectKeyDown(e);
				}
			});
				
			window.addEventListener("keyup",function(e){
				if(app.keydown[e.keyCode])
				{
					app.keydown[e.keyCode] = false;
					app.game.injectKeyUp(e);
				}
			});
			
			window.addEventListener("mousedown",function(e)
				{
					app.game.injectMouseDown(e);
				});
				
			window.addEventListener("mouseup",function(e)
				{
					app.game.injectMouseUp(e);
				});
				
			window.addEventListener("mousemove",function(e)
				{
					app.game.injectMouseMove(e);
				});
				
			// Load sound
			createjs.Sound.alternateExtensions = ["mp3"];
			createjs.Sound.registerSound({id:"bullet", src:"sounds/gun2.ogg"});
			createjs.Sound.registerSound({id:"background", src:"sounds/C&C Red Alert music (Hell March).ogg"});
			createjs.Sound.addEventListener("fileload", handleFileLoad);
			function handleFileLoad(e){
				if(e.src == "sounds/C&C Red Alert music (Hell March).ogg")
				{
					app.game.startSoundtrack();
				}
			}
			
			// start game
			app.game.init();
		} // end complete

}());



		
		
		

