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
		this.mDestination 	= new THREE.Vector3(0,app.game.mCharHeight / 2.0,0);
		this.mTarget 		= undefined;
		this.mAttackRadius	= 200.0;
		this.mAttackDamage	= 20.0;
		this.mAttackRate	= 4.0;
		this.mLastAttack	= 0.0;
		this.mLastAttack	= 0.0;
		this.mMesh 			= undefined;
		this.mState 		= app.character.State.IDLE;
		this.mStateTime		= 0.0;
		this.mAnimator		= undefined;
		this.mOwner 		= owner;
		this.mCurrZoneRow	= undefined;
		this.mCurrZoneCol	= undefined;
	};
	
	var p = character.prototype;

	/**
	* update
	*	Update this character according to its current state
	*
	* @param dt : delta time
	*/
	p.update = function(dt)
	{
		if(!this.mActive)
			return;
	
		// Update state & animation info
		this.mStateTime += dt;
		this.mLastAttack += dt;
		if(this.mAnimator != undefined)
		{
			var flip = this.mDestination.x < this.mMesh.position.x ? false : true;
		
			var animUvs = this.mAnimator.getFrameUvs(this.mState, this.mStateTime, flip);
			this.mMesh.geometry.faceVertexUvs[0][0] = [animUvs[0], animUvs[1], animUvs[3]];
			this.mMesh.geometry.faceVertexUvs[0][1] = [animUvs[1], animUvs[2], animUvs[3]];
			this.mMesh.geometry.uvsNeedUpdate = true;
		}
	
		// Check for containing zone
		var zoneRow = 
			(this.mMesh.position.x - 
			(this.mMesh.position.x % app.game.mZoneWidth)) /
			app.game.mZoneWidth;
		var zoneCol =
			(this.mMesh.position.z -
			(this.mMesh.position.z % app.game.mZoneDepth)) /
			app.game.mZoneDepth;

		if(zoneRow != this.mCurrZoneRow || this.mCurrZoneRow == undefined
		|| zoneCol != this.mCurrZoneCol || this.mCurrZoneCol == undefined)
		{
			app.game.notifyCharacterChangedZone(
				this, 
				this.mCurrZoneRow, 
				this.mCurrZoneCol,
				zoneRow,
				zoneCol);

			this.mCurrZoneRow = zoneRow;
			this.mCurrZoneCol = zoneCol;
		}

		// Update according to character state
		switch(this.mState)
		{
		case app.character.State.IDLE:
		case app.character.State.AIDLE:
		{
			if(this.mState == app.character.State.AIDLE)
			{
				this.checkForEnemies();
			}
		}
			break;

		case app.character.State.MOVE:
		case app.character.State.AMOVE:
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
				//this.mMesh.position.y = 0;
				this.mMesh.position.z = this.mDestination.z;
				this.setState(app.character.State.AIDLE);
				return;
			}

			this.mMesh.position.x += diff.x;
			//this.mMesh.position.y = app.game.mCharHeight/2;
			this.mMesh.position.z += diff.z;

			if(this.mState == app.character.State.AMOVE)
				this.checkForEnemies();
		}
			break;

		case app.character.State.ATTACK:
		{
			if(this.mTarget == undefined
			|| !this.mTarget.mActive
			|| this.mTarget.mState == app.character.State.DYING)
			{
				this.mTarget = undefined;
				if(this.mMesh.position.equals(this.mDestination))
					this.setState(app.character.State.AIDLE);
				else
					this.setState(app.character.State.AMOVE);
				return;
			}

			if(this.mLastAttack >= this.mAttackRate)
			{
				this.mLastAttack %= this.mAttackRate;
				this.mTarget.takeDamage(this.mAttackDamage);
				this.mStateTime = 0.0;
			}
		}
			break;
			
		case app.character.State.DYING:
		{
			if(this.mStateTime >= app.game.mCharacterCorpseTime)
				this.mActive = false;
		}
			break;
			
		case app.character.State.CHEER:
		{
		
		}
			break;
		}	// End Switch

	};
	
	/**
	* setState
	*	Set this character's state. State should only be set here, not directly
	*
	* @param state : this character's new state
	*/
	p.setState = function(state)
	{
		if(this.mState == state
		|| this.mState == app.character.State.DYING)
			return;
		
/*
		if(state == app.character.State.IDLE
		|| state == app.character.State.AIDLE)
			this.mDestination = this.mMesh.position;
*/
		this.mState = state;
		this.mStateTime = 0.0;
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
				
			if(local.mState == app.character.State.DYING)
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
	};

	/**
	* attack
	*	Cause this character to fire a round!
	*/
	p.attack = function()
	{
		app.log("app.character.attack()");
	};

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
		this.mDestination.y = this.mMesh.position.y;
		this.mDestination.z = z;
		if(!amove)
			this.setState(app.character.State.MOVE);
		else
			this.setState(app.character.State.AMOVE);
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
		this.setState(app.character.State.ATTACK);
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
	* setColor
	*	Set the color of this character
	*
	* @param c : color
	*/
	p.setColor = function(c)
	{
		this.mMesh.material.color = c;		
	};

	/**
	* die
	*	Kill this character and remove it from the game level
	*/
	p.die = function()
	{
		this.setState(app.character.State.DYING);
	};

	return character;
}();

/**
	* State
	*	Represents all potential character states
	*
	* IDLE : Will stand in place and not care about defending itself
	* AIDLE : Will stand in place, and will attack anything if it's close enough
	* MOVE : Character will move to its destination, returning to idle when it is reached
	* AMOVE : Same behavior as move, but if the character encunters an enemy, it engages
	* ATTACK : Character will continue to chase down and attack its target until it dies
	* DYING : Character will bleed out, fall over and die
	* CHEER : Character will cheer!
	*/
	app.character.State =
	{
		IDLE: 0,
		AIDLE: 1,
		MOVE: 2,
		AMOVE: 3,
		ATTACK: 4,
		DYING: 5,
		CHEER1: 6,
		CHEER2: 7,
		CHEER3: 8
	};
