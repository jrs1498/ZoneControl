// city.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

app.game = {
    	// CONSTANT properties
    	
		// variable properties
		renderer: undefined,
		scene: undefined,
		camera: undefined,
		myobjects: [],
		paused: false,
		dt: 1/60,
		controls: undefined,
		
		
    	init : function() 
	{
		console.log('init called');
		//this.setupThreeJS();
		//this.setupWorld();
		this.gameLoop();
    	},
    	
	gameLoop: function()
	{
		app.animationID = requestAnimationFrame(this.gameLoop.bind(this));
		this.update();
		this.draw();
	},

	update: function()
	{
		console.log("update");
	},

	draw: function()
	{
		console.log("draw");
		//this.renderer.render(this.scene, this.camera);
	}
};
