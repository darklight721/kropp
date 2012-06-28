(function($){

	var Cropper = function() {
		var _crop = { x : -100, y : -100, w : 100, h : 100 };
		var _cropLimit = { w : 30, h : 30 };
		var _image = null;
		
		var _anchor = { x : 0, y : 0 };
		var _markers = [];
		var _this = this;
		
		// constant
		this.moveType = { MOUSE : 0, KEY : 1 };
		
		var setCanvasSize = function(width,height) {
			$(cnv_crop).attr({"width":width,"height":height});
			$(cnv_image).attr({"width":width,"height":height});
			
			$(cnv_crop).css({"width":width+"px","height":height+"px"});
			$(cnv_image).css({"width":width+"px","height":height+"px"});
			$(cnv_container).css({"width":width+"px","height":height+"px"});
		};
		
		this.getCrop = function() {
			return _crop;
		}
		
		this.setCrop = function(obj) {
			if (obj)
			{
				_crop.x = (isNaN(obj.x)) ? _crop.x : obj.x;
				_crop.y = (isNaN(obj.y)) ? _crop.y : obj.y;
				_crop.w = (isNaN(obj.w)) ? _crop.w : obj.w;
				_crop.h = (isNaN(obj.h)) ? _crop.h : obj.h;
			}
			
			_crop.w = Math.max(_crop.w,_cropLimit.w);
			_crop.w = Math.min(_crop.w,cnv_crop.width);
			_crop.h = Math.max(_crop.h,_cropLimit.h);
			_crop.h = Math.min(_crop.h,cnv_crop.height);
			
			if (_crop.x + _crop.w > cnv_crop.width)
				_crop.x = cnv_crop.width - _crop.w;
			if (_crop.y + _crop.h > cnv_crop.height)
				_crop.y = cnv_crop.height - _crop.h;
		};
		
		this.prepareCanvas = function(image) {
			_image = image;
			
			var newW = _image.width, newH = _image.height;
			var maxCanvasSize = { w : window.innerWidth - 100, h : window.innerHeight - 200 };
			
			if (_image.width > maxCanvasSize.w)
			{
				newW = maxCanvasSize.w;
				newH = Math.floor(newW*_image.height/_image.width);
			}
			else if (_image.height > maxCanvasSize.h)
			{
				newH = maxCanvasSize.h;
				newW = Math.floor(newH*_image.width/_image.height);
			}
			
			// resize canvas
			setCanvasSize(newW,newH);
			// draw image
			ctx_image.drawImage(_image,0,0,newW,newH);
			// position crop
			this.setCrop({ w : 100, h : 100 });
			this.setCrop({ x : (newW-_crop.w)/2, y : (newH-_crop.h)/2});
		};
		
		this.drawCrop = function(obj) {
			// clean canvas
			ctx_crop.clearRect(0,0,cnv_crop.width,cnv_crop.height);
			// draw semiblack layer
			ctx_crop.fillStyle = "rgba(0,0,0,0.5)";
			ctx_crop.fillRect(0,0,cnv_crop.width,cnv_crop.height);
			// draw crop area
			ctx_crop.clearRect(_crop.x,_crop.y,_crop.w,_crop.h);
			// draw crop markers
			this.drawCropMarkers();
		};
		
		this.emphasizeCrop = function(isEmphasize) {
			var alpha = isEmphasize ? 0.5 : 1.0;
			var interval = setInterval(function(){
				// clean canvas
				ctx_crop.clearRect(0,0,cnv_crop.width,cnv_crop.height);
				// draw semiblack layer
				ctx_crop.fillStyle = "rgba(0,0,0,"+ alpha +")";
				ctx_crop.fillRect(0,0,cnv_crop.width,cnv_crop.height);
				// draw crop area
				ctx_crop.clearRect(_crop.x,_crop.y,_crop.w,_crop.h);
				
				if (isEmphasize)
				{
					alpha += 0.1;
					if (alpha > 1.0)
						clearInterval(interval);
				}
				else
				{
					alpha -= 0.1;
					if (alpha < 0.5)
					{
						clearInterval(interval);
						_this.drawCropMarkers();
					}
				}
			}, 50);
		};
		
		this.isMouseOnCrop = function(mousePos) {
			return (mousePos.x >= _crop.x && mousePos.x < _crop.x + _crop.w &&
					mousePos.y >= _crop.y && mousePos.y < _crop.y + _crop.h);
		};
		
		this.saveAnchorForMove = function(mousePos) {
			_anchor.x = _crop.x - mousePos.x;
			_anchor.y = _crop.y - mousePos.y;
		};
		
		this.moveCrop = function(pos) {
			if (!_image) return;
		
			var newX = 0, newY = 0;
			
			if (pos.type === this.moveType.MOUSE)
			{
				newX = _anchor.x + pos.x,
				newY = _anchor.y + pos.y;
			}
			else if (pos.type === this.moveType.KEY)
			{
				newX = _crop.x + pos.x;
				newY = _crop.y + pos.y;
			}
			
			newX = Math.max(newX,0);
			newX = Math.min(newX,cnv_crop.width-_crop.w);
			
			newY = Math.max(newY,0);
			newY = Math.min(newY,cnv_crop.height-_crop.h);
			
			_crop.x = newX;
			_crop.y = newY;
			
			this.drawCrop();
		};
		
		this.drawCropMarkers = function() {
			var markerLength = 20;
			var x,y;
			
			var formLine = function(x1,y1,x2,y2) {
				ctx_crop.moveTo(x1,y1);
				ctx_crop.lineTo(x2,y2);
			};
			
			var formCornerLines = function(x1,y1,x2,y2,x3,y3) {
				formLine(x1,y1,x2,y2);
				formLine(x1,y1,x3,y3);
			};
			
			ctx_crop.strokeStyle = "white";
			ctx_crop.lineWidth = 2;
			ctx_crop.lineCap = "square";
			ctx_crop.beginPath();
			
			// draw upper left marker
			x = _crop.x - 1;
			y = _crop.y - 1;
			formCornerLines(x,y,x+markerLength/2,y,x,y+markerLength/2);
			_markers[0] = [x-5,y-5,x+markerLength/2,y+markerLength/2];
			
			// draw upper marker
			x = (_crop.w - markerLength) / 2 + _crop.x;
			//y = _crop.y - 1;
			formLine(x,y,x+markerLength,y);
			_markers[1] = [x,y-5,x+markerLength,y];
			
			// draw upper right marker
			x = _crop.x + _crop.w + 1;
			//y = _crop.y - 1;
			formCornerLines(x,y,x-markerLength/2,y,x,y+markerLength/2);
			_markers[2] = [x-markerLength/2,y-5,x+5,y+markerLength/2];
			
			// draw right marker
			//x = _crop.x + _crop.w + 1;
			y = (_crop.h - markerLength) / 2 + _crop.y;
			formLine(x,y,x,y+markerLength);
			_markers[3] = [x,y,x+5,y+markerLength];
			
			// draw lower right marker
			//x = _crop.x + _crop.w + 1;
			y = _crop.y + _crop.h + 1;
			formCornerLines(x,y,x-markerLength/2,y,x,y-markerLength/2);
			_markers[4] = [x-markerLength/2,y-markerLength/2,x+5,y+5];
			
			// draw lower marker
			x = (_crop.w - markerLength) / 2 + _crop.x;
			//y = _crop.y + _crop.h + 1;
			formLine(x,y,x+markerLength,y);
			_markers[5] = [x,y,x+markerLength,y+5];
			
			// draw lower left marker
			x = _crop.x - 1;
			//y = _crop.y + _crop.h + 1;
			formCornerLines(x,y,x+markerLength/2,y,x,y-markerLength/2);
			_markers[6] = [x-5,y-markerLength/2,x+markerLength/2,y+5];
			
			// draw left marker
			//x = _crop.x - 1;
			y = (_crop.h - markerLength) / 2 + _crop.y;
			formLine(x,y,x,y+markerLength);
			_markers[7] = [x-5,y,x,y+markerLength];
			
			ctx_crop.stroke();
		};
		
		this.getMarkerOnMouse = function(mousePos) {
			for (var i = 0; i < _markers.length; i++)
			{
				if (mousePos.x >= _markers[i][0] && mousePos.x <= _markers[i][2] &&
					mousePos.y >= _markers[i][1] && mousePos.y <= _markers[i][3])
					return i;
			}
			return -1;
		};
		
		this.saveAnchorForResize = function(mousePos,marker) {
			_anchor.x = mousePos.x;
			_anchor.y = mousePos.y;
			_anchor.marker = marker;
			_anchor.crop = $.extend({},_crop);
		};
		
		this.resizeCrop = function(mousePos) {
			var newX = _anchor.crop.x, newY = _anchor.crop.y,
				newW = _anchor.crop.w, newH = _anchor.crop.h;
				
			switch (_anchor.marker) 
			{
				case 0: newX += mousePos.x - _anchor.x;
						newW += _anchor.x - newX;
						newY += mousePos.y - _anchor.y;
						newH += _anchor.y - newY;
						break;
				case 1: newY += mousePos.y - _anchor.y;
						newH += _anchor.y - newY;
						break;
				case 2: newW += mousePos.x - _anchor.x;
						newY += mousePos.y - _anchor.y;
						newH += _anchor.y - newY;
						break;
				case 3: newW += mousePos.x - _anchor.x;
						break;
				case 4: newW += mousePos.x - _anchor.x;
						newH += mousePos.y - _anchor.y;
						break;
				case 5:	newH += mousePos.y - _anchor.y;
						break;
				case 6: newX += mousePos.x - _anchor.x;
						newW += _anchor.x - newX;
						newH += mousePos.y - _anchor.y;
						break;
				case 7: newX += mousePos.x - _anchor.x;
						newW += _anchor.x - newX;
						break;
			}
			
			newW = Math.max(newW,_cropLimit.w);
			newH = Math.max(newH,_cropLimit.h);
			
			_crop.x = newX;
			_crop.y = newY;
			_crop.w = newW;
			_crop.h = newH;
			
			this.drawCrop();
			
			// update crop size fields
			$(crop_width).val(_crop.w);
			$(crop_height).val(_crop.h);
		};
		
		this.scaleImage = function(isScaleUp) {
			if (_image)
			{
				var newW, newH;
				
				newW = isScaleUp ? cnv_image.width + 10 : cnv_image.width - 10;
				newW = Math.max(newW,_crop.w);
				newW = Math.min(newW,_image.width);
				newH = Math.floor(newW*_image.height/_image.width);
				
				if (_crop.w > _crop.h)
				{
					newW = isScaleUp ? cnv_image.width + 10 : cnv_image.width - 10;
					newW = Math.max(newW,_crop.w);
					newW = Math.min(newW,_image.width);
					newH = Math.floor(newW*_image.height/_image.width);

					if (newH < _crop.h)
					{
						newH = _crop.h;
						newW = Math.floor(newH*_image.width/_image.height);
					}
				}
				else
				{
					newH = isScaleUp ? cnv_image.height + 10 : cnv_image.height - 10;
					newH = Math.max(newH,_crop.h);
					newH = Math.min(newH,_image.height);
					newW = Math.floor(newH*_image.width/_image.height);

					if (newW < _crop.w)
					{
						newW = _crop.w;
						newH = Math.floor(newW*_image.height/_image.width);
					}
				}
				
				// resize canvas
				setCanvasSize(newW,newH);
				// draw image
				ctx_image.drawImage(_image,0,0,newW,newH);
				// position crop
				if (_crop.x + _crop.w > cnv_crop.width)
					_crop.x = cnv_crop.width - _crop.w;
				if (_crop.y + _crop.h > cnv_crop.height)
					_crop.y = cnv_crop.height - _crop.h;
				// draw crop
				_this.drawCrop();
			}
		};
		
		this.crop = function() {
			var croppedData = ctx_image.getImageData(_crop.x,_crop.y,_crop.w,_crop.h);
			
			cnv_output.width = _crop.w;
			cnv_output.height = _crop.h;
			ctx_output.putImageData(croppedData,0,0);
		};
	};

	function readFile(file) {
		// Only process image files
		var imageType = /image.*/;
		if (!file.type.match(imageType))
			return;

		var reader = new FileReader();

		reader.onerror = function(e) {
			alert("Error code: " + e.target.error.code);
		};

		reader.onload = function(e) {
			var img = new Image();
			img.onload = function() {
				cropper.prepareCanvas(img);
				cropper.drawCrop();
				
				var crop = cropper.getCrop();
				
				$(crop_width).val(crop.w);
				$(crop_height).val(crop.h);
				// show controls
				$("#controls").show();
			};
			img.src = e.target.result;
		};

		reader.readAsDataURL(file);
	}
	
	function getMousePos(evt) {
		return {
			x : evt.pageX - cnv_container.offsetLeft,
			y : evt.pageY - cnv_container.offsetTop
		};
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}

	function handleDragLeave(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}

	function handleDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		readFile(evt.dataTransfer.files[0]);
	}
	
	function handleMouseDown(evt) {
		evt.preventDefault();
		var mousePos = getMousePos(evt);
		if (cropper.isMouseOnCrop(mousePos))
		{
			isMoveCrop = true;
			cropper.saveAnchorForMove(mousePos);
		}
		else
		{
			var marker = cropper.getMarkerOnMouse(mousePos);
			if (marker != -1)
			{
				isResizeCrop = true;
				cropper.saveAnchorForResize(mousePos,marker);
			}
		}
	}
	
	function handleMouseMove(evt) {
		evt.preventDefault();
		var mousePos = getMousePos(evt);
		if (isMoveCrop)
		{
			mousePos.type = cropper.moveType.MOUSE;
			cropper.moveCrop(mousePos);
		}
		else
		{
			if (isResizeCrop)
			{
				cropper.resizeCrop(mousePos);
			}
			else
			{
				if (cropper.isMouseOnCrop(mousePos))
				{
					$(cnv_crop).css("cursor","move");
				}
				else
				{
					var marker = cropper.getMarkerOnMouse(mousePos);
					if (marker != -1)
					{
						switch(marker)
						{
							case 0:
							case 4: $(cnv_crop).css("cursor","nw-resize");
									break;
							case 1:
							case 5: $(cnv_crop).css("cursor","n-resize");
									break;
							case 2: 
							case 6: $(cnv_crop).css("cursor","ne-resize");
									break;
							case 3: 
							case 7: $(cnv_crop).css("cursor","e-resize");
									break;
						}
					}
					else
					{
						$(cnv_crop).css("cursor","default");
					}
				}
			}
		}
	}
	
	function handleMouseOut(evt) {
		isMoveCrop = false;
		isResizeCrop = false;
		$(cnv_crop).css("cursor","default");
	}
	
	function handleMouseUp(evt) {
		isMoveCrop = false;
		isResizeCrop = false;
		$(cnv_crop).css("cursor","default");
	}
	
	function handleMouseWheel(evt) {
		evt.preventDefault();
		
		var isScaleUp = false;
		
		if (evt.wheelDelta)
			isScaleUp = evt.wheelDelta < 0;
		else if (evt.detail)
			isScaleUp = evt.detail > 0;
			
		cropper.scaleImage(isScaleUp);
	}
	
	function handleKeyUp(evt) {
		var pos = { x : 0, y : 0, type : cropper.moveType.KEY };
		switch(evt.keyCode)
		{
			case 37: pos.x = -5;
					 break;
			case 38: pos.y = -5;
					 break;
			case 39: pos.x = 5;
					 break;
			case 40: pos.y = 5;
					 break;
		}
		cropper.moveCrop(pos);
	}
	
	var isMoveCrop = false;
	var isResizeCrop = false;
	
	var cropper = new Cropper();
	
	var cnv_container = $("#cnv_container")[0];
	
	// setup canvas
	var cnv_image  = $("#cnv_image")[0];
	var ctx_image = cnv_image.getContext("2d");
	
	var cnv_crop = $("#cnv_crop")[0];
	var ctx_crop = cnv_crop.getContext("2d");
	
	var cnv_output = $("#cnv_output")[0];
	var ctx_output = cnv_output.getContext("2d");

	// add drag and drop to canvas
	$(cnv_crop).bind('dragover',handleDragOver);
	$(cnv_crop).bind('dragleave',handleDragLeave);
	$(cnv_crop).bind('drop',handleDrop);
	// add mouseevents
	$(cnv_crop).bind('mousedown',handleMouseDown);
	$(cnv_crop).bind('mousemove',handleMouseMove);
	$(cnv_crop).bind('mouseout',handleMouseOut);
	$(cnv_crop).bind('mouseup',handleMouseUp);
	$(cnv_crop).bind('mousewheel DOMMouseScroll',handleMouseWheel);
	// add keyevents
	$("body").bind('keyup',handleKeyUp);
	
	// control elements
	var crop_width = $("#crop_width")[0];
	var crop_height = $("#crop_height")[0];
	var crop_it = $("#crop_it")[0];
	
	// add event listeners
	$(crop_width).bind('change',function(){
		var width = parseInt(this.value,10);
		cropper.setCrop({ w : width });
		cropper.drawCrop();
		
		var newW = cropper.getCrop().w; 
		if (width !== newW)
			$(this).val(newW);
	});
	$(crop_height).bind('change',function(){
		var height = parseInt(this.value,10);
		cropper.setCrop({ h : height });
		cropper.drawCrop();
		
		var newH = cropper.getCrop().h; 
		if (height !== newH)
			$(this).val(newH);
	});
	$(crop_it).bind('click',function(){
		cropper.crop();
		this.href = cnv_output.toDataURL();
	});
	$(crop_it).bind('mouseover',function(){
		cropper.emphasizeCrop(true);
	});
	$(crop_it).bind('mouseout',function(){
		cropper.emphasizeCrop(false);
	});
	
})(jQuery);
jQuery.event.props.push("dataTransfer");
jQuery.event.props.push("wheelDelta");
jQuery.event.props.push("detail");