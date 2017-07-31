// Sanfer D'souza

'use strict'

/*********************************************************/
/**********INITIALIZE THE OPENGL VARIABLE 'gl'************/
/*********************************************************/


/**
 * Initialize opengl given the id of the canvas
 * Sets the global variable 'gl' to the WebGLUtils instance
 * @param  {string} id the id of the canvas
 */
function init_gl() {
	gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

	if (!gl) {
		alert("Could not load webgl");
		return;
	}

	gl.enable(gl.DEPTH_TEST);
}

/*********************************************************/
/*********INITIALIZE THE PROGRAM VARIABLE*'program'*******/
/*********************************************************/


/**
 * Initialize the shaders.
 * Sets the global variable program with the compiled and linked shader program.
 * The program has local variables that correspond to the attribute locations in the program.
 */
function init_shaders() {
	// get the vertex and fragment shaders (compiled)
	var fShader = get_shader('fragment-shader'), 
			vShader = get_shader('vertex-shader');

	// initialize the program
	program = gl.createProgram();

	// attach shaders to the program
	gl.attachShader(program, fShader);
	gl.attachShader(program, vShader);

	// link the program and check for errors
	gl.linkProgram(program);
	var error = gl.getProgramInfoLog(program);
	if (error > 0) {
		alert(error);
		return;
	}

	// use the linked program
	gl.useProgram(program);

	// add attrib_loc as members to program object
	set_attrib_loc(program);

	// disable all the attributes
	disconnect();
}

/**
 * Gets the shader corresponding to the script id 'id' and compiles it
 * @param  {string} id the id of the script tag holding the shader
 * @return {shader} the compiled shader
 */
function get_shader(id) {
	// read the code
	var code = document.getElementById(id).innerHTML;

	// initialize the shader
	var shader;
	switch(id) {
		case "vertex-shader":
			shader = gl.createShader(gl.VERTEX_SHADER);
			break;
		case "fragment-shader":
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		default:
			alert("get_shader: inavalid id '" + id + "'");
			return;
	}

	// initalize and compile the shader
	gl.shaderSource(shader, code);
	gl.compileShader(shader);

	// display compilation errors, if any
	var error = gl.getShaderInfoLog(shader);
	if (error.length > 0) {
		alert(error);
		return;
	} 

	return shader;
}

/**
 * Appends the location of all the local variables found in names to the program object
 * @param {WebGLProgram} program the compiled and linked program object
 */
function set_attrib_loc(program) {
	for (var name=ids[0], i=0; i!=ids.length; name=ids[++i]) {
		if (name[0] == 'a')
			program[ids[i]] = gl.getAttribLocation(program, ids[i]);
		else if (name[0] == 'u')
			program[ids[i]] = gl.getUniformLocation(program, ids[i]);
	}
}


/*********************************************************/
/******INITIALIZE THE BUFFERS: v_buf, c_buf, and t_buf****/
/*********************************************************/

/**
 * Initialize all buffers. Buffers which do not change values
 * are filled their values here. Buffers which do change values
 * during run-time are filled with their values at their 
 * corresponding draw functions.
 */
function init_buffers() {
	/* Initialize the buffer for drawing the center line */
	v_buf.center = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, v_buf.center);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices.center), gl.STATIC_DRAW);

	c_buf.center = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, c_buf.center);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors.center), gl.STATIC_DRAW);

	/* Initialize the buffer for drawing the control points. */
	v_buf.control = gl.createBuffer();
	c_buf.control = gl.createBuffer();

	/* Initialize the buffer for drawing the control polygon */
	v_buf.poly = gl.createBuffer();
	c_buf.poly = gl.createBuffer();

	/* Initialize the buffer for the time sequence */
	t_buf.t = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.t);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.t), gl.STATIC_DRAW);

	t_buf.c = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, t_buf.c);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(t_seq.c), gl.STATIC_DRAW);

	/* Initialize the buffer for the bezier surface */
	bz_buf.p = gl.createBuffer();
	bz_buf.n = gl.createBuffer();
	bz_buf.t = gl.createBuffer();
}

/**
 * Initialize the texture image and buffer.
 * @param {string} id 	the id of <img> tag which holds the input image
 */
function init_texture(id) {
	load_texture = false;
	texture = gl.createTexture();
	texture.img = document.getElementById(id);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0.0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.img);
  // gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.bindTexture(gl.TEXTURE_2D, null);
}