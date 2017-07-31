// Sanfer D'souza

'use strict'

/**
 * Draws everything !
 */
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	if (view_mode) {
		draw_bezier_surface();
	} else {
		draw_center_lines();
		draw_control_points();
		draw_control_polygon();
		draw_bezier_curve();
	}
}

/**
 * Draws the center line as a sequence of dashed lines based on 
 * what's in vertices.center and colors.center.
 */
function draw_center_lines() {
	disconnect();

	load_buffer(v_buf.center, program.aPosition, 4, gl.FLOAT);
	load_buffer(c_buf.center, program.aColor, 4, gl.FLOAT);
	set_flag(0.0);
	gl.flush();

	gl.drawArrays(gl.LINES, 0, vertices.center.length);
}

/**
 * Draws the control points as colors disks. 
 * The selected control point has a different color and is slightly bigger than the rest.
 * Each disk is drawn as a triangle fan
 */
function draw_control_points() {
	disconnect();

	/* gets the points of the triangles which span the disk with x, y center and r radius */
	function get_fan(x, y, r) {
		var num_fans=100, d_theta = (2*Math.PI) / num_fans, z=0, w=1;
		var array = [vec4(x, y, z, w)];
		for (var angle=d_theta, i=0; i<=num_fans; i++, angle=d_theta*(i+1))
			array.push(vec4(x+r*Math.cos(angle), y+r*Math.sin(angle), z, w));
		return array;
	}

	var r = 0.013671875, pts = vertices.control;
	set_flag(0.0);
	for (var i=0; i!=pts.length; i++) {
		var fan_pts = get_fan(pts[i][0], pts[i][1], (1+.4*(i==highlight))*r), clr = vec4(1.0, 0, i==highlight, 1.0);
		var fan_clr = fan_pts.map(function() { return clr; });

		gl.bindBuffer(gl.ARRAY_BUFFER, v_buf.control);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(fan_pts), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, c_buf.control);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(fan_clr), gl.STATIC_DRAW);

		load_buffer(v_buf.control, program.aPosition);
		load_buffer(c_buf.control, program.aColor);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, fan_pts.length);
	}
}

/**
 * Draws the control polygon by connecting the control points
 */
function draw_control_polygon() {
	disconnect();

	var pts = vertices.control, clr = vec4(1.0, 1.0, 1.0, 1.0);
	for (var i=0; i!=pts.length-1; i++) {
		var poly_pts = get_control_polygon_pts(pts[i], pts[i+1]);
		var poly_clr = poly_pts.map(function() { return clr; });
		if (poly_pts.length == 0)
			continue;

		gl.bindBuffer(gl.ARRAY_BUFFER, v_buf.poly);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(poly_pts), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, c_buf.poly);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(poly_clr), gl.STATIC_DRAW);

		load_buffer(v_buf.poly, program.aPosition);
		load_buffer(c_buf.poly, program.aColor);

		gl.drawArrays(gl.POINTS, 0, poly_pts.length);
	}
}

/**
 * Generates the points for the control polygon to be connected
 * using gl.LINES. Points are filled into points.controlPolygon
 * @param  {vec4} a        		the center of a control point
 * @param  {vec4} b        		the center of the consecutive control point
 * @return {Array[number]} 		the array of points which make up the control polygon
 */
function get_control_polygon_pts(a, b) {
	var sl = .05/1.15, eps = 0.005; // gen points only a and b are atleast eps apart

	// the strategy is to use the slope to get the next points
	var slope = [b[0]-a[0], b[1]-a[1]], length = Math.sqrt( slope[0]*slope[0] + slope[1]*slope[1] );

	// validate
	if (length < eps)
		return [];

	// scale the slope so that the distance between points is sl
	slope = [ sl * (slope[0]/length), sl * (slope[1]/length) ];
	
	// change in x and y
	var dx = slope[0], dy = slope[1];

	// the array to hold the generated points
	var points = [];

	// initial point = a
	var x = a[0], y = a[1], z = a[2], w = a[3];
	var point = vec4(x, y, z, w);
	
	/* get the initial sign of x and y relative to point b */
	var sx = sign(b[0]-x), sy = sign(b[1]-y);

	/* keep on generating points until the sign of either x or y changes */
	function validate(b, p) { return sx==sign(b[0]-p[0]) && sy==sign(b[1]-p[1]) }
	while ( validate(b, point) ) {
		points.push(point);
		
		x += dx; y += dy;
		point = vec4(x, y, z, w);
	}

	return points;
}


/**
 * Draws the bezier curve using the time steps and control points.
 */
function draw_bezier_curve() {
	disconnect();

	var P1 = flatten(vertices.control.slice(0, 4));
	var P2 = flatten(vertices.control.slice(3, 7));
	var P = [P1, P2];

	set_flag(1.0);
	for (var i=0; i!=2; i++) {
		gl.uniform4fv(program.uP, P[i]);
		load_buffer(t_buf.t, program.aTime, 1, gl.FLOAT);
		load_buffer(t_buf.c, program.aColor, 4, gl.FLOAT);
		
		gl.flush();
		gl.drawArrays(gl.LINE_STRIP, 0, t_seq.t.length);
	}

}


/**
 * Initialize the bezier surface
 */
function initialize_bezier_surface() {
	var surface = [[]];

	var P = [	mytranspose(vertices.control.slice(0, 4), 4, 4) , 
						mytranspose(vertices.control.slice(3, 7), 4, 4)	];
	var index = 0;

	/* Create the bezier curve */
	for (var j=0; j!=P.length; j++)
		for (var t=t_seq.t[0], i=0; i!=t_seq.t.length; t=t_seq.t[++i])
			var M = surface[0][index++] = mat_vec_multiply( P[j], mat_vec_multiply(G, [Math.pow(t, 3), Math.pow(t, 2), t, 1], 4 ), 4);

	/* Create the surface of revolution */
	for (var j=1; j!=angles.length; j++) {
		surface.push([]);
		var rot_mat = get_rot_mat(angles[j]);
		for (var i=0; i<index; i++)		
			surface[j][i] = mat_vec_multiply(rot_mat, surface[0][i], 4);
	}

	/* Get the vertices of the triangles which make up the bezier surface
	 * I should use gl.drawElements, but I'm lazy.
	 */
	bz_surf.p = [], bz_surf.n = [], bz_surf.t = [];
	var color = vec4(0.6, 0.8, 0.6, 1.0);
	for (var col=0; col!=index-1; col++)
		for (var row=0; row!=angles.length-1; row++) {
			var a = surface[row][col];
			var b = surface[row+1][col+1];
			var c = surface[row+1][col];
			var d = surface[row][col+1];

			bz_surf.p.push(a, b, c, a, b, d);

			/* the normals for each vertex */
			var n1 = cross( subtract(b,c), subtract(a,c) );
			var n2 = cross( subtract(a,d), subtract(b,d) );
		
			bz_surf.n.push(n1, n1, n1, n2, n2, n2);

			/* the texture coordinates for each vertex */
			var get_uv = function(r, c) { var p = vec2( c/(index-1), r/(angles.length-1) ); return p; };
			bz_surf.t.push(get_uv(row, col), get_uv(row+1, col+1), get_uv(row+1, col));
			bz_surf.t.push(get_uv(row, col), get_uv(row+1, col+1), get_uv(row, col+1));
		}

	/* Load the the bezier surface to the buffer */
	gl.bindBuffer(gl.ARRAY_BUFFER, bz_buf.p);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(bz_surf.p), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, bz_buf.n);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(bz_surf.n), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, bz_buf.t);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(bz_surf.t), gl.STATIC_DRAW);

	setup_phong();
}

/* Get the ambient, diffuse, and specular products */
function setup_phong() {
	phong.ambient = vec4(ka*Oa[0], ka*Oa[1], ka*Oa[2], ka*Oa[3]);
	phong.diffuse = vec4(kd*Od[0], kd*Od[1], kd*Od[2], kd*Od[3]);
	phong.specular = vec4(ks*Os[0], ks*Os[1], ks*Os[2], ks*Os[3]);
}


/**
 * Draws the bezier surface using the provided model and view matrix
 */
function draw_bezier_surface() {
	disconnect();

  gl.uniformMatrix4fv(program.uModelViewMatrix, false, flatten(modelViewMatrix) );
  gl.uniformMatrix4fv(program.uProjectionMatrix, false, flatten(projectionMatrix) );

	if (load_texture) {
		set_flag(3.0);

		load_buffer(bz_buf.t, program.aTexCoord, 2, gl.FLOAT);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(program.uTexMap, 0);
	}
	else {
		set_flag(2.0);

	  gl.uniform4fv(program.uAmbient, phong.ambient);
	  gl.uniform4fv(program.uDiffuse, phong.diffuse);
	  gl.uniform4fv(program.uSpecular, phong.specular);
	  gl.uniform4fv(program.uLight, phong.light);
	  gl.uniform1f(program.uShininess, phong.shininess);

		load_buffer(bz_buf.n, program.aNormal, 3, gl.FLOAT);
	}
	load_buffer(bz_buf.p, program.aPosition, 4, gl.FLOAT);

	gl.drawArrays(gl.TRIANGLES, 0, bz_surf.p.length);
}