// Sanfer D'souza

'use strict'

/**
 * Loads the buffer to be used by the shader
 * @param  {WebGLBuffer} 	buffer   	the buffer to load
 * @param  {number} 			attribute	the index of the attribute corresponding to the loaded buffer
 * @param  {number} 			size      (default: 4) the number of components of the data object
 * @param  {number} 			type     	(default: gl.FLOAT) the number representing the type of the data 
 */
function load_buffer(buffer, attribute, size, type) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(attribute);
	gl.vertexAttribPointer(attribute, size || 4, type || gl.FLOAT, false, 0, 0);
}

/**
 * Sets the flag uniform variable to the input value
 * @param {number} value 		the value to set the flag
 */
function set_flag(value) {
	gl.uniform1f(program.uFlag, value);
}

/**
 * Disable all attributes.
 */
function disconnect() {
	for (var name=ids[0], i=0; i!=ids.length; name=ids[++i])
		if (name[0] == 'a') {
			gl.disableVertexAttribArray(program[ids[i]]);
		}
}

/**
 * Calculate the norm between two points. Assumes points using same
 * scale.
 * @param  {number} x1 the x1 coordinate
 * @param  {number} y1 the y1 coordinate
 * @param  {number} x2 the x2 coordinate
 * @param  {number} y2 the y2 coordinate
 * @return {number} the euclidean distance
 */
function norm(x1, y1, x2, y2) {
	var first = Math.pow(x1-x2, 2), second = Math.pow(y1-y2, 2);
	return Math.sqrt(first + second);
}

/**
 * Converts from screen coordinate to gl coordinate x values.
 * @param  {number} x the x screen coordinate
 * @return {number}   the x gl coordinate
 */
function gl_x(x) {
	return 2*x/canvas.width-1
}

/**
 * Converts from screen coordinate to gl coordinate x values.
 * @param  {number} y the y screen coordinate
 * @return {number}   the y gl coordinate
 */
function gl_y(y) {
	return 1-2*y/canvas.height;
}

/* returns the sign of the input float */
function sign(x) { return x<0? -1: 1 }


/**
 * Transpose the matrix M
 * @param  {Matrix<number>} M   The matrix
 * @param  {number} rows 				The number of rows 
 * @param  {number} cols 				The number of columns
 * @return {Matrix<number>}     The tranpose of the matrix M
 */
function mytranspose(M, rows, cols) {
	var ret = [];
	for (var i=0; i!=rows; i++) {
		ret.push([]);
		for (var j=0; j!=cols; j++)
			ret[i][j] = M[j][i];
	}
	return ret;
}


/**
 * Multiplies two square matrices
 * @param  {Matrix<number>} A The square matrix
 * @param  {Matrix<number>} B The square matrix
 * @param  {number} 				d The number of rows/cols
 * @return {Matrix<number>}   The product of the two square matrices
 */
function mat_mat_multiply(A, B, d) {
	var ret = [];
	for (var i=0; i!=d; i++) {
		ret.push([]);
		for (var j=0; j!=d; j++) {
			ret[i][j] = 0;
			for (var k=0; k!=d; k++)
				ret[i][j] += A[i][k]*B[k][j];
		}
	}
	return ret;
}

/**
 * Multiplies a square matrix with a vector of the same dims
 * @param  {Array<Array<number>>} A 		Matrix of numbers
 * @param  {Array<number>} 				v 		Vector of numbers
 * @param  {number} 							d 		The number of rows/cols
 * @return {Array<number>}   			The resulting product vector
 */
function mat_vec_multiply(A, v, d) {
	var ret = [];
	for (var i=0; i!=d; i++) {
		ret[i] = 0;
		for (var j=0; j!=d; j++)
			ret[i] += A[i][j]*v[j];
	}
	return ret;
}

function get_rot_mat(angle) {
	return 	[ [Math.cos(angle), 0, Math.sin(angle), 0],
						[0, 1, 0, 0],
						[-Math.sin(angle), 0, Math.cos(angle), 0],
						[0, 0, 0, 1] ];
}
