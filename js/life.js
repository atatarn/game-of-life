var gridDimension = 30,
	gridSize = 450,
	cellSize = gridSize / gridDimension,
	entityDim = cellSize/1.5,
	genCount = 0,
	ctx = init(),
	field = new Field(ctx),
	timer = null,
	interval = 300;

$("#start").click(function() {
	if (timer !== null) return;
	timer = setInterval(function () {
		tick(field);
	}, interval);
});

$("#stop").click(function() {
	clearInterval(timer);
	timer = null
});

$('#mainC').on('mousemove', function(e){
	if (e.buttons === 1)
		field.vitalize(
			Math.floor((e.pageX-$('#mainC').offset().left) / cellSize),
			Math.floor((e.pageY-$('#mainC').offset().top) / cellSize),
			true
		);
});
$('#mainC').on('touchmove', function(e){
	e.preventDefault();
	var touch = e.originalEvent.touches[0];
	field.vitalize(
			Math.floor((touch.pageX-$('#mainC').offset().left) / cellSize),
			Math.floor((touch.pageY-$('#mainC').offset().top) / cellSize),
			true
		);
});


function tick(field) {
	genCount++;
	var popCount = 0,
		newBorns = new Array();
	field.loopCells(function(cell){
		var aliveNeighbors = field.aliveNeighbors(cell.iX, cell.iY);
		// живое: выживет при 2 или 3 соседях
		// мертвое: оживет при 3 соседях
		if (aliveNeighbors === 3 || (aliveNeighbors === 2 && cell.alive)) {
			newBorns.push(cell);
			popCount++;
		}
	});
	field.clear();
	field.newMap();
	newBorns.forEach(function(cell){
		field.vitalize(cell.iX, cell.iY);
	});
	field.draw();
	$('#genLabel').text(genCount);
	$('#popLabel').text(popCount);
}
function Field(ctx) {
	this.ctx = ctx;
	this.history = new Array();
	this.newMap = function(){
		var Map = new Array(gridDimension);
		for (var x = 0; x < gridDimension; x++) {
			Map[x] = new Array(gridDimension);
			for (var y = 0; y < gridDimension; y++) {
				Map[x][y] = {
					cX: cellSize/2 + cellSize*x - entityDim/2,
					cY: cellSize/2 + cellSize*y - entityDim/2,
					iX: x,
					iY: y,
					alive: false
				};
			}
		}
		this.history.push(Map);
	};
	this.currentMap = function(){return this.history[this.history.length-1];};
	this.vitalize = function(x,y,draw) {
		this.currentMap()[x][y].alive = true;
		if (draw)
			drawCell(
				this.currentMap()[x][y].cX,
				this.currentMap()[x][y].cY,
				this.ctx
			);
	};
	this.loopCells = function(callback) {
		this.currentMap().map(function(col){
			col.map(function(cell){
				callback(cell);
			});
		});
	};
	function drawCell(cX, cY, ctx) {
		ctx.beginPath();
		ctx.rect(cX, cY, entityDim, entityDim);
		ctx.fill();
		ctx.closePath();
	}
	this.draw = function(){
		this.loopCells(function(cell){
			if (cell.alive) {
				drawCell(cell.cX, cell.cY, this.ctx)
			}
		});
	};
	this.clear = function(){
		this.loopCells(function(cell){
			if (cell.alive)
				this.ctx.clearRect(
					cell.iX*cellSize+2,
					cell.iY*cellSize+2,
					cellSize-2,
					cellSize-2
				);
		});
	};
	this.neighbors = function(x,y){
		var dirty = [
			{iX: x-1, iY: y},
			{iX: x-1, iY: y-1},
			{iX: x, iY: y-1},
			{iX: x+1, iY: y-1},
			{iX: x+1, iY: y},
			{iX: x+1, iY: y+1},
			{iX: x, iY: y+1},
			{iX: x-1, iY: y+1},
		];
		return dirty.map(function(cell){
			return {
				iX: cell.iX === gridDimension ? 0 : cell.iX === -1 ? gridDimension-1 : cell.iX,
				iY: cell.iY === gridDimension ? 0 : cell.iY === -1 ? gridDimension-1 : cell.iY
			};
		});
	};
	this.aliveNeighbors = function(x,y) {
		var count = 0;
		this.neighbors(x,y).forEach(function(cell){
			if (this.currentMap()[cell.iX][cell.iY].alive)
				count++;
		}, this);
		return count;
	};
	this.newMap();
}

function init() {
	var bgcanvas = $('<canvas/>').attr({width: gridSize, height: gridSize}),
		bgctx = bgcanvas.get(0).getContext('2d'),
		x = 0, y = 0;
	while (x <= gridSize) {
		bgctx.beginPath();
		bgctx.moveTo(x, 0);
		bgctx.lineTo(x, gridSize);
		bgctx.stroke();
		x+=cellSize;
	}
	while (y <= gridSize) {
		bgctx.beginPath();
		bgctx.moveTo(0, y);
		bgctx.lineTo(gridSize, y);
		bgctx.stroke();
		y+=cellSize;
	}

	var canvas = $('<canvas/>').attr({
		id: "mainC",
		width: gridSize,
		height: gridSize
	}).css(
		{'background-image':"url(" + bgcanvas.get(0).toDataURL("image/png")+ ")"}
	).appendTo('#gol');
	return canvas.get(0).getContext('2d');
}