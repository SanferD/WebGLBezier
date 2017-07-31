// Sanfer D'souza

'use strict'

var gl;	// the opengl object
var canvas = document.getElementById('gl-canvas');	// the canvas document element
var program;	// the program object
var view_mode = false; // flag to toggle between curve drawing mode and view mode
var ids = ['aNormal', 'aTexCoord', 'uTexMap', 'uShininess', 'uLight','uAmbient', 'uDiffuse', 'uSpecular','aPosition', 'aColor', 'aTime', 'uFlag', 'uP', 'uModelViewMatrix', 'uProjectionMatrix']; // all the shader variables set by the application

/* DRAW PARAMS */

var vertices = {};	// the object to hold all the vertices
var colors = {};	// the object to hold all the colors

var v_buf = {};	// the buffer object for vertices
var c_buf = {};	// the buffer object for colors

var t_seq = {};	// the object corresponding to the sequence of time steps
var t_buf = {};	// the buffer which holds t_seq

var angles = []; // the array of angles to generate the bezier surface

var threshold = 0.065; // used to determine if a control point is selected
var highlight = -1;	// index of the control point in vertices.control to highlight

/* VIEW PARAMS */

const G = [[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 3, 0, 0], [1, 0, 0, 0]]; 
var R = function(theta) { return [ [Math.cos(theta), 0, Math.sin(theta), 0], [0, 1, 0, 0], [Math.cos(theta), 0, -Math.sin(theta), 0], [0, 0, 0, 1] ]; };

var bz_surf = {};	// the triangle points that make up the bezier surface
var bz_buf = {}; // the buffer which holds the triangle points of the bezier surface

var mouse_down = false;
var num_steps = 16;
var num_angles = 16;

var sensitivity = 1; // affects how much the camera moves when the mouse is dragged
var speed = .1 // affects how fast the camera zooms in

var fov = 45;
var modelViewMatrix = lookAt(vec3(0,0,5), vec3(0,0,0), vec3(0,1,0));
var projectionMatrix = perspective(fov, 1, 0.01, 100);

/**
 * Globals for program_3
 */

var light_sensitivity = .03;

var ka = .1;
var kd = .5;
var ks = .85;
var n = 30;

var light_loc = vec4(0.1, 0.1, 0.1, 1.0);

const light_color = vec4(1, 1, 1, 1.0);

var Oa = vec4(.8, .2, .7, 0.0);
var Od = vec4(.7, .5, .5, 0.0);
var Os = light_color;

var phong = {	ambient: undefined, 
							diffuse: undefined, 
							specular: undefined,
							shininess: n,
							light: light_loc
						};

var texture;
var load_texture;

 /**
 * Generate the center points and their corresponding color.
 * Used for drawing the center dividing line.
 * Creates arrays in vertices.center and colors.center.
 */
(function gen_center_points() {
	vertices.center = []; colors.center = [];
	
	var num_lines = 8, color = vec4(1.0, 1.0, 1.0, 1.0);
	var x = 0.0, y = -1.0, z = 0.0, w = 1.0, dy = 1/num_lines;

	for (var i=0; i!=num_lines; i++, y+=2*dy) {
		vertices.center.push(vec4(x, y, z, w), vec4(x, y+dy, z, w));
		colors.center.push(color, color);
	}
})();


/**
 * Generate the 7 control points.
 * Creates arrays in vertices.control and colors.control.
 */
(function get_control_points() {
	vertices.control = [], colors.control = [];
	var num_of_points = 7, color = vec4(1.0, 0.0, 1.0, 1.0);

	var x = -1 + (.75*2), y = -.6, z = 0.0, d = 1.0;
	var dy = .2;
	for (var i=0; i!=num_of_points; i++, y+=dy) {
		vertices.control.push(vec4(x, y, z, d));
		colors.control.push(color);
	}
})();


/**
 * Generate the time sequence used in constructing the bezier curve.
 * Create the array t_seq with is a sequence of time values in [0, 1]
 * with step size specified in the function.
 */
function get_time_seq() {
	t_seq.t = [], t_seq.c = [];

	var start = 0, end = 1, step = view_mode? (end-start)/num_steps: .002, color = vec4(0.0, 1.0, 0.0, 1.0);
	for (var t=start; t<end; t+=step) {
		t_seq.t.push(t);
		t_seq.c.push(color);
	}

	t_seq.t.push(1.0);
	t_seq.c.push(color);
};
get_time_seq();



function get_angle_seq() {
	var start = 0, end = 2*Math.PI, step = (end-start)/num_angles;
	angles = [];
	for (var theta=start; theta<end; theta+=step)
		angles.push(theta);
	angles.push(end);
	return angles;
};
get_angle_seq();

