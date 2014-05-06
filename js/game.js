/**
* game.js
*	Root game file
*/
"use strict";
var app = app || {};

app.game = 
{
	// ThreeJS
	mRenderer: 	undefined,
	mScene: 		undefined,
	mCamera: 	undefined,

	// Game Level
	mWorldXMin:	0.0,
	mWorldXMax:	640.0,
	mWorldZMin:	0.0,
	mWorldZMax:	640.0,
	mWorldWidth:	undefined,
	mWorldDepth:	undefined,

	mZonesPerSide:	8,
	mZoneWidth:	undefined,
	mZoneHeight:	undefined,

	mZones: 	undefined,	
	myobjects: [],
	paused: false,
	mDt: 1/60,
		
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
		this.mRenderer.setClearColor(0x222299, 1.0);
		this.mRenderer.shadowMapEnabled = true;
		document.body.appendChild(this.mRenderer.domElement);
		
		this.mScene = new THREE.Scene();
		
		this.mCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
		this.mCamera.lookAt(new THREE.Vector3(0,0,0));
		this.mCamera.position.y = 120;
		this.mCamera.position.z = this.mWorldZMax;
		this.mCamera.position.x = this.mWorldXMax / 2.0;
	},

	/**
	* initGame
	*	Initialize all game-specific data
	*/
	initGame: function()
	{
		app.log("app.game.initGame() called");
		
		app.controls.init(this.mCamera);
		
		// World / zone dimendions
		this.mWorldWidth = this.mWorldXMax - this.mWorldXMin;
		this.mWorldDepth = this.mWorldZMax - this.mWorldZMin;
		this.mZoneWidth = this.mWorldWidth / this.mZonesPerSide;
		this.mZoneDepth = this.mWorldDepth / this.mZonesPerSide;
	
		// Scene lighting
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(0,10,0);
		directionalLight.rotation.set(-15, 0, 0);
		this.mScene.add(directionalLight);

		// Build zones
		function createZone(x, y, z, w, h, d, color)
		{
			var zoneGeo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
			var zoneMat = new THREE.MeshPhongMaterial({color: color, overdraw: true});
			var zone = new THREE.Mesh(zoneGeo, zoneMat);
			zone.position = new THREE.Vector3(x,y-(w/2),z);
			zone.receiveShadow = true;
			app.game.mScene.add(zone);
		}
		for(var x = 0; x < this.mZonesPerSide; x++)
			for(var z = 0; z < this.mZonesPerSide; z++)
			{
				var par = (x % 2) + (z % 2);
				var color = 0x22aa88;
				if(par == 1)
					color = 0x0022aa;

				createZone(
					x * this.mZoneWidth,
					0.0,
					z * this.mZoneDepth,
					this.mZoneWidth,
					this.mZoneWidth * 2.0,
					this.mZoneDepth,
					color);
			}
	},
    	
	/**
	* gameLoop
	*	Root game loop function, issues calls to
	*	primary update and draw functions
	*/
	gameLoop: function()
	{
		app.animationID = requestAnimationFrame(this.gameLoop.bind(this));
		this.update(this.mDt);
		this.draw();
	},

	/**
	* update
	*	Primary game update function
	*/
	update: function(dt)
	{
		app.controls.update(dt);
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
