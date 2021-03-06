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

	// Project requirements
	mElapsedTime: 0.0,
	mAnimatedObjectTimeFactor: 5.0,
	mAnimatedObjects: [],

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
	mZoneMeshes:	[],
	mZones: 	[],

	mPlayers:		[],
	mPlayer0Color:	0xffffff,
	mPlayer1Color:	0xff0000,
	mPlayer2Color:	0x00ff00,
	mPlayer3Color:	0x0000ff,
	mHumanPlayerID:	undefined,
	mWinner: undefined,

	mLastSpawn:	40.0,
	mTimePerSpawn:	40.0,
	mSpawnStatusBar: undefined,
	
	mKeyEventListeners: [],
	mMouseEventListeners: [],

	mCharWidth:	96,
	mCharHeight:	96,
	mCharTilt:	-(3.14159 / 4),
	mCharacters:	[],
	mCharacterAnimator: undefined,
	mCharacterCorpseTime: 8,
	myobjects: [],
	paused: false,
	mDt: 1/60,
	mTestKills: false,
	
	// Widget Controls
	controls: new function() {
        this.spawnRate = 40.0;
        this.animationSpeed = 5.0;
		this.cameraSpeed = 768.0;
    },
	
	gui: new dat.GUI(),
    
	
	
	/**
	* init
	*	Root game initialization function
	*/	
    	init : function() 
	{
		app.log("app.game.init() called");
		this.initThreeJS();
		this.loadContent();
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
		
		// World / zone dimensions
		this.mWorldWidth = this.mWorldXMax - this.mWorldXMin;
		this.mWorldDepth = this.mWorldZMax - this.mWorldZMin;
		this.mZoneWidth = this.mWorldWidth / this.mZonesPerSide;
		this.mZoneDepth = this.mWorldDepth / this.mZonesPerSide;
	
		// Scene lighting
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
				var mat = app.MATERIALS["MAT_ROCK"];
				var color = 0x382216;
				if(par == 1)
				{
					mat = app.MATERIALS["MAT_DIRT"];
					color = 0x9E9692;
				}				
	
				var zone = new app.zone(
					x * this.mZoneWidth + this.mZoneWidth / 2.0,
					0.0,
					z * this.mZoneDepth + this.mZoneDepth / 2.0,
					this.mZoneWidth,
					this.mZoneWidth * 2.0,
					this.mZoneDepth,
					color, 0.8,
					mat);
					
				this.mZoneMeshes.push(zone.mMesh);
                                
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

		var pistonGeo = new THREE.BoxGeometry(192, 384, 192);
		var pistonMat = new THREE.MeshPhongMaterial({color: 0xff0000, overdraw: true});
		var piston1 = new THREE.Mesh(pistonGeo, pistonMat);
		piston1.position.set(largeLeftMesh.position.x, 0, largeLeftMesh.position.z);
		var piston2 = new THREE.Mesh(pistonGeo, pistonMat);
		piston2.position.set(largeRightMesh.position.x, 0, largeRightMesh.position.z);
		this.mScene.add(piston1);
		this.mScene.add(piston2);
		this.mAnimatedObjects.push(piston1);
		this.mAnimatedObjects.push(piston2);
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
		this.createPlayer(0xffffff, true, 0, 0);
		this.createPlayer(0xff0000, false, 0, this.mZonesPerSide - 1);
		this.createPlayer(0x00ff00, false, this.mZonesPerSide - 1, 0);
		this.createPlayer(0x0000ff, false, this.mZonesPerSide - 1, this.mZonesPerSide - 1);
		
		this.mHumanPlayerID = 0;
		this.newGame();
		
		// GUI
		this.gui.add(this.controls, 'spawnRate', 10, 70);
		this.gui.add(this.controls, 'animationSpeed', 0, 10);
		this.gui.add(this.controls, 'cameraSpeed', 200, 800);
	},

	/**
	* newGame
	*	Reset the game level and start a new game
	*/
	newGame: function()
	{
		app.log("app.game.newGame()");
	},
	
	/**
	* loadContent
	*	Load all game content here
	*/
	loadContent: function()
	{
		app.log("app.game.loadContent() called");
		
		// Load character content
		//app.IMAGES["IMG_SOLDIER"] = new THREE.ImageUtils.loadTexture("./images/soldier64x64.png");
		app.IMAGES["IMG_SOLDIER"] = new THREE.ImageUtils.loadTexture("./images/soldier128x128.png");
		app.IMAGES["IMG_SOLDIER"].wrapS = app.IMAGES["IMG_SOLDIER"].wrapT = THREE.RepeatWrapping;
		app.IMAGES["IMG_DIRT"] = new THREE.ImageUtils.loadTexture("./images/dirt.jpg");
		app.IMAGES["IMG_DIRT"].wrapS = app.IMAGES["IMG_DIRT"].wrapT = THREE.RepeatWrapping;
		app.IMAGES["IMG_ROCK"] = new THREE.ImageUtils.loadTexture("./images/rock.jpg");
		app.IMAGES["IMG_ROCK"].wrapS = app.IMAGES["IMG_ROCK"].wrapT = THREE.RepeatWrapping;
		app.IMAGES["IMG_INSTRUCTIONS"] = new THREE.ImageUtils.loadTexture("./images/instructions.png");
		
		app.MATERIALS["MAT_CHARACTER_P0"] = new THREE.MeshPhongMaterial({color: this.mPlayer0Color, overdraw: true, map: app.IMAGES["IMG_SOLDIER"], transparent: true});
		app.MATERIALS["MAT_CHARACTER_P1"] = new THREE.MeshPhongMaterial({color: this.mPlayer1Color, overdraw: true, map: app.IMAGES["IMG_SOLDIER"], transparent: true});
		app.MATERIALS["MAT_CHARACTER_P2"] = new THREE.MeshPhongMaterial({color: this.mPlayer2Color, overdraw: true, map: app.IMAGES["IMG_SOLDIER"], transparent: true});
		app.MATERIALS["MAT_CHARACTER_P3"] = new THREE.MeshPhongMaterial({color: this.mPlayer3Color, overdraw: true, map: app.IMAGES["IMG_SOLDIER"], transparent: true});
		app.MATERIALS["MAT_DIRT"] = new THREE.MeshPhongMaterial({color: 0xffffff, overdraw: true, map: app.IMAGES["IMG_DIRT"]});
		app.MATERIALS["MAT_ROCK"] = new THREE.MeshPhongMaterial({color: 0xffffff, overdraw: true, map: app.IMAGES["IMG_ROCK"]});
		app.MATERIALS["MAT_SELECTION"] = new THREE.MeshPhongMaterial({color: 0x00ff00, overdraw: true});
		app.MATERIALS["MAT_INSTRUCTIONS"] = new THREE.MeshPhongMaterial({color: 0xffffff, overdraw: true, map: app.IMAGES["IMG_INSTRUCTIONS"], transparent: true});
		
		//this.mCharacterAnimator = new app.animator(8, 16, 64, 64, 1024 / 512);
		this.mCharacterAnimator = new app.animator(16, 8, 128, 128, 1024 / 2048);
											// Animation Index				// Start	// End		// Time		// Looping?			
		this.mCharacterAnimator.addAnimation(app.character.State.IDLE, 		59, 		61, 		0.075, 		true);
		this.mCharacterAnimator.addAnimation(app.character.State.AIDLE, 	59, 		61, 		0.075, 		true);
		this.mCharacterAnimator.addAnimation(app.character.State.MOVE, 		29, 		40, 		0.075, 		true);
		this.mCharacterAnimator.addAnimation(app.character.State.AMOVE, 	19, 		28, 		0.075, 		true);
		this.mCharacterAnimator.addAnimation(app.character.State.ATTACK,	0,			18,			0.075,		false);
		this.mCharacterAnimator.addAnimation(app.character.State.DYING,		41,			58,			0.075,		false);
		this.mCharacterAnimator.addAnimation(app.character.State.CHEER1,	86,			89,			0.075,		true);
		this.mCharacterAnimator.addAnimation(app.character.State.CHEER2,	90,			98,			0.075,		true);
		this.mCharacterAnimator.addAnimation(app.character.State.CHEER3,	99,			106,		0.075,		true);

		// Build a tetrahedron
		var tetraGeom = new THREE.Geometry();
		var tetraHalfH = 80.0;
		var tetraBase = 80.0;
		var tetraIncr = (3.14159 * 2.0) / 3.0;
		var tetraMat = new THREE.MeshPhongMaterial({color: 0xffffff, overdraw: true});

		for(var i = 0; i < 4; i++)
		{
			tetraGeom.vertices.push(new THREE.Vector3(Math.cos(tetraIncr * 1) * tetraBase, -tetraHalfH, Math.sin(tetraIncr * 1) * tetraBase));
			tetraGeom.vertices.push(new THREE.Vector3(Math.cos(tetraIncr * 2) * tetraBase, -tetraHalfH, Math.sin(tetraIncr * 2) * tetraBase));
			tetraGeom.vertices.push(new THREE.Vector3(Math.cos(tetraIncr * 3) * tetraBase, -tetraHalfH, Math.sin(tetraIncr * 3) * tetraBase));
			tetraGeom.vertices.push(new THREE.Vector3(0.0, tetraHalfH, 0.0));
			tetraGeom.verticesNeedUpdate = true;
			tetraGeom.faces.push(new THREE.Face3(0, 1, 2));
			tetraGeom.faces.push(new THREE.Face3(1, 0, 3));
			tetraGeom.faces.push(new THREE.Face3(2, 1, 3));
			tetraGeom.faces.push(new THREE.Face3(0, 2, 3));
			var tetraMesh = new THREE.Mesh(tetraGeom, tetraMat);
			tetraMesh.position.y = tetraHalfH;
			
			tetraMesh.rotation.y = (tetraIncr / 2) + (i * tetraIncr);
			tetraMesh.position.x = (i % 2) * this.mWorldXMax;
			tetraMesh.position.z = ((i - (i % 2)) / 2) * this.mWorldZMax;

			this.mScene.add(tetraMesh);
		}
	},
	
	/**
	* createPlayer
	*	Adds a player to the game
	*
	* @param c : player color
	* @param h : true for human, false for ai
	* @param sr : player starting row
	* @param sc : player starting column
	*
	* @returns : player index
	*/
	createPlayer: function(c, h, sr, sc)
	{
		var player = new app.player(this.mPlayers.length, c, h);
		if(h)
		{
			this.mKeyEventListeners.push(player.mController);
			this.mMouseEventListeners.push(player.mController);
		}
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
		this.mElapsedTime += dt;

		// Update each controller
		for(var i = 0; i < this.mPlayers.length; i++)
			this.mPlayers[i].mController.update(dt);

		if(this.mWinner == undefined)
		{
			// Update zones
			for(var i = 0; i < this.mZones.length; i++)
				for(var j = 0; j < this.mZones[i].length; j++)
					this.mZones[i][j].update(dt);
			this.mLastSpawn += dt;
			this.mSpawnStatusBar.setStatus(1.0 - (this.mLastSpawn / this.mTimePerSpawn));
			
			if((this.mLastSpawn += dt) > this.mTimePerSpawn)
			{
				this.mLastSpawn %= this.mTimePerSpawn;
				for(var row = 0; row < this.mZones.length; row++)
					for(var col = 0; col < this.mZones[row].length; col++)
					{
						this.mZones[row][col].spawnCharacter();
					}
			}
		}

		// Animated the objects
		this.mAnimatedObjects[0].position.y = 0 + Math.sin(this.mElapsedTime * this.mAnimatedObjectTimeFactor) * 40;
		this.mAnimatedObjects[1].position.y = 0 + -Math.sin(this.mElapsedTime * this.mAnimatedObjectTimeFactor) * 40;

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
		
		// Update the variables to match those
		// of the widgets
		app.game.mTimePerSpawn = this.controls.spawnRate;
		app.game.mAnimatedObjectTimeFactor = this.controls.animationSpeed;
		if(app.game.mPlayers[0])
		{
			app.game.mPlayers[0].mController.mCamSpeed = this.controls.cameraSpeed;
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
	* checkForWinner
	*	Check to see if a player has won the game
	*
	* @param p : player to check
	*/
	checkForWinner: function()
	{
		var potentialWinner = this.mZones[0][0].mOwner;
		for(var i = 0; i < this.mZones.length; i++)
			for(var j = 0; j < this.mZones[i].length; j++)
				if(this.mZones[i][j].mOwner != potentialWinner)
					return;
				
		app.log("Player " + potentialWinner.mPlayerID + " has won the game!");
		this.mWinner = potentialWinner;
		
		for(var i = 0; i < this.mCharacters.length; i++)
			this.mCharacters[i].mState = app.character.State.CHEER1 + i % 3;
	},

	/**
	* draw
	*	Primary game draw function
	*/
	draw: function()
	{
		this.mRenderer.render(this.mScene, this.mCamera);
	},
	
	/**
	* injectKeyDown
	*	Key down event handler
	*
	* @param e : key event
	*/
	injectKeyDown: function(e)
	{
		for(var i = 0; i < this.mKeyEventListeners.length; i++)
			this.mKeyEventListeners[i].injectKeyDown(e);
	},
	
	/**
	* injectKeyUp
	*	Key up event handler
	*
	* @param e : key event
	*/
	injectKeyUp: function(e)
	{
		for(var i = 0; i < this.mKeyEventListeners.length; i++)
			this.mKeyEventListeners[i].injectKeyUp(e);
	},
	
	/**
	* injectMouseDown
	*	Mouse down event handler
	*
	* @param e : mouse event
	*/
	injectMouseDown: function(e)
	{
		for(var i = 0; i < this.mMouseEventListeners.length; i++)
			this.mMouseEventListeners[i].injectMouseDown(e);
	},
	
	/**
	* injectMouseUp
	*	Mouse up event handler
	*
	* @param e : mouse event
	*/
	injectMouseUp: function(e)
	{
		for(var i = 0; i < this.mMouseEventListeners.length; i++)
			this.mMouseEventListeners[i].injectMouseUp(e);
	},
	
	/**
	* injectMouseMove
	*	Mouse move event handler
	*
	* @param e : mouse event
	*/
	injectMouseMove: function(e)
	{
		for(var i = 0; i < this.mMouseEventListeners.length; i++)
			this.mMouseEventListeners[i].injectMouseMove(e);
	},
	
	// Plays the background music
	startSoundtrack: function(){
		createjs.Sound.stop();
		createjs.Sound.play("background",{loop: -1, volume: 0.2});
	}
};
