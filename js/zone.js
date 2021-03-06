/**
* zone.js
*/
"use strict"

var app = app || {};

app.zone = function()
{
	/**
	* zone
	*	Represents a single zone in our game
	*
	* @param x, y, z : zone 3D coordinates
	* @param w, h, d : zone 3D dimensions
	* @param c : zone color
	* @param r : ratio of the status bar width to zone width
	* @param t : material to be used
	*/
	function zone(x, y, z, w, h, d, c, r, t)
	{
		var zoneGeo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
		var zoneMat = t;
		this.mMesh = new THREE.Mesh(zoneGeo, zoneMat);
		this.mMesh.position = new THREE.Vector3(x,y-(h/2),z);
		app.game.mScene.add(this.mMesh);
		
		this.mStatusBar = new app.statusbar(x,y+3.5,z+40,w*r,7);
		this.mStatusBar.setStatus(0.0);
		this.mStatusBar.setColor(0xff0000);
		this.mStatusBar.setVisible(false);
	
		this.mOwner = undefined;
		this.mOccupants = [0, 0, 0, 0];
		this.mOwnership = [0, 0, 0, 0];
		this.mDefaultColor = c;
		this.mTimeToCapture = 20.0;
	};

	var p = zone.prototype;
	
	/**
	* update
	*	Update this zone. Takes care of ownership logic
	*
	* @param dt : delta time
	*/
	p.update = function(dt)
	{
		if(this.isZoneOccupied())
		{
			// Zone has units in it
			if(this.mOwner != undefined)
			{
				// There is an owner
				var sum = 0;
				for(var i = 0; i < this.mOccupants.length; i++)
					if(i != this.mOwner.mPlayerID)
						sum += this.mOccupants[i];
						
				var diff = this.mOccupants[this.mOwner.mPlayerID] - sum;
				if(diff < 0)
					diff *= dt;
					
				this.incrementOwnership(this.mOwner.mPlayerID, diff);
			}
			else
			{
				// There is not an owner
				// Who has the most occupants?
				var max = 0;
				for(var i = 1; i < this.mOccupants.length; i++)
					max = this.mOccupants[max] > this.mOccupants[i] ? max : i;
					
				// Does he have more than all other teams combined?
				var sum = 0;
				for(var i = 0; i < this.mOccupants.length; i++)
					if(i != max)
						sum += this.mOccupants[i];
					
				// If not, then do nothing
				var diff = this.mOccupants[max] - sum;
				if(diff <= 0)
					return;
					
				// Otherwise, increment ownership
				this.incrementOwnership(max, diff * dt);
			}
		}
		else
		{
			// No occupants at zone
			if(this.mOwner != undefined)
			{
				// There is an owner
				for(var i = 0; i < this.mOwnership.length; i++)
				{
					if(this.mOwner.mPlayerID == i)
						this.mOwnership[i] = this.mTimeToCapture;
					else
						this.mOwnership[i] = 0.0;
				}
			}
			else
			{
				// There is not an owner
				for(var i = 0; i < this.mOwnership.length; i++)
					this.mOwnership[i] = 0.0;
			}
		}
	};
	
	/**
	* getOwnershipRatio
	*	Get the ratio indicating time until capture
	*
	* @param t : ownership time
	*
	* @returns : ratio of ownership time to required time
	*/
	p.getOwnershipRatio = function(t)
	{
		return (t / this.mTimeToCapture);
	};
	
	/**
	* incrementOwnership
	*	Increment the ownership time for a given player.
	*	Directly handles player ownership according to time values.
	*
	* @param o : owner index
	* @param t : time to increment
	*/
	p.incrementOwnership = function(o, t)
	{
		this.mOwnership[o] += t;
		if(this.mOwnership[o] <= 0.0)
		{
			this.mOwnership[o] = 0.0;
			if(this.mOwner != undefined)
				this.setOwner(undefined);
		}
		else if(this.mOwnership[o] >= this.mTimeToCapture)
		{
			this.mOwnership[o] = this.mTimeToCapture;
			// TODO: This zone now belongs to a new owners
			this.setOwner(app.game.mPlayers[o]);
			this.mStatusBar.setVisible(false);
		}
		this.updateStatusBar();
	};
	
	/**
	* setOwner
	*	Handles all logic behind changing zone owner
	*
	* @param owner : new zone owner. pass undefined to revert to neutral
	*/
	p.setOwner = function(owner)
	{
		this.mOwner = owner;
		if(owner == undefined)
		{
			this.mMesh.material = new THREE.MeshPhongMaterial({color:this.mDefaultColor, overdraw: true});
			for(var i = 0; i < this.mOwnership.length; i++)
				this.mOwnership[i] = 0.0;
		}
		else
		{
			this.mMesh.material = new THREE.MeshPhongMaterial({color:this.mOwner.mColor, overdraw: true});
			this.mOwnership[owner.mPlayerID] = this.mTimeToCapture;
		}
		this.updateStatusBar();
		app.game.checkForWinner();
	};
	
	/**
	* updateStatusBar
	*	Update the status bar's color and progression
	*/
	p.updateStatusBar = function()
	{
		// Find who has ownership
		var i = 0;
		for(; i < this.mOwnership.length; i++)
			if(this.mOwnership[i] > 0)
				break;
				
		this.mStatusBar.setStatus(this.mOwnership[i] / this.mTimeToCapture);
	};

	/**
	* spawnCharacter
	*	Spawn a character from this zone according to which player owns it
	*/
	p.spawnCharacter = function()
	{
		if(this.mOwner == undefined)
			return;

		var characterMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(app.game.mCharWidth, app.game.mCharHeight, 1, 1),
			app.MATERIALS["MAT_CHARACTER_P" + this.mOwner.mPlayerID]);
		characterMesh.position = new THREE.Vector3(
					this.mMesh.position.x - app.game.mZoneWidth / 2 + Math.random() * app.game.mZoneWidth,	
					-1, //0, //app.game.mCharHeight/2,
					this.mMesh.position.z - app.game.mZoneDepth / 2 + Math.random() * app.game.mZoneDepth);
		characterMesh.rotation.set(app.game.mCharTilt, 0, 3.14159 / 2.0);

		var character = new app.character(this.mOwner);
		character.mMesh = characterMesh;
		character.mAnimator = app.game.mCharacterAnimator;
		app.game.mCharacters.push(character);

		app.game.mScene.add(characterMesh);
	};
	
	/**
	* isZoneOccupied
	* @returns : true is there are any units in this zone
	*/
	p.isZoneOccupied = function()
	{
		for(var i = 0; i < this.mOccupants.length; i++)
			if(this.mOccupants[i] > 0)
				return true;
		return false;
	};

	p.ownerAttachedCharacter = function(owner)
	{
		this.mOccupants[owner.mPlayerID]++;
		/*
		if(this.mOccupants[owner.mPlayerID] >= 2)
			this.setOwner(owner);
		*/
		this.mStatusBar.setVisible(true);
	};

	p.ownerRemovedCharacter = function(owner)
	{
		this.mOccupants[owner.mPlayerID]--;
		if(!this.isZoneOccupied())
			this.mStatusBar.setVisible(false);
	};

	return zone;
}();
