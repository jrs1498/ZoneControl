/**
* statusbar.js
*/
"use strict"

var app = app || {};

app.statusbar = function()
{
	function statusbar(x, y, z, w, h)
	{
		this.mStatus = 0.0;
		this.mWidth = w;
		
		// Create the backdrop
		var backGeo = new THREE.PlaneGeometry(w, h);
		var backMat = new THREE.MeshPhongMaterial({color: 0xffffff, overdraw: true, side: THREE.DoubleSide});
		this.mBack = new THREE.Mesh(backGeo, backMat);
		this.mBack.position = new THREE.Vector3(x,y,z);
		this.mBack.rotation.x = -(3.14159 / 3);
		app.game.mScene.add(this.mBack);
		
		// Create the progress bar
		var frontGeo = new THREE.PlaneGeometry(1, h-4);
		var frontMat = new THREE.MeshPhongMaterial({color: 0x000000, overdraw: true, side: THREE.DoubleSide});
		this.mFront = new THREE.Mesh(frontGeo, frontMat);
		this.mFront.position = new THREE.Vector3(x+2,y+1,z);
		this.mFront.rotation.x = -(3.14159 / 3);
		app.game.mScene.add(this.mFront);
	};
	
	var p = statusbar.prototype;
	
	/**
	* setStatus
	*	Set this status bar's status indicator
	*
	* @param f : fraction between 0.0 and 1.0
	*/
	p.setStatus = function(f)
	{
		if(f < 0.0) f = 0.0;
		if(f > 1.0) f = 1.0;
		this.mStatus = f;
		
		var frontWidth = this.mWidth * this.mStatus;
		if(frontWidth <= 0.0) frontWidth = 0.1;
		this.mFront.scale.set(frontWidth,1,1);
		this.mFront.position.x = 
			this.mBack.position.x - this.mWidth / 2.0 +
			frontWidth / 2.0;

	};
	
	/**
	* setColor
	*	Set the color of the status indicator
	*
	* @param c : status indicator color
	*/
	p.setColor = function(c)
	{
		this.mFront.material = new THREE.MeshPhongMaterial({color: c, overdraw: true, side: THREE.DoubleSide});
	};
	
	/**
	* setVisible
	*	Set the visibility of this status bar
	*
	* @param v : boolean, true for visible
	*/
	p.setVisible = function(v)
	{
		this.mFront.visible = v;
		this.mBack.visible = v;
	};
	
	return statusbar;
}();