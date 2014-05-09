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
		this.mCamConstrained	= false;
		
		this.mProjector			= new THREE.Projector();
		this.mClickStart		= undefined;
		this.mCharSelection		= [];
		
		var selectionGeo 		= new THREE.PlaneGeometry(100, 100, 1, 1);
		var selectionMat 		= new THREE.MeshPhongMaterial({color: 0x000000, overdraw: true});
		this.mSelectionMesh		= new THREE.Mesh(selectionGeo, selectionMat);
		app.game.mScene.add(this.mSelectionMesh);
		
		// USER CONFIGURATION
		this.mCamMoveLeft 		= app.KEYBOARD["KEY_A"];
		this.mCamMoveRight 		= app.KEYBOARD["KEY_D"];
		this.mCamMoveForward 	= app.KEYBOARD["KEY_W"];
		this.mCamMoveBackward 	= app.KEYBOARD["KEY_S"];
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
			// TODO: constrain camera to world
		}
		
		this.mCamera.lookAt(new THREE.Vector3(
			this.mCamera.position.x,
			0.0,
			this.mCamera.position.z - this.mCamTilt));
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
			// Cast a ray from the original mouse click
			var originIntersections = this.getScreenIntersections(this.mClickStart.x, this.mClickStart.y);
			
			if(originIntersections.length > 0)
			{
				var origin 	= originIntersections[0].point;
				var end 	= intersections[0].point
				
				var left 	= origin.x 	< end.x ? origin.x : end.x;
				var right 	= origin.x 	> end.x ? origin.x : end.x;
				var bottom 	= origin.z 	< end.z ? origin.z : end.z;
				var top 	= origin.z 	> end.z ? origin.z : end.z;
				var elev	= 10;
			
				this.mSelectionMesh.geometry.vertices[0] = new THREE.Vector3(left, elev, bottom);
				this.mSelectionMesh.geometry.vertices[1] = new THREE.Vector3(right, elev, bottom);
				this.mSelectionMesh.geometry.vertices[2] = new THREE.Vector3(right, elev, top);
				this.mSelectionMesh.geometry.vertices[3] = new THREE.Vector3(left, elev, top);
				this.mSelectionMesh.geometry.verticesNeedUpdate = true;
			
				//this.mCharSelection = this.getCharactersInSelection(
				//	intersects[0].point,
				//	originIntersects[0].point);
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
				if(c.mMesh.position.x < minX) return false;
				if(c.mMesh.position.x > maxX) return false;
				if(c.mMesh.position.z < minZ) return false;
				if(c.mMesh.position.z > maxZ) return false;
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
	*/
	p.updateSelectionBox = function(v)
	{
		
	};
	
	return humanController;
}();