/**
* game.js
*	Root game file
*/
"use strict";
var app = app || {};

app.game = {
	// ThreeJS
	mRenderer: 	undefined,
	mScene: 		undefined,
	mCamera: 	undefined,

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
		
		this.mRenderer = new THREE.WebGLRenderer({antialias: true});
		this.mRenderer.setSize(window.innerWidth, window.innerHeight);
		this.mRenderer.shadowMapEnabled = true;
		document.body.appendChild(this.mRenderer.domElement);
		
		this.mScene = new THREE.Scene();
		this.mScene.fog = new THREE.FogExp2(0x9db3b5, 0.002);
		
		this.mCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
		this.mCamera.position.y = 400;
		this.mCamera.position.z = 400;
		this.mCamera.position.x = -45 * Math.PI / 180;
	},

	/**
	* initGame
	*	Initialize all game-specific data
	*/
	initGame: function()
	{
		app.log("app.game.initGame() called");
		
		var geo = new THREE.PlaneGeometry(2000, 2000, 40, 40);
		var mat = new THREE.MeshPhongMaterial({color: 0xFF00FF, overdraw: true});
		var floor = new THREE.Mesh(geo, mat);
		floor.rotation.x = -0.5 * Math.PI;
		floor.receiveShadow = true;
		this.mScene.add(floor);
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
		var target = new THREE.Vector3(0, 0, 0);
		this.mCamera.lookAt(target);
	},

	/**
	* draw
	*	Primary game draw function
	*/
	draw: function()
	{
		this.mRenderer.render(this.mScene, this.mCamera);
	}
};
