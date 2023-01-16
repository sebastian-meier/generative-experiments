/*
 * TODO
 * - ...
 */

const sketchWidth = 600;
const sketchHeight = 600;
const iWidth = sketchWidth/2;
const iHeight = sketchHeight/2;

const gridSize = 40;
let grid = [];
let gridMap = {};
let connections = [];
let blocks = [];
let lx = 0;
let ly = 0;
let prog = 1;
let g;
let btnStart;
let btnSave;
let ckAuto;
let ckFill;
let ckCenter;
let ckGap;
let sldOverlap;
let sldFill;
let sctShape;
let startOver = false;
let timeout;
const showGrid = false;


function setup() {
  createCanvas(sketchWidth, sketchHeight);
  g = createGraphics(iWidth, iHeight);

  btnStart = createButton('restart');
  btnStart.position(10, sketchHeight + 20);
  btnStart.mousePressed(resetDraw);

  btnSave = createButton('save');
  btnSave.position(80, sketchHeight + 20);
  btnSave.mousePressed(() => { save(); });

  ckAuto = createCheckbox('Autoplay', true);
  ckAuto.position(10, sketchHeight + 50 + 1);

  ckFill = createCheckbox('Fill out', true);
  ckFill.position(10, sketchHeight + 50 + 1 + 25);

  ckCenter = createCheckbox('Cross', false);
  ckCenter.position(10, sketchHeight + 50 + 1 + 50);

  ckGap = createCheckbox('Gap', false);
  ckGap.position(10, sketchHeight + 50 + 1 + 75);

  sldOverlap = createSlider(0,1,0.7, 0.01);
  sldOverlap.position(110, sketchHeight + 50);
  sldOverlap.input(resetDraw);

  sldFill = createSlider(0,1,1, 0.01);
  sldFill.position(110, sketchHeight + 75);

  createDiv('Higher value less overlaps')
    .position(285, sketchHeight + 50 + 4);
  
  createDiv('Percentage of space to be filled')
    .position(285, sketchHeight + 75 + 4);

  sctShape = createSelect();
  sctShape.position(135, sketchHeight + 20);
  sctShape.option('rect');
  sctShape.option('circle');
  sctShape.option('small-circle');
  sctShape.option('hexagon');
  sctShape.option('star');
  sctShape.value('small-circle');

  resetDraw();
}

function resetDraw() {
  if (timeout) {
    clearTimeout(timeout);
  }

  g.background(0);
  g.fill(255);
  g.noStroke();
  switch (sctShape.value()) {
    case 'rect':
      g.rect(0, 0, iWidth, iHeight);
      break;
    case 'circle':
      g.circle(0, 0, iWidth * 2, iHeight * 2);
      break;
    case 'small-circle':
      g.circle(0, 0, iWidth * 1.5, iHeight * 1.5);
      break;
    case 'hexagon':
      g.beginShape();
      g.vertex(0,0);
      g.vertex(0, iHeight);
      g.vertex(iWidth*0.5, iHeight);
      g.vertex(iWidth, iHeight*0.5);
      g.vertex(iWidth, 0);
      g.endShape(CLOSE);
      break;
    case 'star':
      g.beginShape();
      g.vertex(0,0);
      g.vertex(0, iHeight*0.5);
      g.vertex(iWidth, iHeight);
      g.vertex(iWidth*0.5, 0);
      g.endShape(CLOSE);
      break;
  }
  g.loadPixels();

  gridMap = {};
  grid = [];
  for (let x = gridSize; x < iWidth; x += gridSize) {
    const col = [];
    for (let y = gridSize; y < iHeight; y += gridSize) {
      const rX = grid.length;
      const rY = col.length;

      if (g.pixels[((y-gridSize*0.5) * iWidth + (x-gridSize*0.5))*4] > 200) {
        col.push(false);
        gridMap[`${rX}_${rY}`] = [rX,rY];
      } else {
        col.push(true);
      }

    }
    grid.push(col);
  }

  g.clear();

  grid[lx][ly] = true;
  delFromGrid(lx, ly);

  connections = [];
  bloks = [];
  lx = 0;
  ly = 0;
  prog = 1;
  loop();
}

function delFromGrid(x,y) {
  const key = `${x}_${y}`;
  if (key in gridMap) {
    delete gridMap[key];
  }
}

function draw() {
  background(0);
  g.clear();

  if (showGrid) {
    // point raster
    fill(255);
    noStroke();
    for (let x = gridSize; x < sketchWidth; x += gridSize) {
      for (let y = gridSize; y < sketchHeight; y += gridSize) {
        g.circle(x, y, 3, 3);
      }
    }
  }

  g.noFill();
  g.strokeWeight(5);
  g.strokeCap(ROUND);
  g.strokeJoin(ROUND);
  g.stroke(255);

  if (ckGap.checked() && ckCenter.checked()) {
    g.line(0, 0, gridSize, gridSize);
  }

  connections.forEach((c, ci) => {
    if (ci < connections.length - 1) {
      connect(c[0], c[1], c[2], c[3], c[4], 1);
    }
  });

  if (connections.length > 0) {
    const lC = connections[connections.length - 1];
    connect(lC[0], lC[1], lC[2], lC[3], lC[4], prog);
    prog += 0.06;
  }

  if (prog >= 1) {
    prog = 0.00001;
    let dirs = [[-1,-1],[-1,1],[1,-1],[1,1],[0,1],[1,0],[-1,0],[0,-1]].sort((a, b) => random(-1, 1));
    let found = false;
    const overlap = Math.random();
    for (let d = 0; d < dirs.length && !found; d += 1) {
      const dx = dirs[d][0];
      const dy = dirs[d][1];
      const nx = lx + dx;
      const ny = ly + dy;
      if (
        (nx >= 0 && nx < grid.length &&
         ny >= 0 && ny < grid[0].length) &&
         grid[nx][ny] === false &&
         (
          (dx === 0 || dy === 0) ||
          (!blocks.includes(`${lx+dx}_${ly}-${lx}_${ly+dy}`) || overlap > sldOverlap.value())
         )
      ) {
        grid[nx][ny] = true;
        delFromGrid(nx, ny);
        connections.push([lx, ly, nx, ny, Math.ceil(Math.random()*3)]);
        blocks.push(`${lx}_${ly}-${nx}_${ny}`);
        blocks.push(`${nx}_${ny}-${lx}_${ly}`);
        lx = nx;
        ly = ny;
        found = true;
      }
    }

    const oKeys = Object.keys(gridMap).sort((a,b) => Math.random()-0.5);
    const max = grid.length*grid[0].length;
    let over = false;
    if (!found) {
      over = true;
      // set new start point
      // check if everythings hit
      if (ckFill.checked()) {
        if (oKeys.length > max - (max * sldFill.value())) {
          const xy = gridMap[oKeys[0]];
          grid[xy[0]][xy[1]] = true;
          lx = xy[0];
          ly = xy[1];
          delFromGrid(xy[0], xy[1]);
          prog = 1;
          over = false;
        }
      }
    }

    if (over || oKeys.length < max - (max * sldFill.value())) {
      noLoop();
      if (ckAuto.checked()) {
        timeout = setTimeout(resetDraw, 1500);
      }
    }

  }
  translate(sketchWidth / 2, sketchHeight / 2);
  image(g, 0, 0);
  scale(-1,1);
  image(g, 0, 0);
  scale(-1,-1);
  image(g, 0, 0);
  scale(-1,1);
  image(g, 0, 0);
}

function connect(sx, sy, ex, ey, modi, prog) {
  const dx = ex - sx;
  const dy = ey - sy;
  const sxr = (sx + (ckGap.checked() ? 1 : 0)) * gridSize;
  const syr = (sy + (ckGap.checked() ? 1 : 0)) * gridSize;
  const exr = (ex + (ckGap.checked() ? 1 : 0)) * gridSize;
  const eyr = (ey + (ckGap.checked() ? 1 : 0)) * gridSize;
  const pxr = sxr + (exr - sxr) * prog;
  const pyr = syr + (eyr - syr) * prog;
  // special line??
  if (dx === 0 || dy === 0) {
    modi = 1;
  }
  switch(modi){
    case 1:
      // straight
      g.line(
        sxr,
        syr,
        pxr,
        pyr);
      break;
    case 2:
      // curve #1
      const sAng1 = (dy > 0)
        ? (dx > 0)
          ? Math.PI * 1.5
          : Math.PI * 1
        : (dx > 0)
          ? Math.PI * 0
          : Math.PI * 0.5;

      const eAng1 = (dy > 0)
        ? (dx > 0)
          ? Math.PI * 2
          : Math.PI * 1.5
        : (dx > 0)
          ? Math.PI * 0.5
          : Math.PI * 1;

      const pEAng1 = ((dy < 0 && dx > 0) || (dy > 0 && dx < 0))
        ? eAng1
        : sAng1 + (eAng1 - sAng1) * prog;

      const pSAng1 = ((dy < 0 && dx > 0) || (dy > 0 && dx < 0))
        ? eAng1 - (eAng1 - sAng1) * prog
        : sAng1;

      g.arc(
        sxr,
        eyr,
        gridSize * 2,
        gridSize * 2,
        pSAng1,
        pEAng1
      );
      break;
    case 3:
      // curve #2
      const sAng2 = (dx > 0)
        ? (dy > 0)
          ? Math.PI * 0.5
          : Math.PI * 1
        : (dy > 0)
          ? Math.PI * 0
          : Math.PI * 1.5;

      const eAng2 = (dx > 0)
        ? (dy > 0)
          ? Math.PI * 1
          : Math.PI * 1.5
        : (dy > 0)
          ? Math.PI * 0.5
          : Math.PI * 2;

      const pEAng2 = ((dy < 0 && dx < 0) || (dy > 0 && dx > 0))
        ? eAng2
        : sAng2 + (eAng2 - sAng2) * prog;

      const pSAng2 = ((dy < 0 && dx < 0) || (dy > 0 && dx > 0))
        ? eAng2 - (eAng2 - sAng2) * prog
        : sAng2;

      g.arc(
        exr,
        syr,
        gridSize * 2,
        gridSize * 2,
        pSAng2,
        pEAng2
      );
      break;
  }
}