/**
* camcontrols.js
*/
"use strict"

var app = app || {};

app.controls =
{
	mCamera:		undefined,
	mCamSpeed:		768.0,
	mCamVelocity:		undefined,
	mCamTilt:		256.0,
	mCamTiltBoundFactor:	0.1,
	mCamYOffset:		512.0,
	mKeyMoveLeft:		app.KEYBOARD["KEY_A"],
	mKeyMoveRight:		app.KEYBOARD["KEY_D"],
	mKeyMoveForward:	app.KEYBOARD["KEY_W"],
	mKeyMoveBackward:	app.KEYBOARD["KEY_S"],

	/**
	* init
	*	Initializes the game controller
	*
	* @param camera : the user's camera
	*/
	init: function(camera)
	{
		this.mCamera = camera;
		this.mCamVelocity = new THREE.Vector3(0,0,0);
	},

	/**
	* update
	*	Controller update logic
	*
	* @param dt : delta time
	*/
	update: function(dt)
	{
		this.mCamera.position.x += this.mCamVelocity.x * dt;
		this.mCamera.position.y = this.mCamYOffset;
		this.mCamera.position.z += this.mCamVelocity.z * dt;

		// Constrain camera to world
		if(this.mCamera.position.x < app.game.mWorldXMin)	
			this.mCamera.position.x = app.game.mWorldXMin;
		else if(this.mCamera.position.x > app.game.mWorldXMax)	
			this.mCamera.position.x = app.game.mWorldXMax;

		if(this.mCamera.position.z + (this.mCamTilt * this.mCamTiltBoundFactor) < app.game.mWorldZMin)
			this.mCamera.position.z = app.game.mWorldZMin - (this.mCamTilt * this.mCamTiltBoundFactor);
		else if(this.mCamera.position.z - (this.mCamTilt * this.mCamTiltBoundFactor) > app.game.mWorldZMax)
			this.mCamera.position.z = app.game.mWorldZMax + (this.mCamTilt * this.mCamTiltBoundFactor);

		this.mCamera.lookAt(new THREE.Vector3(
			this.mCamera.position.x,
			0.0,
			this.mCamera.position.z - this.mCamTilt));
	},

	/**
	* injectKeyDown
	*	Key down event handler
	*
	* @param e : key down event
	*/
	injectKeyDown: function(e)
	{
		switch(e.keyCode)
		{
		case this.mKeyMoveLeft:
		case this.mKeyMoveRight:
		case this.mKeyMoveForward:
		case this.mKeyMoveBackward:
			this.computeCamVelocity();
			break;
		}
	},

	/**
	* injectKeyUp
	*	Key up event handler
	*
	* @param e : key up event
	*/
	injectKeyUp: function(e)
	{
		switch(e.keyCode)
		{
		case this.mKeyMoveLeft:
		case this.mKeyMoveRight:
		case this.mKeyMoveForward:
		case this.mKeyMoveBackward:
			this.computeCamVelocity();
			break;
		}
	},

	/**
	* computeCamVelocity
	*	Recompute the camera's velocity
	*/
	computeCamVelocity: function()
	{
		this.mCamVelocity = new THREE.Vector3(0,0,0);

		if(app.keydown[this.mKeyMoveLeft]) 	this.mCamVelocity.x -= 1.0;
		if(app.keydown[this.mKeyMoveRight])	this.mCamVelocity.x += 1.0;
		if(app.keydown[this.mKeyMoveForward])	this.mCamVelocity.z -= 1.0;
		if(app.keydown[this.mKeyMoveBackward])	this.mCamVelocity.z += 1.0;

		this.mCamVelocity.normalize();
		this.mCamVelocity.x *= this.mCamSpeed;
		this.mCamVelocity.y *= this.mCamSpeed;
		this.mCamVelocity.z *= this.mCamSpeed;
	}
};
