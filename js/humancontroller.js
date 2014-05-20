/**
* humanController.js
*/
"use strict"

var app = app || {};

app.humanController = function()
{
	/**
	* humanController
	*	Provides human-controlled access to a player
	*
	* @param pid : player id
	*/
	function humanController(pid)
	{
		this.mPlayerID 			= pid;
	
		this.mCamera 			= app.game.mCamera;
		this.mCamSpeed 			= 768.0;
		this.mCamVelocity 		= new THREE.Vector3(0,0,0);
		this.mCamTilt 			= 256.0;
		this.mCamYOffset 		= 512.0;
		this.mCamConstrained	= true;

		this.mProjector			= new THREE.Projector();
		this.mClickStart		= undefined;
		this.mCharSelection		= [];
		this.mSelectionColor		= 0x00ff00;
		this.mQueuedKey			= this.mCharMove;
		
		var selectionGeo 		= new THREE.PlaneGeometry(100, 100, 1, 1);
		var selectionMat 		= new THREE.MeshPhongMaterial({color: this.mSelectionColor, overdraw: true, transparent: true, opacity: 0.5});
		this.mSelectionMesh		= new THREE.Mesh(selectionGeo, selectionMat);
		this.mSelectionMesh.visible = false;
		app.game.mScene.add(this.mSelectionMesh);
		
		// USER CONFIGURATION
		this.mCamMoveLeft 		= app.KEYBOARD["KEY_A"];
		this.mCamMoveRight 		= app.KEYBOARD["KEY_D"];
		this.mCamMoveForward 	= app.KEYBOARD["KEY_W"];
		this.mCamMoveBackward 	= app.KEYBOARD["KEY_S"];

		this.mCharMove			= app.KEYBOARD["KEY_M"];
		this.mCharAMove			= app.KEYBOARD["KEY_N"];
		this.mCharIdle			= app.KEYBOARD["KEY_H"];
		this.mCharAIdle			= app.KEYBOARD["KEY_J"];
		this.mToggleInstructions	= app.KEYBOARD["KEY_P"];

		var instructionPlane = new THREE.PlaneGeometry(200, 200);
		this.mInstructions = new THREE.Mesh(instructionPlane, app.MATERIALS["MAT_INSTRUCTIONS"]);
		this.mInstructions.position.y = 400;
		this.mInstructions.rotation.x = -3.14159 / 3;
		app.game.mScene.add(this.mInstructions);
	};
	
	var p = humanController.prototype;
	
	/**
	* update
	*	Update controller functionality
	*
	* @param dt : delta time
	*/
	p.update = function(dt)
	{
		this.mCamera.position.x += this.mCamVelocity.x * dt;
		this.mCamera.position.y = this.mCamYOffset;
		this.mCamera.position.z += this.mCamVelocity.z * dt;
		
		if(this.mCamConstrained)
		{
			this.mCamera.position.x = this.mCamera.position.x > app.game.mWorldXMin ? this.mCamera.position.x : app.game.mWorldXMin;
			this.mCamera.position.x = this.mCamera.position.x < app.game.mWorldXMax ? this.mCamera.position.x : app.game.mWorldXMax;
			this.mCamera.position.z = this.mCamera.position.z > app.game.mWorldZMin ? this.mCamera.position.z : app.game.mWorldZMin;
			this.mCamera.position.z = this.mCamera.position.z < app.game.mWorldZMax ? this.mCamera.position.z : app.game.mWorldZMax;
		}
		
		this.mCamera.lookAt(new THREE.Vector3(
			this.mCamera.position.x,
			0.0,
			this.mCamera.position.z - this.mCamTilt));

		this.mInstructions.position.x = this.mCamera.position.x;
		this.mInstructions.position.z = this.mCamera.position.z - 50;
	};

	/**
	* move
	*	Move this camera to the position specified
	*/
	p.moveTo = function(x, z)
	{
		this.mCamera.position.x = x;
		this.mCamera.position.z = this.mCamYOffset;
		this.mCamera.position.z = z;
	};
	
	/**
	* injectKeyDown
	*	Key down event handler
	*
	* @param e : key event
	*/
	p.injectKeyDown = function(e)
	{
		switch(e.keyCode)
		{
		case this.mCamMoveLeft:
		case this.mCamMoveRight:
		case this.mCamMoveForward:
		case this.mCamMoveBackward:
			this.updateCamVelocity();
			break;

		case this.mCharMove:
			this.mQueuedKey = this.mCharMove;
			break;

		case this.mCharAMove:
			this.mQueuedKey = this.mCharAMove;
			break;

		case this.mCharIdle:
			for(var i = 0; i < this.mCharSelection.length; i++)
				this.mCharSelection[i].setState(app.character.State.IDLE);
			break;

		case this.mCharAIdle:
			for(var i = 0; i < this.mCharSelection.length; i++)
				this.mCharSelection[i].setState(app.character.State.AIDLE);
			break;

		case 32:
			this.moveTo(app.game.mWorldXMax / 2, app.game.mWorldZMax);
			break;
	
		case this.mToggleInstructions:
			this.mInstructions.visible = !this.mInstructions.visible;
			break;
		}
	};
	
	/**
	* injectKeyUp
	*	Key up event handler
	*
	* @param e : key event
	*/
	p.injectKeyUp = function(e)
	{
		switch(e.keyCode)
		{
		case this.mCamMoveLeft:
		case this.mCamMoveRight:
		case this.mCamMoveForward:
		case this.mCamMoveBackward:
			this.updateCamVelocity();
			break;
		}
	};
	
	/**
	* injectMouseDown
	*	Mouse down event handler
	*
	* @param e : mouse event
	*/
	p.injectMouseDown = function(e)
	{
		// Only save the original click, we will perform actions on mouse up
		this.mClickStart = new THREE.Vector2(e.clientX, e.clientY);
	};
	
	/**
	* injectMouseUp
	*	Mouse up event handler
	*
	* @param e : mouse event
	*/
	p.injectMouseUp = function(e)
	{
		// Cast a ray from the mouse release position
		var intersections = this.getScreenIntersections(e.clientX, e.clientY);
		
		if(this.mClickStart.x != e.clientX || this.mClickStart.y != e.clientY)
		{
			var vector = new THREE.Vector3(e.clientX, e.clientY);
			if(this.updateSelectionBox(vector))
			{
				// We have a new selection, clear the old one
				for(var i = 0; i < this.mCharSelection.length; i++)
					this.mCharSelection[i].notifyDeselected();
				this.mCharSelection = this.getCharactersInSelection(
					this.mSelectionMesh.geometry.vertices[0],
					this.mSelectionMesh.geometry.vertices[3]);
				this.mSelectionMesh.visible = false;
				for(var i = 0; i < this.mCharSelection.length; i++)
					this.mCharSelection[i].notifySelected();
			}
		}
		else
		{
			// We have a single click in space
			if(intersections.length > 0)
			{
				var chars = this.getPlayerCharacters();
				for(var i = 0; i < this.mCharSelection.length; i++)
				{
					var destX =
						intersections[0].point.x -
						app.game.mZoneWidth / 2 +
						Math.random() * app.game.mZoneWidth;
						
					var destZ =
						intersections[0].point.z -
						app.game.mZoneDepth / 2 +
						Math.random() * app.game.mZoneDepth;
					
					if(this.mQueuedKey == this.mCharMove)
						this.mCharSelection[i].setDestination(destX, destZ, false);
					else
						this.mCharSelection[i].setDestination(destX, destZ, true);
				}
			}
		}
	};
	
	/**
	* injectMouseMove
	*	Mouse move event handler
	*
	* @param e : mouse event
	*/
	p.injectMouseMove = function(e)
	{
		// Only interested in selection dragging (left mouse)
		if(e.buttons != 1)
			return;
		
		this.mSelectionMesh.visible = true;
		var vector = new THREE.Vector3(e.clientX, e.clientY);
		this.updateSelectionBox(vector);
	};
	
	/**
	* updateCamVelocity
	*	Update the camera's velocity according to what keys are pressed
	*/
	p.updateCamVelocity = function()
	{
		this.mCamVelocity = new THREE.Vector3(0,0,0);

		if(app.keydown[this.mCamMoveLeft]) 		this.mCamVelocity.x -= 1.0;
		if(app.keydown[this.mCamMoveRight])		this.mCamVelocity.x += 1.0;
		if(app.keydown[this.mCamMoveForward])	this.mCamVelocity.z -= 1.0;
		if(app.keydown[this.mCamMoveBackward])	this.mCamVelocity.z += 1.0;

		this.mCamVelocity.normalize();
		this.mCamVelocity.x *= this.mCamSpeed;
		this.mCamVelocity.y *= this.mCamSpeed;
		this.mCamVelocity.z *= this.mCamSpeed;
	};
	
	/**
	* getPlayerCharacters
	*	Get all of the characters owned by the player this controller is attached to
	*
	* @returns : array of player's characters
	*/
	p.getPlayerCharacters = function()
	{
		var p = app.game.mPlayers[this.mPlayerID];
		return app.game.mCharacters.filter(function(c)
			{
				return c.mOwner == p;
			});
	};
	
	/**
	* getCharactersInSelection
	*	Get an array of characters in the selection box formed by two corner vertices
	*
	* @param v1 : selection origin vertex
	* @param v2 : selection end vertex
	*
	* @returns : array of player's characters in the selection
	*/
	p.getCharactersInSelection = function(v1, v2)
	{
		var minX = v1.x;
		var maxX = v2.x;
		if(minX > maxX)
		{
			var h = minX;
			minX = maxX;
			maxX = h;
		}
		var minZ = v1.z;
		var maxZ = v2.z;
		if(minZ > maxZ)
		{
			var h = minZ;
			minZ = maxZ;
			maxZ = h;
		}
	
		return this.getPlayerCharacters().filter(function(c)
			{
				if(c.mMesh.position.x + app.game.mCharWidth / 2 < minX) return false;
				if(c.mMesh.position.x - app.game.mCharWidth / 2 > maxX) return false;
				if(c.mMesh.position.z + app.game.mCharHeight / 2 < minZ) return false;
				if(c.mMesh.position.z - app.game.mCharHeight / 2 > maxZ) return false;
				return true;
			});
	};
	
	/**
	* getScreenIntersections
	*	Cast a ray from screen coordinates into the world and see what it intersects
	*
	* @param v : screen vector
	*
	* @returns : array of intersections
	*/
	p.getScreenIntersections = function(x, y)
	{
		x = (x / window.innerWidth) * 2 - 1;
		y = (y / window.innerHeight) * 2 - 1;
		
		var vector = new THREE.Vector3(x, -y, 1);
		this.mProjector.unprojectVector(vector, this.mCamera);
		var ray = new THREE.Raycaster(
			this.mCamera.position,
			vector.sub(this.mCamera.position).normalize());
		return ray.intersectObjects(app.game.mZoneMeshes);
	};
	
	/**
	* updateSelectionBox
	*	Update the selection box to match from the origin vector to the supplied vector
	*
	* @param v : selection end vector
	*
	* @returns : false if failed to update (v out of world bounds)
	*/
	p.updateSelectionBox = function(v)
	{
		// Get raycast intersection from v
		var endIntersections 	= this.getScreenIntersections(v.x, v.y);
		var end;
		if(endIntersections.length < 1)
		{
			//return false;
			end = new THREE.Vector3(0.0, 0.0, 0.0);
		}
		else
		{
			end = endIntersections[0].point;
		}

		// Get raycast intersections from origin
		var originIntersections = this.getScreenIntersections(this.mClickStart.x, this.mClickStart.y);
		var origin;
		if(originIntersections.length < 1)
		{
			origin = new THREE.Vector3(0.0, 0.0, 0.0);
		}
		else
		{
			origin = originIntersections[0].point;
		}
		
		var left 	= origin.x 	< end.x ? origin.x : end.x;
		var right 	= origin.x 	> end.x ? origin.x : end.x;
		var bottom 	= origin.z 	< end.z ? origin.z : end.z;
		var top 	= origin.z 	> end.z ? origin.z : end.z;
		var elev	= 20;
		
		this.mSelectionMesh.geometry.vertices[0] = new THREE.Vector3(left, elev, bottom);
		this.mSelectionMesh.geometry.vertices[1] = new THREE.Vector3(right, elev, bottom);
		this.mSelectionMesh.geometry.vertices[3] = new THREE.Vector3(right, elev, top);
		this.mSelectionMesh.geometry.vertices[2] = new THREE.Vector3(left, elev, top);
		this.mSelectionMesh.geometry.verticesNeedUpdate = true;

		return true;	
	};
	
	return humanController;
}();
