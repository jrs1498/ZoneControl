"use strict";

var app = app || {};

app.game =
{
	// Constants
	ZONESPERSIDE:		8,
	ZONESIZE:		32,

	// Variables - app
	animID:			undefined,

	// Variables - ThreeJs
	renderer:		undefined,
	scene:			undefined,
	camera:			undefined,

	/**
	* init
	*	Root initialization function for ZoneControl.
	*/
	init : function()
	{
		app.log("game.init()");
		this.initThreeJs();
		this.initGame();
		app.log("--START GAME LOOP--");
		this.gameLoop();
	},

	/**
	* initThreeJs
	*	Initializes everything required in order to use ThreeJs:
	*	create the renderer, scene, camera, etc.
	*/
	initThreeJs : function()
	{
		app.log("game.initThreeJs()");
	
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMapEnabled = true;
		document.body.appendChild(this.renderer.domElement);
	
		this.scene = new THREE.Scene();
		
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			1,
			10000);
		this.camera.position.x = 10;
		this.camera.position.y = 10;
		this.camera.position.z = 10;
	},

	/**
	* initGame
	*	Initializes everything necessary to play the game:
	*	create the zones, players, etc.
	*/
	initGame : function()
	{
		app.log("game.initGame()");

		// Test
		var geo = new THREE.PlaneGeometry(2000, 2000, 40, 40);
		var mat = new THREE.MeshPhongMaterial({color: 0xff00ff, overdraw: true});
		var floor = new THREE.Mesh(geo, mat);
		this.scene.add(floor);
	},


	// ---------------------------------------------------------------------------


	/**
	* gameLoop
	*	Root gameLoop function. All game logic is contained in this function.
	*/
	gameLoop : function()
	{
		this.update();
		this.draw();

		// NEEDS TO BE FIXED
		// When using app.animationID it does not refresh for some reason
		this.animID = requestAnimationFrame(this.gameLoop.bind(this));
		//app.animationID = requestAnimationFrame(this.gameLoop.bind(this));
	},

	/**
	* update
	*	Primary game update logic, called once per frame.
	*/
	update : function()
	{
		this.camera.position.y -= 0.5;
	},

	/**
	* draw
	*	Primary game draw logic, called once per frame.
	*/
	draw : function()
	{
		this.renderer.render(this.scene, this.camera);
	}
};
