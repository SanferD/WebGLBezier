# WebGLBezier

Load 'canvas.html' in a browser. Tested on Firefox and Chrome. Requires '--allow-file-access-from-files' flag in chrome.
On Ubuntu can do this via 'google-chrome --allow-file-access-from-files'.

To change texture put the corresponding <img> element id in the string argument for init_texture function call in line 133 of canvas.html.

In draw mode: draw the bezier curve.
In view mode: view the bezier surface. Can apply texture to it.

The stuff in the folder angel is adopted from Introduction to Computer Graphics with WebGL by Ed. Angel. 
