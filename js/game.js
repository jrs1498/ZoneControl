// city.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

app.game = {
    	// CONSTANT properties
    	
	// Variables : ThreeJS
	renderer: 	undefined,
	scene: 		undefined,
	camera: 	undefined,

	myobjects: [],
	paused: false,
	dt: 1/60,
		
	/**
	* init
	*	Root game initialization function
	*/	
    	init : function() 
	{
		app.log("app.game.init() called");
		this.initThreeJS();
		this.initGame();

		app.log("--- START GAME LOOP --");
		this.gameLoop();
    	},

	/**
	* initThreeJS
	*	Initialize ThreeJS for our game's 3D rendering
	*/
	initThreeJS: function()
	{
		app.log("app.game.initThreeJS() called");
	},

	/**
	* initGame
	*	Initialize all game-specific data
	*/
	initGame: function()
	{
		app.log("app.game.initGame() called");
	},
    	
	/**
	* gameLoop
	*	Root game loop function, issues calls to
	*	primary update and draw functions
	*/
	gameLoop: function()
	{
		app.animationID = requestAnimationFrame(this.gameLoop.bind(this));
		this.update();
		this.draw();
	},

	/**
	* update
	*	Primary game update function
	*/
	update: function()
	{
	},

	/**
	* draw
	*	Primary game draw function
	*/
	draw: function()
	{
		//this.renderer.render(this.scene, this.camera);
	}
};
