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
	mScene: 	undefined,
	mCamera: 	undefined,

	// Game Level
	mWorldXMin:	0.0,
	mWorldXMax:	1024.0,
	mWorldZMin:	0.0,
	mWorldZMax:	1024.0,
	mWorldWidth:	undefined,
	mWorldDepth:	undefined,

	mZonesPerSide:	8,
	mZoneWidth:	undefined,
	mZoneHeight:	undefined,
	mZones: 	[],

	mPlayerRed:	undefined,
	mPlayerGreen:	undefined,
	mPlayerOrange:	undefined,
	mPlayerWhite:	undefined,

	mLastSpawn:	0.0,
	mTimePerSpawn:	10.0,

	mCharWidth:	24,
	mCharHeight:	32,
	mCharTilt:	-(3.14159 / 4),
	mCharacters:	[],
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
		this.initTestData();

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

		// Players
		this.mPlayerRed = new app.player(0);
		this.mPlayerRed.mColor = 0xed2211;

		this.mPlayerGreen = new app.player(1);
		this.mPlayerGreen.mColor = 0x22ed11;

		this.mPlayerOrange = new app.player(2);
		this.mPlayerOrange.mColor = 0x884444;
		
		this.mPlayerWhite = new app.player(3);
		this.mPlayerWhite.mColor = 0xffffff;
	
		// Scene lighting
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
		directionalLight.position.set(0,10,0);
		directionalLight.rotation.set(-15, 0, 0);
		this.mScene.add(directionalLight);

		// Build zones
		function createZone(x, y, z, w, h, d, color)
		{
			var zoneGeo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
			var zoneMat = new THREE.MeshPhongMaterial({color: color, overdraw: true});
			var zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
			zoneMesh.position = new THREE.Vector3(x,y-(h/2),z);
			//zoneMesh.receiveShadow = true;
			app.game.mScene.add(zoneMesh);

			var zone = new app.zone();
			zone.mMesh = zoneMesh;
			
			return zone;
		}
		for(var x = 0; x < this.mZonesPerSide; x++)
		{
			this.mZones[x] = [];
			for(var z = 0; z < this.mZonesPerSide; z++)
			{
				var par = (x % 2) + (z % 2);
				var color = 0x22aa88;
				if(par == 1)
					color = 0x0022aa;

				var zone = createZone(
					x * this.mZoneWidth,
					0.0,
					z * this.mZoneDepth,
					this.mZoneWidth,
					this.mZoneWidth * 2.0,
					this.mZoneDepth,
					color);

				this.mZones[x][z] = zone;
			}
		}
	},

	/**
	* initTestData
	*	Dedicated initialization function for test data
	*	Needs to be removed in final version
	*/
	initTestData: function()
	{
		this.mZones[0][0].setOwner(this.mPlayerRed);
		this.mZones[this.mZonesPerSide-1][0].setOwner(this.mPlayerOrange);
		this.mZones[0][this.mZonesPerSide-1].setOwner(this.mPlayerGreen);
		this.mZones[this.mZonesPerSide-1][this.mZonesPerSide-1].setOwner(this.mPlayerWhite);
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

		// Update zones
		this.updateZoneOwnerships();
		this.mLastSpawn += dt;
		if((this.mLastSpawn += dt) > this.mTimePerSpawn)
		{
			this.mLastSpawn %= this.mTimePerSpawn;
			app.log("Spawning a wave");
			for(var row = 0; row < this.mZones.length; row++)
				for(var col = 0; col < this.mZones[row].length; col++)
				{
					this.mZones[row][col].spawnCharacter();
				}
			
			// For now, give random destinations
			for(var i = 0; i < this.mCharacters.length; i++)
			{
				this.mCharacters[i].setDestination(
					Math.random() * this.mWorldWidth,
					Math.random() * this.mWorldDepth,
					true);
			}
			
		}

		// Filter character array
		this.mCharacters = this.mCharacters.filter(function(c)
			{
				if(!c.mActive) 
					app.game.mScene.remove(c.mMesh);
				return c.mActive;
			});
		for(var i = 0; i < this.mCharacters.length; i++)
		{
			this.mCharacters[i].update(dt);
		}
	},

	/**
	* notifyCharacterChangedZone
	*	Used by characters to inform the game level that they have change zones
	*
	* @param character : calling character
	*/
	notifyCharacterChangedZone: function(
		character, 
		prevZoneRow, 
		prevZoneCol,
		currZoneRow,
		currZoneCol)
	{
		if(prevZoneRow != undefined && prevZoneCol != undefined)
			this.mZones[prevZoneRow][prevZoneCol].
				ownerRemovedCharacter(character.mOwner);

		if(currZoneRow != undefined && currZoneCol != undefined)
			this.mZones[currZoneRow][currZoneCol].
				ownerAttachedCharacter(character.mOwner);
	},

	/**
	* updateZoneOwnerships
	*	Logic for determining who controls each zone
	*/
	updateZoneOwnerships: function()
	{
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
