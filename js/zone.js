/**
* zone.js
*/
"use strict"

var app = app || {};

app.zone = function()
{
	function zone()
	{
		this.mMesh = undefined;
		this.mOwner = undefined;
	};

	var p = zone.prototype;
	
	p.update = function(dt)
	{

	};

	p.spawnCharacter = function()
	{
		//var character = new app.character();
		if(this.mOwner == undefined)
			return;

		app.log("Zone is spawning a character");

		var characterTexture = THREE.ImageUtils.loadTexture("./images/unit.png");

		var characterGeo = new THREE.PlaneGeometry(40, 40, 1, 1);
		var characterMat = new THREE.MeshPhongMaterial({color: this.mOwner.mColor, overdraw: true, map: characterTexture, transparent: true});
		var characterMesh = new THREE.Mesh(characterGeo, characterMat);
		characterMesh.position = new THREE.Vector3(
					this.mMesh.position.x,	
					app.game.mCharHeight/2,
					this.mMesh.position.z);
		characterMesh.rotation.set(app.game.mCharTilt, 0, 0);

		var character = new app.character();
		character.mMesh = characterMesh;
		app.game.mCharacters.push(character);

		app.game.mScene.add(characterMesh);
	};

	p.setOwner = function(owner)
	{
		this.mOwner = owner;
		this.mMesh.material = new THREE.MeshPhongMaterial({color:this.mOwner.mColor, overdraw: true});
	};

	return zone;
}();