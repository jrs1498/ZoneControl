/**
* animator.js
*/
"use strict"

var app = app || {};

app.animator = function()
{
	/**
	* animator
	*	Associates a texture with animation data and functionality
	*
	* @param r : number of frame rows
	* @param c : number of frame columns
	* @param w : frame width
	* @param h : frame height
	* @param a : texture aspect ratio w / h
	*/
	function animator(r, c, w, h, a)
	{
		this.mFrameRows = r;
		this.mFrameCols = c;
		this.mTextureAspect = a;
		this.mAnimations = [];
	};
	
	var p = animator.prototype;
	
	/**
	* addAnimation
	*	Adds animation data to this animator with the associated texture
	*
	* @param id : integer id to referr to this animation
	* @param fs : starting frame number
	* @param fe : ending frame number
	* @param fd : frame duration in seconds
	* @param l : looping?
	*/
	p.addAnimation = function(id, fs, fe, fd, l)
	{
		var anim =
		{
			start: fs,
			end: fe,
			duration: fd,
			looping: l
		};
		this.mAnimations[id] = anim;
	};
	
	/**
	* getFrameUvs
	*	Get the four UVs associated with the frame from an animation
	*
	* @param id : id corresponding to previously created animation
	* @param t : animation time
	* @param flip : mirror UVs if true
	*
	* @returns : array of length 4, containing UV indices for the corresponding frame
	*/
	p.getFrameUvs = function(id, t, flip)
	{
		var uvs = [];
		uvs[0] = new THREE.Vector2(0.0, 0.0);
		uvs[1] = new THREE.Vector2(1.0, 0.0);
		uvs[2] = new THREE.Vector2(1.0, 1.0);
		uvs[3] = new THREE.Vector2(0.0, 1.0);
		//return uvs;
	
		// Index out of bounds check
		if(id < 0 || id >= this.mAnimations.length)
		{
			app.log("Animation ID out of bounds");
			return uvs;
		}
		
		// Valid time check
		if(t < 0.0)
		{
			app.log("Animation time invalid");
			return uvs;
		}
			
		// Get our frame number
		var anim = this.mAnimations[id];
		var frameCount = 1 + anim.end - anim.start;
		var fullAnimTime = anim.duration * frameCount;
		
		var frameNumber;
		if(!anim.looping && t >= fullAnimTime)
		{
			frameNumber = anim.end;
		}
		else
		{
			var localAnimTime = t % fullAnimTime;
			localAnimTime = localAnimTime > 0.0001 ? localAnimTime : 0.0;
			frameNumber = anim.start + Math.floor((localAnimTime / fullAnimTime) * frameCount);
		}
		
		var frameCol = frameNumber % this.mFrameCols;
		var frameRow = (frameNumber - frameCol) / this.mFrameCols;
		var left = frameCol / this.mFrameCols;
		var right = (frameCol + 1) / this.mFrameCols;
		var top = 1 - frameRow / this.mFrameRows;
		var bottom = 1 - (frameRow + 1) / this.mFrameRows;
		
		if(!flip)
		{
			uvs[0] = new THREE.Vector2(left, bottom);
			uvs[1] = new THREE.Vector2(right, bottom);
			uvs[2] = new THREE.Vector2(right, top);
			uvs[3] = new THREE.Vector2(left, top);
		}
		else
		{
			uvs[0] = new THREE.Vector2(right, bottom);
			uvs[1] = new THREE.Vector2(left, bottom);
			uvs[2] = new THREE.Vector2(left, top);
			uvs[3] = new THREE.Vector2(right, top);
		}
		
		return uvs;
	};

	return animator;
}();