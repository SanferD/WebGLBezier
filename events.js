// Sanfer D'souza

'use strict'


/************************************************/
/*************MOUSE/KEYBOARD EVENTS**************/
/************************************************/

var mouse_down = false, shift_down = false;
var startX, startY, newRotationMatrix;
var rotationMatrix = mat4(1);
var orgMVMat = modelViewMatrix, orgLight = phong.light;

// check if any control points have been clicked and if so, highlight it
canvas.onmousedown = function(e) {
	mouse_down = true;

	if (view_mode) {
		startX = e.clientX;
		startY = e.clientY;
	}
	else {
		var dist = vertices.control.map(function(pt) { return norm(pt[0], pt[1], gl_x(e.clientX), gl_y(e.clientY)); });
		var sorted = dist.slice().sort();
		var minim = sorted[0];

		if (minim > threshold) {
			highlight = -1;
			return;
		}

		highlight = dist.findIndex(function(el) { return el==minim; });
	}
}

// move the highlighted control point, if any
canvas.onmousemove = function(e) {
	if (!mouse_down)
		return;

	if (view_mode) {
		var axis = vec3(e.clientY - startY, e.clientX - startX, 0.0);
	
		if (shift_down) {
			var angle = length(axis) * .05;
			if (angle > 0.0) {
				var x = orgLight[0]*Math.cos(angle) - orgLight[1]*Math.sin(angle);
				var y = orgLight[0]*Math.sin(angle) + orgLight[1]*Math.cos(angle);
				phong.light[0] = x;
				phong.light[1] = y;
				console.log(phong.light);
			}
		}
		else {
			var angle = length(axis) * sensitivity;
			if (angle > 0.0) {
				newRotationMatrix = mult(rotate(angle, axis), rotationMatrix);
				modelViewMatrix = mult(orgMVMat, newRotationMatrix);
			}
		}
	}
	else {
		if (highlight == -1)
			return;
		var old = vertices.control[highlight];
		vertices.control[highlight] = vec4(gl_x(e.clientX), gl_y(e.clientY), old[2], old[3]);
	}
}

// unhighlight  
canvas.onmouseup = function(e) {
	mouse_down = false;
	if (view_mode) {
		if (newRotationMatrix) {
			rotationMatrix = newRotationMatrix;
		}
		newRotationMatrix = null;
	}
	else {
		highlight = -1;
	}
}

document.onkeypress = function(e) {
	if (!view_mode)
		return;

	e = e || window.event;
	var code = e.keyCode || e.which;
	var key = String.fromCharCode(code); 
	// console.log(code, key);
	switch(key) {
		case '>':
			modelViewMatrix = mult(translate(0,0,speed), modelViewMatrix);
			break;
		case '<':
			modelViewMatrix = mult(translate(0,0,-speed), modelViewMatrix);
			break;
		default:
			return;
	}
	orgMVMat[0][3] = modelViewMatrix[0][3];
	orgMVMat[1][3] = modelViewMatrix[1][3];
	orgMVMat[2][3] = modelViewMatrix[2][3];
}


document.onkeydown = function(e) {
	if (!view_mode)
		return;

	e = e || window.event;
	var code = e.keyCode || e.which;
	if (code == 16)
		shift_down = true;
}

document.onkeyup = function(e) {
	if (!view_mode)
		return;

	e = e || window.event;
	var code = e.keyCode || e.which;
	if (code == 16)
		shift_down = false;
}

/************************************/
/*************INTERFACE**************/
/************************************/


/**
 * Sets up view mode interface
 */
function setup_view_mode() {
	/* Initialize */
	view_mode = true;
	mouse_down = false;
	
	var code = [ 	"<button type='button' id='DRAW' onclick='setup_draw_mode()'>Draw</button>",
								"<br>",
								"ANGLES: <input type='text' id='ANGLES' value='16'>",
								"<br>",
								"STEPS: <input type='text' id='STEPS' value='16'> Must be multiple of 8.",
								"<br>",
								"<button type='button' id='YELLOW_PLASTIC' onclick='yellow_plastic()'>YELLOW PLASTIC</button>",
								"<br>",
								"<button type='button' id='BRASS_METAL' onclick='brass_metal()'>BRASS METAL</button>",
								"<br>",
								"<button type='button' id='TEXTURE_MAP' onclick='render_texture()'>TEXTURE MAP</button>"
							];
	document.getElementById('interface').innerHTML = code.join('\n');

	restore_defaults();
	setup_time_buf();
	initialize_bezier_surface();

	/* Inputs */
	var angles_tb = document.getElementById('ANGLES');
	var steps_tb = document.getElementById('STEPS');
	
	angles_tb.onkeyup = function() { 
		var v = Number(angles_tb.value);
		if (Number.isInteger(v) && v>0 && v!=num_angles) {
			num_angles = v;
			
			get_angle_seq();
			initialize_bezier_surface();
		}
	}
	
	steps_tb.onkeyup = function() { 
		var v = Number(steps_tb.value);
		if (Number.isInteger(v) && v>0 && v%8===0 && v!=num_steps) {
			num_steps = v;
			setup_time_buf();
			initialize_bezier_surface();
		}
	}

}

/**
 * Sets up drawing mode interface
 */
function setup_draw_mode() {
	view_mode = false;
	var code = ["<button type='button' id='VIEW' onclick='setup_view_mode()'>View</button>"];
	document.getElementById('interface').innerHTML = code.join('\n');

	/* Undo the time sequence of the view mode */
	restore_defaults();
	setup_time_buf();

	/* Initialize the buffer for the time sequence */
	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.t);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.t), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.c);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.c), gl.STATIC_DRAW);
}

/**
 * setup the time buffer used to create the bezier curve from the bezier control points
 */
function setup_time_buf() {
	get_time_seq();

	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.t);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.t), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.c);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.c), gl.STATIC_DRAW);
}

/**
 * used to restore the default number of steps and number of angles
 */
function restore_defaults() {
	num_steps = 16; num_angles = 16;	
}

/**
 * used to create the yellow plastic color
 */
function yellow_plastic() {
	load_texture = false;
	
	ka = .6;
	kd = .33;
	ks = .6;
	Oa = vec4(1.0, 1.0, 0.0, 1.0);
	Od  = vec4(1.0, 1.0, 0.0, 1.0);
	Os = Od;
	n = 45;

	setup_phong();
	render();
}

/**
 * used to create the brass metal color
 */
function brass_metal() {
	load_texture = false;


	ka = .06;
	kd = .2;
	ks = .75;
	Oa = vec4(0.545, 0.271, 0.075, 1.0);
	Od = vec4(167/255, 135/255, 20/255, 1.0);
	Os = light_color;
	n = 45;


	setup_phong();
	render();
}

/**
 * used to paint the surface with the initialized texture
 */
function render_texture() {
	load_texture = true;

	initialize_bezier_surface();
	render();
}