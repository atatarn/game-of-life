"use strict";

// settings
var gridDimension = 56, // (cells)
		cellSize = 8, // (px)
    interval = 75; // (ms)

// engines
var cvs = new Canvas(gridDimension, cellSize);
var field = new Field(cvs, gridDimension, cellSize);
var evo = new Evolution(cvs, field, interval);
var preset = new Preset(evo);

// http://codepen.io/pen/?editors=011
// http://appsynergy.net/gameoflife

// presets controls
$('.preset').click(function(){
	preset[$(this).attr('id')]();
});

// base controls
$('.evoCtrl').click(function(){
	evo[$(this).attr('id')]();
});

$('#cvs').on('mousemove', function(e){
	if (e.buttons === 1)
		field.vitalize(
			Math.floor((e.pageX-$('#cvs').offset().left) / cellSize),
			Math.floor((e.pageY-$('#cvs').offset().top) / cellSize),
			true
		);
});
$('#cvs').on('click', function(e){
	field.vitalize(
		Math.floor((e.pageX-$('#cvs').offset().left) / cellSize),
		Math.floor((e.pageY-$('#cvs').offset().top) / cellSize),
		true
	);
});
$('#cvs').on('touchmove', function(e){
	e.preventDefault();
	var touch = e.originalEvent.touches[0];
	field.vitalize(
			Math.floor((touch.pageX-$('#cvs').offset().left) / cellSize),
			Math.floor((touch.pageY-$('#cvs').offset().top) / cellSize),
			true
		);
});

function Preset(evolution){
	var p = this;
  p.e = evolution;
	p.GGG = function(){
  	p.go([[2,26],[2,27],[3,26],[3,27],[12,26],[12,27],[12,28],[13,25],[13,29],[14,24],[14,30],[15,24],[15,30],[16,27],[17,25],[17,29],[18,26],[18,27],[18,28],[19,27],[22,24],[22,25],[22,26],[23,24],[23,25],[23,26],[24,23],[24,27],[26,22],[26,23],[26,27],[26,28],[36,24],[36,25],[37,24],[37,25]]);
  };
  p.go = function(t) {
  	p.e.reset();
    t.map(function(c){p.e.field.vitalize(c[0], c[1], true);});
  };
}

// Evolution engine
function Evolution(canvas, field, interval){
	var e = this;
  e.canvas = canvas;
  e.field = field;
  e.interval = interval;
  e.timer = null;
  e.genCount = 0;
  e.start = function(){
  	if (e.timer) return;
    e.timer = setInterval(function(){ e.tick(); }, e.interval);
  };
  e.stop = function(){
  	clearInterval(e.timer);
    e.timer = null;
  };
  e.tick = function(){
  	var popCount = 0;
    var newBorns = new Array();
    e.genCount++;
    e.field.loopCells(function(cell){
    	var aliveNeighbors = e.field.aliveNeighbors(cell.iX, cell.iY);
      // живое: выживет при 2 или 3 живых соседях
      // мертвое: оживет при 3 живых соседях
      if (aliveNeighbors === 3 || (aliveNeighbors === 2 && cell.alive)) {
      	newBorns.push(cell);
        popCount++;
      }
    });
    e.canvas.clear();
    e.field.newMap();
    newBorns.forEach(function(cell){
    	e.field.vitalize(cell.iX, cell.iY)
    });
    e.field.generate();
    $('#genLabel').text(e.genCount);
		$('#popLabel').text(popCount);
  };
  e.reset = function(){
  	e.stop();
    e.genCount = 0;
    e.canvas.clear();
    e.field.history = new Array();
    e.field.newMap();
    e.field.generate();
    $('#genLabel').text(e.genCount);
		$('#popLabel').text('0');
  };
  e.origin = function(){
  	var o  = '';
    e.field.history[0].map(function(col){
    	col.map(function(cell){
      	//if (cell.alive) console.log(cell.cX + ', ' + cell.cY);
        if (cell.alive) o += '[' + cell.iX + ', ' + cell.iY + ']';
      });
    });
    console.log('['+o+']');
  };
}

// Field engine
function Field(canvas, gridDimension, cellSize) {
	var f = this;
  f.canvas = canvas;
  f.gridDimension = gridDimension;
  f.cellSize = cellSize;
  f.history = new Array();
  f.newMap = function(){
  	var Map = new Array(gridDimension);
    for (var x = 0; x < gridDimension; x++) {
    	Map[x] = new Array(gridDimension);
      for (var y = 0; y < gridDimension; y++) {
      	Map[x][y] = {
        	cX: f.cellSize*x,
          cY: f.cellSize*y,
          iX: x,
          iY: y,
          alive: false
        };
      }
    }
    f.history.push(Map);
  };
  f.currentMap = function(){return f.history[f.history.length-1];};
  f.vitalize = function(x, y, draw) {
  	f.currentMap()[x][y].alive = true;
    if (draw) f.canvas.drawCell(f.currentMap()[x][y].cX, f.currentMap()[x][y].cY, true);
  }
  f.loopCells = function(cb){
  	f.currentMap().map(function(col){
    	col.map(function(cell){
      	cb(cell);
      });
    });
  };
  f.generate = function(){
  	f.loopCells(function(cell){
    	f.canvas.drawCell(cell.cX, cell.cY, cell.alive);
    });
  };
	f.neighbors = function(x,y){
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
				iX: cell.iX === f.gridDimension ? 0 : cell.iX === -1 ? f.gridDimension-1 : cell.iX,
				iY: cell.iY === f.gridDimension ? 0 : cell.iY === -1 ? f.gridDimension-1 : cell.iY
			};
		});
	};
	f.aliveNeighbors = function(x,y) {
		var count = 0;
		f.neighbors(x,y).forEach(function(cell){
			if (f.currentMap()[cell.iX][cell.iY].alive)
			count++;
		}, this);
		return count;
	};
  f.newMap();
  f.generate();
}

// Canvas engine
function Canvas(gridDimension, cellSize) {
	var c = this;
  c.cellSize = cellSize;
  c.gridDimension = gridDimension;
  var canvas = $('<canvas/>').attr({id: "cvs", width: c.gridDimension*c.cellSize, height: c.gridDimension*c.cellSize }).appendTo('#gol');
  c.ctx = canvas.get(0).getContext('2d');
  c.ctx.strokeStyle = '#e1e1e1';
  c.ctx.fillStyle = 'cadetblue';
  c.drawCell = function(cX, cY, alive) {
  	c.ctx.beginPath();
    c.ctx.rect(cX, cY, c.cellSize, c.cellSize);
    alive ? c.ctx.fill() : c.ctx.stroke();
    c.ctx.closePath();
  };
  c.clear = function(){
  	c.ctx.clearRect(0, 0, c.gridDimension*c.cellSize, c.gridDimension*c.cellSize);
  };
}