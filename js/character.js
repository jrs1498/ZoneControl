/**
* character.js
*/
"use strict"

var app = app || {};

app.character = function()
{
	function character()
	{
		this.mMoveSpeed = 120.0;
		this.mDestination = new THREE.Vector3(0,0,0);
		this.mMesh = undefined;
	};

	var p = character.prototype;

	p.update = function(dt)
	{
		if(this.mDestination == this.mMesh.position)
			return;

		var diff = new THREE.Vector3(
			this.mDestination.x - this.mMesh.position.x,
			this.mDestination.y - this.mMesh.position.y,
			this.mDestination.z - this.mMesh.position.z);
		var ddist = diff.lengthSq();

		diff.normalize();
		diff.x *= this.mMoveSpeed * dt;
		diff.y *= this.mMoveSpeed * dt;
		diff.z *= this.mMoveSpeed * dt;
		var vdist = diff.lengthSq();

		if(vdist >= ddist)
		{
			this.mMesh.position.x = this.mDestination.x;
			this.mMesh.position.y = app.game.mCharHeight/2;
			this.mMesh.position.z = this.mDestination.z;
			return;
		}

		this.mMesh.position.x += diff.x;
		this.mMesh.position.y = app.game.mCharHeight/2;
		this.mMesh.position.z += diff.z;
	};

	p.setDestination = function(x, z)
	{
		this.mDestination.x = x;
		this.mDestination.z = z;
	};

	return character;
}();
