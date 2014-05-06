/**
* character.js
*/
"use strict"

var app = app || {};

app.character = function()
{
	function character(owner)
	{
		this.mActive		= true;
		this.mMoveSpeed 	= 120.0;
		this.mHealth 		= 100.0;
		this.mDestination 	= new THREE.Vector3(0,0,0);
		this.mTarget 		= undefined;
		this.mAttackRadius	= 200.0;
		this.mAttackDamage	= 20.0;
		this.mAttackRate	= 1.0;
		this.mLastAttack	= 0.0;
		this.mMesh 		= undefined;
		this.mState 		= this.State.IDLE;
		this.mOwner 		= owner;
	};

	var p = character.prototype;

	/**
	* State
	*	Represents all potential character states
	*
	* IDLE : Will stand in place until it is attacked, which will cause it to attack back
	* MOVE : Character will move to its destination, returning to idle when it is reached
	* AMOVE : Same behavior as move, but if the character encunters an enemy, it engages
	* ATTACK : Character will continue to chase down and attack its target until it dies
	*/
	p.State =
	{
		IDLE: 0,
		MOVE: 1,
		AMOVE: 2,
		ATTACKING: 3
	};

	/**
	* update
	*	Update this character according to its current state
	*
	* @param dt : delta time
	*/
	p.update = function(dt)
	{
		switch(this.mState)
		{
		case this.State.IDLE:
		{

		}
			break;

		case this.State.MOVE:
		case this.State.AMOVE:
		{
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
				this.mState = this.State.IDLE;
				return;
			}

			this.mMesh.position.x += diff.x;
			this.mMesh.position.y = app.game.mCharHeight/2;
			this.mMesh.position.z += diff.z;

			if(this.mState == this.State.AMOVE)
				this.checkForEnemies();
		}
			break;

		case this.State.ATTACK:
		{
			if(this.mTarget == undefined || !this.mTarget.mActive)
			{
				this.mTarget = undefined;
				if(this.mMesh.position.equals(this.mDestination))
					this.mState = this.State.IDLE;
				else
					this.mState = this.State.AMOVE;
				return;
			}

			this.mLastAttack += dt;
			if(this.mLastAttack >= this.mAttackRate)
			{
				this.mLastAttack %= this.mAttackRate;
				// TODO: attack animation here
				this.mTarget.takeDamage(this.mAttackDamage);
			}
		}
			break;
		}

	};

	/**
	* checkForEnemies
	*	Check to see if there is an enemy within range of attacking
	*/
	p.checkForEnemies = function()
	{
		for(var i = 0; i < app.game.mCharacters.length; i++)
		{
			var local = app.game.mCharacters[i];
			if(local.mOwner == this.mOwner)
				continue;

			var diff = new THREE.Vector3(
				local.mMesh.position.x - this.mMesh.position.x,
				local.mMesh.position.y - this.mMesh.position.y,
				local.mMesh.position.z - this.mMesh.position.z);
			var distSq = diff.lengthSq();
			var radiSq = this.mAttackRadius * this.mAttackRadius;

			if(distSq > radiSq)
				continue;

			this.setTarget(local);
		}
	}

	/**
	* setDestination
	*	Give this character a destination to move towards
	*
	* @param x : destination x coordinate
	* @param z : destination z coordinate
	*/
	p.setDestination = function(x, z, amove)
	{
		this.mDestination.x = x;
		this.mDestination.z = z;
		if(!amove)
			this.mState = this.State.MOVE;
		else
			this.mState = this.State.AMOVE;
	};

	/**
	* setTarget
	*	Set the target which this character is attacking
	*
	* @param target : this character's attack target
	*/
	p.setTarget = function(target)
	{
		this.mTarget = target;
		this.mState = this.State.ATTACK;
	};

	/**
	* takeDamage
	*	This is the only way you should cause a character to take damage.
	*	Do not modify mHealth directly!
	*
	* @param amount : amount of damage taken. If greater than health, character will die
	*/
	p.takeDamage = function(amount)
	{
		this.mHealth -= amount;
		if(this.mHealth <= 0)
			this.mHealth = 0;
		else return;

		this.die();
	};

	/**
	* die
	*	Kill this character and remove it from the game level
	*/
	p.die = function()
	{
		// TODO: death animation here
		this.mActive = false;
	};

	return character;
}();
