// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var WebcamDraw = function() {

	this.canvas = document.getElementById("hidden-canvas");
	this.ctx = this.canvas.getContext("2d");

	this.shownCanvas = document.getElementById("shown-canvas");
	this.shownCtx = this.shownCanvas.getContext("2d")
	this.video = document.getElementById("video");

	this.contrastIncrease = 150;
	this.topLimit = 100,
	this.bottomLimit = 50;

	this.drawing = true;

	this.clearCanvas = true;

	this.options = 'removeClear';

	this.id = this.shownCtx.createImageData(1,1); // only do this once per page
	this.d  = this.id.data;                        // only do this once per page

	var mouseDown = false;

	this.init = function() {
		var self = this;
		this.initWebcam();

		(function animloop(){
            requestAnimFrame(animloop);
            self.tick();
        })();

        document.onmousedown = function() {
        	mouseDown = true;
        }

        document.onmouseup = function() {
        	mouseDown = false;
        }
	}

	this.initWebcam = function() {
		if(navigator.webkitGetUserMedia!=null) {
			var options = {
				video:true,
				audio:true
			};

			//request webcam access
			navigator.webkitGetUserMedia(options,
				function(stream) {
					//get the video tag
					var video = self.video;
					//turn the stream into a magic URL
					video.src = window.webkitURL.createObjectURL(stream);
				},
				function(e) {
					console.log("error happened");
				}
			);
		}
	}

	this.tick = function() {
		//console.log('tik')
		this.renderToCanvas();
		if(this.drawing) {
			this.findDot();
		};
		
	}

	this.renderToCanvas = function() {
		if(this.video.paused || this.video.ended) return false;
		var ctx = this.ctx;
		ctx.drawImage(this.video,0 , 0, 640, 480);
		ctx.fillStyle = 'red';
		ctx.fillRect(0,0,100,100)

	}

	this.findDot = function() {
		var ctx = this.ctx;
		var origPixels = ctx.getImageData(0,0,640,480).data;
		var allPixels = this.contrastImage(origPixels, this.contrastIncrease);
		if( this.clearCanvas ) {
			this.shownCtx.clearRect(0,0,640,480); //CLEAR THE GODDAMN CANVAS
		}
		

		for ( var i = 0, l = allPixels.length ; i < l ; i += 4) {
			var red = allPixels[ i ];
			var green = allPixels[ i + 1 ];
			var blue = allPixels [ i + 2]

			if(this.options == 'spotRed') {
				if( red > this.topLimit && green < this.bottomLimit && blue < this.bottomLimit ) {
					this.renderToDrawing( red, green, blue, i );
				}
			} else if (this.options == 'removeClear') {
				if( red < this.topLimit && green < this.bottomLimit && blue < this.bottomLimit ) {
					this.renderToDrawing( red, green, blue, i );
				}
			}
		}
	}

	this.contrastImage = function(imageData, contrast) {
		var data = imageData;
	    var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

	    for(var i=0 ; i<data.length ; i+=4)
	    {
	        data[i] = (factor * ((data[i] - 128) + 128));
	        data[i+1] = (factor * ((data[i+1] - 128) + 128));
	        data[i+2] = (factor * ((data[i+2] - 128) + 128));
	    }
	    return imageData;
	}

	this.renderToDrawing = function( red, green, blue, v ) {

		var ctx = this.shownCtx;
		var id = this.id;
		ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + ", 1)";
		//ctx.fillStyle = "red";

		var x = Math.floor( v / 4 % 640 );
		var y = Math.floor( (v  / 4 / 640) % 480 );
		
		
		ctx.fillRect(x, y , 1, 1)
	}

	this.init()
}




window.onload = function() {
	var webcamDraw = new WebcamDraw();
	var gui = new dat.GUI();
	gui.add(webcamDraw, 'contrastIncrease', 0, 255);
    gui.add(webcamDraw, 'topLimit', 50, 255);
    gui.add(webcamDraw, 'bottomLimit', 0, 255);
    gui.add(webcamDraw, 'drawing');
    gui.add(webcamDraw, 'clearCanvas');
    gui.add(webcamDraw, 'options', [ 'removeClear', 'spotRed' ] );
}