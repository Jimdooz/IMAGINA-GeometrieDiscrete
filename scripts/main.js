let canvas = document.getElementById('SCENE');
let ctx = canvas.getContext('2d');

/*********************************************************/
/* MOUSE                                                 */
/*********************************************************/
let MOUSE = { x: 0, y: 0, screenX: 0, screenY: 0, down: false };

const maxNumber = 5000000;

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    MOUSE.x = evt.clientX - rect.left;
    MOUSE.y = evt.clientY - rect.top;
}

ctx.canvas.width = ctx.canvas.offsetWidth;
ctx.canvas.height = ctx.canvas.offsetHeight;

let min = ctx.canvas.width > ctx.canvas.height ? ctx.canvas.height : ctx.canvas.width;

let pointSelected = false;
let points = randomizePoints(4, new Vertex(ctx.canvas.width / 2, ctx.canvas.height / 2, 0), min / 2.5);
let m;
m = new Mesh();
m.addVertex(points[0]);
m.addVertex(points[1]);
m.addVertex(points[2]);
m.addVertex(points[3]);
m.addFace(0,1,2);
m.addFace(1,3,2);
m.addFace(1,0,3);
m.addFace(3,0,2);


function draw(Time) {
  ctx.canvas.width = ctx.canvas.offsetWidth;
  ctx.canvas.height = ctx.canvas.offsetHeight;
  for(let i = 0; i < points.length; i++){
    points[i].draw(ctx);
  }

  // canvas_arrow(ctx, points[0].x, points[0].y, points[1].x, points[1].y);
  // canvas_arrow(ctx, points[0].x, points[0].y, points[2].x, points[2].y);
  // ctx.stroke();
  //
  // let pi_pj = createVector(points[0], points[1]);
  // let pi_pk = createVector(points[0], points[2]);
  // let angleA = angleVector(pi_pk, pi_pj);
  // console.log(angleA);

  // m = Triangulation(points, ctx);
  m.draw(ctx);
  // drawDelanoi(m, ctx);
}

function getCenterFace(m, ctx, faceId, centerFaces){
  if(centerFaces[faceId] != undefined) return centerFaces[faceId];
  centerFaces[faceId] = drawCircleCirconscrit(m.getVertex(m.getHEdge(m.getFace(faceId).edges[0]).vhead), m.getVertex(m.getHEdge(m.getFace(faceId).edges[1]).vhead), m.getVertex(m.getHEdge(m.getFace(faceId).edges[2]).vhead));
  return centerFaces[faceId];
}

function drawDelanoi(m, ctx){
  let centerFaces = [];
  for(let i = 0; i < m.faces.length; i++){
    let center = getCenterFace(m, ctx, i, centerFaces);

    const drawSegment = (hedge) => {
      let tmpId = hedge;
      hedge = m.getHEdge(hedge);
      if(hedge.face == undefined){
        let p1 = m.getVertex(hedge.vhead);
        let p2 = m.getVertex(m.getHEdge(hedge.opposite).vhead);
        let p3 = m.getVertex(m.getHEdge(m.getHEdge(hedge.opposite).next).vhead);
        let centerTriangle = p1.add(p2).add(p3).devide(3);

        let pcenter = p1.add(p2).devide(2);
        let v = createVector(center, pcenter);
        let v2 = createVector(centerTriangle, pcenter);
        if(dotProduct(v, v2) < 0) v = v.devide(-1);
        v = normalize(v);
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(v.x * maxNumber + center.x, v.y * maxNumber + center.y);
        ctx.stroke();
      }else{
        let otherFaceCenter = getCenterFace(m, ctx, hedge.face, centerFaces);
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(otherFaceCenter.x, otherFaceCenter.y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#0000ff";
    let edges = m.getFace(i).edges;
    drawSegment(m.getHEdge(edges[0]).opposite);
    drawSegment(m.getHEdge(edges[1]).opposite);
    drawSegment(m.getHEdge(edges[2]).opposite);
  }
}

function angleVector(v1, v2){
  let v1_dist = magnitude(v1);
  let v2_dist = magnitude(v2);
  return Math.acos(dotProduct(v1, v2) / (v1_dist * v2_dist)) * (180 / Math.PI);
}

function magnitude(v1){
  return Math.sqrt(Math.pow(v1.x, 2) + Math.pow(v1.y, 2));
}

function normalize(v1) {
  let m = magnitude(v1);
  return v1.devide(m);
};

function dotProduct(v1, v2){
  return v1.x * v2.x + v1.y * v2.y;
}

function drawCircleCirconscrit(A, B, C, debug = false){
  const radians = (Math.PI / 180) * 90;

  const K = new Vertex((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  const nx = K.distance(A) * (Math.cos(radians) * (A.x - K.x)) + (Math.sin(radians) * (A.y - K.y)) + K.x;
  const ny = K.distance(A) * (Math.cos(radians) * (A.y - K.y)) - (Math.sin(radians) * (A.x - K.x)) + K.y;
  const A2 = new Vertex(nx, ny, 0);

  const K2 = new Vertex((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2);
  const nx2 = K2.distance(A) * (Math.cos(radians) * (A.x - K2.x)) + (Math.sin(radians) * (A.y - K2.y)) + K2.x;
  const ny2 = K2.distance(A) * (Math.cos(radians) * (A.y - K2.y)) - (Math.sin(radians) * (A.x - K2.x)) + K2.y;
  const C2 = new Vertex(nx2, ny2, 0);

  const droiteA = droite(A2, K);
  const droiteB = droite(C2, K2);
  const center = intersectionDroite(droiteA, droiteB);
  if(debug){
    center.draw(ctx, "#0000ff");

    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.arc(center.x, center.y, center.distance(A), 0, Math.PI * 2, true);
    ctx.stroke();
  }
  return center;
}

function pointInsideTriangle(s, a, b, c) {
    let as_x = s.x-a.x;
    let as_y = s.y-a.y;

    let s_ab = (b.x-a.x)*as_y-(b.y-a.y)*as_x > 0;
    if((c.x-a.x)*as_y-(c.y-a.y)*as_x > 0 == s_ab) return false;
    if((c.x-b.x)*(s.y-b.y)-(c.y-b.y)*(s.x-b.x) > 0 != s_ab) return false;

    return true;
}

//y=mx+p
function droite(A, B){
  // console.log(A, B);
  let m = (B.y - A.y) / (B.x - A.x);
  let p = A.y - m * A.x;
  return {m, p}
}

function resolveDroite(d, x){
  return new Vertex(x, d.m * x + d.p, 0);
}

// d1.m * x + d1.p = d2.m * x + d2.p
// x = (d2.p - d1.p) / (d2.m - d1.m)
function intersectionDroite(d1, d2){
  let x = (- d2.p + d1.p) / (d2.m - d1.m);
  return new Vertex(x, d1.m * x + d1.p, 0);
}

function grabPoint(){
  if(pointSelected) return;
  for(let i = 0; i < points.length; i++){
    if(distancePoint(MOUSE, points[i]) < 5){
      pointSelected = points[i];
      return;
    }
  }
}

function distancePoint(a, b) {
    return Math.sqrt(((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y)));
}

canvas.addEventListener('mousemove', function(evt) {
  getMousePos(canvas, evt);
  if(pointSelected){
    pointSelected.x = MOUSE.x;
    pointSelected.y = MOUSE.y;
  }
});

window.addEventListener('mouseup', function(evt) { pointSelected = false; });

window.addEventListener('mousedown', function(evt) { grabPoint(); });

let mainLoop = new Loop(draw);
