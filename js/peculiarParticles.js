/***** TITLE *****/
// Bingus Bounce
/*****************/

/***** AUTHOR *****/
// Bryce Paubel
/******************/

/***** DESCRIPTION *****/
// Bingus bounces - not much else to say
/***********************/

/***** COPYRIGHT *****/
// Copyright 2022 Bryce Paubel
/*********************/

/***** LICENSING *****/
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
/*********************/

// Vertex shader
const V_SHADER_SOURCE = `#version 300 es
	in vec4 a_p;		// Position
	in float a_p_s;		// Point size
	in vec2 a_t_coord;

	out vec2 v_t_coord;

	uniform mat4 u_m_mat;
	
	void main() {
		gl_PointSize = a_p_s;
		gl_Position = u_m_mat * a_p;

		v_t_coord = a_t_coord;
	}
`

// Fragment shader
const F_SHADER_SOURCE = `#version 300 es
	precision highp float;
	out vec4 out_c; // Output color

	in vec2 v_t_coord;

	uniform sampler2D u_img;
	
	void main() {
		out_c = texture(u_img, v_t_coord);
	}
`

// Configuration object
let config = {
	MOUSE: null,
	MOUSE_MOVEMENT: [],
	SELECTION: 0,
	PARTICLES: 50,
	COLOR: 180,
	CIRCLE: false,
}

// Main program
function main() {
	// Animation ID
	let animID = 1;

	// Particle array
	let particles = [];
	
	// Initialize canvas
	let canvas = document.getElementById("canvas");
	canvas.margin = 0;
	canvas.width = 1.0 * window.innerWidth;
	canvas.height = 1.01 * window.innerHeight;
	
	// Get rendering context and initialize shaders
	let webGL = canvas.getContext("webgl2");
	initShaders(webGL, V_SHADER_SOURCE, F_SHADER_SOURCE);

	// Resize the canvas if the window changes
	window.onresize = function() {
		canvas.width = 1.0 * window.innerWidth;
		canvas.height = 1.01 * window.innerHeight;
		webGL.viewport(0, 0, canvas.width, canvas.height);
	}
	
	// Get radio buttons
	let radioButtons = document.getElementsByName("selection");
	
	// Get sliders
	let particleSlider = document.getElementById("particleNum");
	let colorSlider = document.getElementById("color");
	
	// Get the particle number display prompt
	let particleDisplayPrompt = document.getElementById("particleNumDisplay");

	// Set events
	setCanvasEvents(canvas);
	setRadioButtonEvents(radioButtons);
	setSliderEvents(particleSlider, particles, canvas);

	// Generate initial particles
	for (let i = 0; i < config.PARTICLES; i++) {
		// Seed the size, position, velocity, color, and scale
		// Scale is used to determine the scaling factors of velocity, color, etc. in some functions
		particles.push(new Particle(
			Math.log(i + 100000),
			[0.0, 0.0], 
			[0.0, 0.0], 
			[0.0, 1.0, 1.0, 1.0], 
			(i + 1) / (3 * config.PARTICLES)));
	}

	setupImage(webGL);
	setupBuffers(webGL);
	
	// Set up the special blending for the black background
	webGL.enable(webGL.DEPTH_TEST);
	webGL.depthMask(false);
	webGL.clearColor(0, 0, 0, 1);
	webGL.enable(webGL.BLEND);
	webGL.blendEquation(webGL.FUNC_ADD);
	webGL.blendFunc(webGL.SRC_ALPHA, webGL.ONE_MINUS_SRC_ALPHA);

	// Update function for animation frames
	let update = function() {
		// Cancel previous frame
		cancelAnimationFrame(animID);
		if (webGL.texturesReady) {

			// Clear the canvas
			webGL.clearColor(0.0, 0.0, 0.0, 1.0);
			webGL.clear(webGL.COLOR_BUFFER_BIT);

			// Draw the particles
			drawParticles(canvas, webGL, particles);

			// Update the number of particles
			particleDisplayPrompt.innerHTML = "Number of Particles: " + config.PARTICLES;
		}
		
		// Request a new frame
		animID = requestAnimationFrame(update);
	}
	
	// Call the update function to start animating
	update();
}

// Draw a particle array
function drawParticles(canvas, webGL, particleArray) {
	for (let i = 0; i < particleArray.length; i++) {
		updateParticle(canvas, config.SELECTION, particleArray[i]);
		drawParticle(webGL, particleArray[i], canvas);
	}
}

// Update a particle
function updateParticle(canvas, selection, particle) {
	switch (selection) {
		case 0: 
			followCursor(canvas, particle);
			break;
		case 1:
			followCursorCircle(canvas, particle);
			break;
		case 2:
			followCursorSloppyOrbit(canvas, particle);
			break;
		case 3:
			followCursorSharpOrbit(canvas, particle);
			break;
		case 4:
			followCursorGalaxy(canvas, particle);
			break;
		case 5:
			followCursorSpray(canvas, particle);
			break;
		case 6:
			followCursorFire(canvas, particle);
			break;
		case 7:
			followCursorBounce(canvas, particle);
			break;
	}
}

// Set the canvas events to update the mouse position
function setCanvasEvents(canvas) {
	window.onmousemove = function(e) {
		config.MOUSE = [e.clientX, e.clientY];
		config.MOUSE_MOVEMENT = [e.movementX, e.movementY];
	}
	
	canvas.onmouseout = function() {
		config.MOUSE = null;
	}
}

// Set the radio button events
function setRadioButtonEvents(radioButtons) {
	for (let i = 0; i < radioButtons.length; i++) {
		if (radioButtons[i].checked) {
			config.SELECTION = parseInt(radioButtons[i].value);
		}
		radioButtons[i].onclick = function() {
			config.SELECTION = parseInt(radioButtons[i].value);
		}
	}
}

// Set the slider events
function setSliderEvents(numSlider, particleArray, canvas) {
	numSlider.oninput = function() {
		config.PARTICLES = Math.ceil(numSlider.value);
		particleArray.length = 0;
		for (let i = 0; i < numSlider.value; i++) {
			particleArray.push(new Particle(
				Math.log(i + 100000),
				[(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1],
				[0.0, 0.0], 
				[(i + 1) / (config.PARTICLES + 1) * 0.8 + 0.2, 0.0, 0.0, 1.0], 
				(i + 1) / (3 * config.PARTICLES)));
		}

		let color = hsvToRgb(config.COLOR / 360, 1.0, 1.0);
		
		for (let i = 0; i < config.PARTICLES; i++) {
			particleArray[i].color = [
				1 / particleArray[i].scale * color[0], 
				1 / particleArray[i].scale * color[1],
				1 / particleArray[i].scale * color[2],
				1.0
			];
		}
			
		colorSlider.style.backgroundColor = "rgb("
											+ (particleArray[particleArray.length - 1].color[0] * 255.0) + ","
											+ (particleArray[particleArray.length - 1].color[1] * 255.0) + ","
											+ (particleArray[particleArray.length - 1].color[2] * 255.0) + ")";
	}
}

// Set up the image
function setupImage(gl) {
	gl.texturesReady = false;
	texture = gl.createTexture();
	img = new Image();
	img.crossOrigin = "";
	img.src = "img/particle.png";
	img.onload = function () {
		gl.activeTexture(gl.TEXTURE0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.texturesReady = true;
	}
}

function setupBuffers(gl) {
	let a_t_coord = gl.getAttribLocation(gl.program, "a_t_coord");
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_t_coord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_t_coord);

	// Vertex shader pointers
	let a_p = gl.getAttribLocation(gl.program, "a_p");

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 
		0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(a_p, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_p);

}

let m_mat = new Matrix4();
// Draw a singular particle
function drawParticle(gl, particle, canvas) {

	let ar = canvas.width / canvas.height;

	m_mat.setIdentity();
	m_mat.setTranslate(particle.position[0], particle.position[1], 0);
	m_mat.scale((1 / ar)* particle.scale, particle.scale, (1 / ar) * particle.scale);

	let u_m_mat = gl.getUniformLocation(gl.program, "u_m_mat");
	gl.uniformMatrix4fv(u_m_mat, false, m_mat.elements);

	let u_img = gl.getUniformLocation(gl.program, "u_img");
	gl.uniform1i(u_img, 0);

	// Vertex shader pointers
	let a_p = gl.getAttribLocation(gl.program, "a_p");
	let a_p_s = gl.getAttribLocation(gl.program, "a_p_s");

	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Update particle to follow the cursor
function followCursor(canvas, particle) {
	if (config.MOUSE) {
		// The particle's velocity is set to always point towards the cursor
		// which is then scaled by the particle scaling factor
		particle.velocity = [(2 * config.MOUSE[0] / canvas.width) - 1 - particle.position[0], (2 * config.MOUSE[1] / (-canvas.height)) + 1 - particle.position[1]];
		particle.velocity = [particle.velocity[0] * particle.scale, particle.velocity[1] * particle.scale];

		// Add the velocity to the position
		particle.position = [particle.position[0] + particle.velocity[0], particle.position[1] + particle.velocity[1]];
	}
}

// Update particle to follow the cursor in a circular fashion
function followCursorCircle(canvas, particle) {
	if (config.MOUSE) {

		// Get the velo towards the center (the cursor) and the velo perpendicular to that
		let centerVelo = [(2 * config.MOUSE[0] / canvas.width) - 1 - particle.position[0], (2 * config.MOUSE[1] / (-canvas.height)) + 1 - particle.position[1]];
		let perpendicularVelo = [-centerVelo[1], centerVelo[0]];

		// Make the velocity point towards both the cursor while also
		// going perpendicular to its current position - this causes the
		// particles to move towards the cursor in circular/spiral fashion
		particle.velocity = [
			centerVelo[0] * particle.scale + perpendicularVelo[0] * particle.scale,
			centerVelo[1] * particle.scale + perpendicularVelo[1] * particle.scale
		];

		// Update the position
		particle.position = [
			particle.position[0] + particle.velocity[0], 
			particle.position[1] + particle.velocity[1]
		];
	}
}

// Update particle to orbit
function followCursorSloppyOrbit(canvas, particle) {
	if (config.MOUSE) {
		// Get mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];

		// Find center and perpendicular velocity (center is cursor)
		let centerVelo = [glMouseCoords[0] - particle.position[0], glMouseCoords[1] - particle.position[1]];
		let perpendicularVelo = [-centerVelo[1], centerVelo[0]];

		// Find the magnitude towards the center
		let centerMag = Math.sqrt(centerVelo[0] ** 2 + centerVelo[1] ** 2);

		// If this magnitude is small, stop going towards the center
		if (centerMag < 0.2) {
			centerVelo = [0.0, 0.0];
		}

		// MOUSE_MOVEMENT is added so that the particle will follow the mouse deltas
		// instead of directly just the cursor position. That way some shape is retained when the cursor moves
		particle.velocity = [
			config.MOUSE_MOVEMENT[0] / 1000 + perpendicularVelo[0] * particle.scale * 0.2 + centerVelo[0] * 0.02,
			-config.MOUSE_MOVEMENT[1] / 1000 + perpendicularVelo[1] * particle.scale * 0.2 + centerVelo[1] * 0.02
		];

		// Add velocity to position
		particle.position = [
			particle.position[0] + particle.velocity[0], 
			particle.position[1] + particle.velocity[1]
		];
	}
}

// Update particle to orbit sharply
function followCursorSharpOrbit(canvas, particle) {
	if (config.MOUSE) {
		// Get mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];	
			
		// Get center velo and the velo perpendicular to that (center is cursor)
		let centerVelo = [glMouseCoords[0] - particle.position[0], glMouseCoords[1] - particle.position[1]];
		let perpendicularVelo = [-centerVelo[1], centerVelo[0]];

		// Find the magnitude of the center velo
		let centerMag = Math.sqrt(centerVelo[0] ** 2 + centerVelo[1] ** 2);	

		// If the particle enters this range, do not move towards the center
		if (centerMag < 0.2 && centerMag > 0.15) {
			centerVelo = [0.0, 0.0];
		// If the particle is too close, move outwards
		} else if (centerMag <= 0.15) {
			centerVelo = [-0.5 * centerVelo[0], -0.5 * centerVelo[1]];
		// If the particle is nearing the center, slow down	
		} else if (centerMag > 0.2 && centerMag < 0.25) {
			centerVelo = [0.1 * centerVelo[0], 0.1 * centerVelo[1]];
		// If the particle is very far away, move towards the center quickly	
		} else {
			centerVelo = [centerVelo[0] * 1.5, centerVelo[1] * 1.5];
		}

		// MOUSE_MOVEMENT is added so that the particle will follow the mouse deltas
		// instead of directly just the cursor position. That way some shape is retained when the cursor moves
		particle.velocity = [
			config.MOUSE_MOVEMENT[0] / 1000 + perpendicularVelo[0] * (particle.scale + 0.1) * 0.2 + centerVelo[0] * 0.02,
			-config.MOUSE_MOVEMENT[1] / 1000 + perpendicularVelo[1] * (particle.scale + 0.1) * 0.2 + centerVelo[1] * 0.02
		];
		
		// Add velocity to the position
		particle.position = [
			particle.position[0] + particle.velocity[0], 
			particle.position[1] + particle.velocity[1]
		];
	}
}

// Update particle to circle around the center like a galaxy
function followCursorGalaxy(canvas, particle) {
	if (config.MOUSE) {
		// Get the mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];	
			
		// Get center velo and the velo perpendicular to that (center is cursor)
		let centerVelo = [glMouseCoords[0] - particle.position[0], glMouseCoords[1] - particle.position[1]];
		let perpendicularVelo = [-centerVelo[1], centerVelo[0]];

		// Find the magnitude of the center velocity
		let centerMag = Math.sqrt(centerVelo[0] ** 2 + centerVelo[1] ** 2);

		// If the center magnitude is zero, make it 0.001 so we don't divide by zero later
		if (centerMag === 0) {
			centerMag = 0.001;
		}
	
		// Make the perpendicular velo inversely proportional to the distance from the center
		perpendicularVelo = [(1 / centerMag) * perpendicularVelo[0], (1 / centerMag) * perpendicularVelo[1]];
		
		// MOUSE_MOVEMENT is added so that the particle will follow the mouse deltas
		// instead of directly just the cursor position. That way some shape is retained when the cursor moves
		particle.velocity = [
			config.MOUSE_MOVEMENT[0] / 1000 + perpendicularVelo[0] * particle.scale * 0.1 + centerVelo[0] / particle.scale * 0.001,
			-config.MOUSE_MOVEMENT[1] / 1000 + perpendicularVelo[1] * particle.scale * 0.1 + centerVelo[1] / particle.scale * 0.001
		];
		
		// Add the velocity to the position
		particle.position = [
			particle.position[0] + particle.velocity[0], 
			particle.position[1] + particle.velocity[1]
		];
	}
}

// Let the particles spray
function followCursorSpray(canvas, particle) {
	if (config.MOUSE) {
		// Get the mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];

		// If the particle moves offscreen, go back to the mouse
		if (distance(0, 0, particle.position[0], particle.position[1]) >  Math.sqrt(2)) {
			particle.position[0] = glMouseCoords[0];
			particle.position[1] = glMouseCoords[1];
		}

		// If the particle is close to the mouse (i.e., it has been initialized or sent back to the mouse position)
		// Then seed it with a new initial velocity that will send it up and outwards
		if (0.01 > distance(glMouseCoords[0], glMouseCoords[1], particle.position[0], particle.position[1])) {
			// Seed the initial velocity to go in any upward direction
			particle.velocity[0] = 0.001 * (Math.random() * 2 - 1); // [-0.001, 0.001)
			particle.velocity[1] = 0.01 * Math.random();			// [0, 0.1)

			// Add the velocity to the position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];

		// Otherwise, go downwards
		} else {
			// Add a negative value, i.e., gravity, to the velocity
			particle.velocity[1] += -0.0002;
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];
		}

	}
}

// Follow cursor with a fire-like sharp spray
function followCursorFire(canvas, particle) {
	if (config.MOUSE) {
		// Get the mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];

		// If the particle is nearing the peak of its parabola trajectory, send it back to the mouse
		if (particle.velocity[1] < 0.001) {
			particle.position[0] = glMouseCoords[0];
			particle.position[1] = glMouseCoords[1];
		}

		// If the particle is near the mouse, i.e. it has been initialized or sent back to the mouse, then
		// seed it with a new initial upward velocity
		if (0.01 > distance(glMouseCoords[0], glMouseCoords[1], particle.position[0], particle.position[1])) {
			// New random upward velocity
			particle.velocity[0] = 0.001 * (Math.random() * 2 - 1); // [-0.001, 0.001)
			particle.velocity[1] = 0.01 * Math.random();			// [-0.01, 0.01)

			// Add velocity to the position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];

		// Otherwise, go downwards	
		} else {
			// Add a negative value, i.e., gravity, to the velocity
			particle.velocity[1] += -0.0002;

			// Add velocity to position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];
		}

	}
}

// Let the particles spray and bounce
function followCursorBounce(canvas, particle) {
	if (config.MOUSE) {
		// Get the mouse position in GL coordinates
		let glMouseCoords = [(2 * config.MOUSE[0] / canvas.width) - 1, (2 * config.MOUSE[1] / (-canvas.height)) + 1];

		// If the particle is on the floor and it has a low velocity, meaning it isn't bouncing much,
		// send it back to the mouse and re-seed it with a velocity
		if (particle.position[1] <= -0.85 && Math.abs(particle.velocity[1]) < 0.01) {
			particle.position[0] = glMouseCoords[0];
			particle.position[1] = glMouseCoords[1];
		}
		
		// If the particle is near the mouse, i.e. it has been initialized or sent back to the mouse, then
		// seed it with a new initial upward velocity 
		if (0.01 > distance(glMouseCoords[0], glMouseCoords[1], particle.position[0], particle.position[1])) {
			// New random upward velocity
			particle.velocity[0] = 0.001 * (Math.random() * 2 - 1); // [-0.001, 0.001)
			particle.velocity[1] = 0.01 * Math.random();			// [-0.01, 0.01)

			// Add velocity to position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];
		
		// If the particle is on the floor, make it bounce	
		}  else if (particle.position[1] <= -0.85) {
			// Negate the y-component of velocity and scale it down relative to the particle
			// This makes sure that the particle always has a bounce smaller than its previous bounce
			particle.velocity[1] = -(particle.scale + 0.5) * particle.velocity[1];

			// Add velocity to position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];

		// Otherwise, go downwards	
		} else {
			// Add a negative value, i.e., gravity, to the velocity
			particle.velocity[1] += -0.001;

			// Add velocity to position
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];
		}

		// Clamp the y-value so that a particle's position doesn't 'go through the floor'
		particle.position[1] = clamp(particle.position[1], -0.85, 2);
	}
}

// Particle constructor
function Particle(size, position, velocity, color, scale) {
	this.size = size;
	this.position = position;
	this.velocity = velocity;
	this.color = color;
	this.scale = scale;
}

// Quick distance check
function distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2  + (y1 - y2) ** 2);
}

// Clamp function, same as GLSL
function clamp(value, min, max) {
	if (value <= min) {
		return min;
	} else if (value >= max) {
		return max;
	} else {
		return value;
	}
}


// HSV to RGB color conversion
// Based off of this code: https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 1].
 */
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r, g, b];
}
