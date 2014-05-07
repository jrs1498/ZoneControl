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

	mPlayers:		[],

	mLastSpawn:	0.0,
	mTimePerSpawn:	10.0,
	mSpawnStatusBar: undefined,

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
		
		// World / zone dimensions
		this.mWorldWidth = this.mWorldXMax - this.mWorldXMin;
		this.mWorldDepth = this.mWorldZMax - this.mWorldZMin;
		this.mZoneWidth = this.mWorldWidth / this.mZonesPerSide;
		this.mZoneDepth = this.mWorldDepth / this.mZonesPerSide;
	
		// Scene lighting
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
		//directionalLight.position.set(0,10,0);
		//directionalLight.rotation.set(90.0, 0, 1.0);
		directionalLight.rotation.x = 3.14159 / 3.0;
		this.mScene.add(directionalLight);
		
		var hemiLight = new THREE.HemisphereLight(0x444444, 0x444444, 0.25);
		this.mScene.add(hemiLight);

		// Build zones
		for(var x = 0; x < this.mZonesPerSide; x++)
		{
			this.mZones[x] = [];
			for(var z = 0; z < this.mZonesPerSide; z++)
			{
				var par = (x % 2) + (z % 2);
				var color = 0x382216;
				if(par == 1)
					color = 0x9E9692;
					
				var zone = new app.zone(
					x * this.mZoneWidth + this.mZoneWidth / 2.0,
					0.0,
					z * this.mZoneDepth + this.mZoneDepth / 2.0,
					this.mZoneWidth,
					this.mZoneWidth * 2.0,
					this.mZoneDepth,
					color, 0.8);
                                
				this.mZones[x][z] = zone;
			}
		}
		
		// -- BUILD LEVEL GEOMETRY --
		var baseWidth = this.mWorldWidth + 512.0;
		var baseDepth = this.mWorldDepth + 512.0;
		var baseGeo = new THREE.BoxGeometry(baseWidth, this.mWorldWidth / 2.0, baseDepth);
		var baseMat = new THREE.MeshPhongMaterial({color: 0xa0f93b1, overdraw: true});
		var baseMesh = new THREE.Mesh(baseGeo, baseMat);
		baseMesh.position.set(
			this.mWorldWidth / 2.0,
			-384.0,
			this.mWorldDepth / 2.0);
		this.mScene.add(baseMesh);
		
		var largePieceSize = 256.0;
		var largePieceGeo = new THREE.BoxGeometry(largePieceSize, this.mWorldWidth / 2.0, largePieceSize);
		var largePieceMat = new THREE.MeshPhongMaterial({color: 0xEFEFD2, overdraw: true});
		
		var largeLeftMesh = new THREE.Mesh(largePieceGeo, largePieceMat);
		largeLeftMesh.position.set(
			baseMesh.position.x - baseWidth / 3.0 - largePieceSize / 2.0,
			-128.0,
			baseMesh.position.z);
		this.mScene.add(largeLeftMesh);
		
		var largeRightMesh = new THREE.Mesh(largePieceGeo, largePieceMat);
		largeRightMesh.position.set(
			baseMesh.position.x + baseWidth / 3.0 + largePieceSize / 2.0,
			-128.0,
			baseMesh.position.z);
		this.mScene.add(largeRightMesh);
		
		var sideThickness = 64.0;
		var wallSideGeo = new THREE.BoxGeometry(sideThickness, this.mWorldWidth / 2.0, (this.mZonesPerSide + 1) * this.mZoneDepth);
		var wallSideMat = new THREE.MeshPhongMaterial({color: 0xCC8947, overdraw: true});
		
		var leftWallMesh = new THREE.Mesh(wallSideGeo, wallSideMat);
		leftWallMesh.position.set(
			baseMesh.position.x - ((this.mZonesPerSide * this.mZoneWidth) / 2.0) - sideThickness / 2.0,
			-224.0,
			baseMesh.position.z);
		this.mScene.add(leftWallMesh);
		
		var rightWallMesh = new THREE.Mesh(wallSideGeo, wallSideMat);
		rightWallMesh.position.set(
			baseMesh.position.x + ((this.mZonesPerSide * this.mZoneWidth) / 2.0) + sideThickness / 2.0,
			-224.0,
			baseMesh.position.z);
		this.mScene.add(rightWallMesh);
		
		var wallTopGeo = new THREE.BoxGeometry((this.mZonesPerSide * this.mZoneWidth), this.mWorldWidth / 2.0, sideThickness);
		
		var topWallMesh = new THREE.Mesh(wallTopGeo, wallSideMat);
		topWallMesh.position.set(
			baseMesh.position.x,
			-224.0,
			baseMesh.position.z - ((this.mZonesPerSide * this.mZoneDepth) / 2.0) - sideThickness / 2.0);
		this.mScene.add(topWallMesh);
		
		var bottomWallMesh = new THREE.Mesh(wallTopGeo, wallSideMat);
		bottomWallMesh.position.set(
			baseMesh.position.x,
			-224.0,
			baseMesh.position.z + ((this.mZonesPerSide * this.mZoneDepth) / 2.0) + sideThickness / 2.0);
		this.mScene.add(bottomWallMesh);
		// -- END LEVEL GEOMETRY --
		
		this.mSpawnStatusBar = new app.statusbar(
			(this.mZonesPerSide * this.mZoneWidth) / 2.0,
			32.0,
			-32.0,
			this.mZonesPerSide * this.mZoneWidth,
			24.0);
		this.mSpawnStatusBar.setColor(0x00ff00);
		this.mSpawnStatusBar.setStatus(1.0);
		
		// Players
		this.createPlayer(0xffffff, 0, 0);
		this.createPlayer(0xff0000, 0, this.mZonesPerSide - 1);
		this.createPlayer(0x00ff00, this.mZonesPerSide - 1, 0);
		this.createPlayer(0x0000ff, this.mZonesPerSide - 1, this.mZonesPerSide - 1);
	},
	
	/**
	* createPlayer
	*	Adds a player to the game
	*
	* @param c : player color
	* @param sr : player starting row
	* @param sc : player starting column
	*
	* @returns : player index
	*/
	createPlayer: function(c, sr, sc)
	{
		var player = new app.player(this.mPlayers.length);
		player.mColor = c;
		this.mZones[sr][sc].setOwner(player);
		this.mPlayers.push(player);
		return this.mPlayers.length - 1;
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
		for(var i = 0; i < this.mZones.length; i++)
			for(var j = 0; j < this.mZones[i].length; j++)
				this.mZones[i][j].update(dt);
		this.mLastSpawn += dt;
		this.mSpawnStatusBar.setStatus(1.0 - (this.mLastSpawn / this.mTimePerSpawn));
		
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
				{
					app.game.mZones[c.mCurrZoneRow][c.mCurrZoneCol].
						ownerRemovedCharacter(c.mOwner);
					app.game.mScene.remove(c.mMesh);
				}
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
	* draw
	*	Primary game draw function
	*/
	draw: function()
	{
		this.mRenderer.render(this.mScene, this.mCamera);
	}
};
