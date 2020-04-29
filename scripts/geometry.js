class Mesh {
  constructor(){
    this.vertices = [];
    this.faces = [];
    this.hedges = [];
  }
  getHEdge(i){ return this.hedges[i]; }
  getFace(i){ return this.faces[i]; }
  getVertex(i){ return this.vertices[i]; }

  draw(ctx, infos = true){
    for(let i = 0; i < this.vertices.length; i++){
      this.vertices[i].draw(ctx, infos);
    }
    for(let i = 0; i < this.hedges.length; i++){
      this.hedges[i].draw(ctx,i, this, "#000", infos);
    }
  }

  addVertex(v){
    v.edge = undefined;
    this.vertices.push(v);
    return this.vertices.length - 1;
  }

  addFace(idV0, idV1, idV2){
    // 1 - On créé la nouvelle face
    let face = new Face();
    this.faces.push(face);
    let f = this.faces.length - 1;

    // 2 - On récupère la liste des HEdges incidents aux Vertex
    let incidentV0 = this.incidentEdgeVertex(idV0);
    let incidentV1 = this.incidentEdgeVertex(idV1);
    let incidentV2 = this.incidentEdgeVertex(idV2);

    // 3 - Création des variables qui contiendrons les HEdges qui relient les Vertex
    // idV0 -> idV1 = e0
    // idV1 -> idV2 = e1
    // idV2 -> idV0 = e2
    let e0, e1, e2;

    // Création d'une fonction anonyme permettant, pour 2 vertex donné et leur listes de HEdges incidents respectifs
    // De retourner la HEdge qui les relients, ayant pour idVertex2 comme tête
    // Si celle-ci n'existe pas alors on l'a créé avec son opposé et on update les listes d'incidences
    const resolveEdges = (idVertex1, idVertex2, incidentVertex1, incidentVertex2) => {
      let edgeFound;
      for (let i = 0; i < incidentVertex1.length; i++) {
        if (this.getHEdge(incidentVertex1[i]).vhead == idVertex2) {
          edgeFound = incidentVertex1[i];
          break;
        }
      }
      if (edgeFound == undefined) {
        edgeFound = this.hedges.length;
        let e0Hedge = new HEdge(idVertex2, undefined, undefined, edgeFound + 1, f);
        let e0HedgeOpposite = new HEdge(idVertex1, undefined, undefined, edgeFound, undefined);
        this.hedges.push(e0Hedge);
        this.hedges.push(e0HedgeOpposite);
        incidentVertex1.push(this.hedges.length - 2);
        incidentVertex1.push(this.hedges.length - 1);
        incidentVertex2.push(this.hedges.length - 2);
        incidentVertex2.push(this.hedges.length - 1);
      }
      return edgeFound;
    }

    e0 = resolveEdges(idV0, idV1, incidentV0, incidentV1);
    e1 = resolveEdges(idV1, idV2, incidentV1, incidentV2);
    e2 = resolveEdges(idV2, idV0, incidentV2, incidentV0);

    // 4 - On connecte les différents HEdges au sein du nouveau triangle et on ajoute les différentes liaisons
    // Connexion des HEdges
    this.getHEdge(e0).next = e1;
    this.getHEdge(e1).next = e2;
    this.getHEdge(e2).next = e0;

    this.getHEdge(e0).prev = e2;
    this.getHEdge(e1).prev = e0;
    this.getHEdge(e2).prev = e1;

    //Connexion des HEdges à la face
    this.getHEdge(e0).face = f;
    this.getHEdge(e1).face = f;
    this.getHEdge(e2).face = f;

    //Connexion de la face à une Edge quelconque
    face.edges[0] = e0;
    face.edges[1] = e1;
    face.edges[2] = e2;

    //Si un vertex ne possède pas de Edge associé alors on lui attribue un
    if (this.getVertex(idV0).edge == undefined) this.getVertex(idV0).edge = e2;
    if (this.getVertex(idV1).edge == undefined) this.getVertex(idV1).edge = e0;
    if (this.getVertex(idV2).edge == undefined) this.getVertex(idV2).edge = e1;

    // 5 - On Update les liaisons HEdges opposés si ceux-ci ne possèdent pas de face associés
    // Le but est de répérer deux HEdges incidents à un Vertex et de les lier dans la bonne direction
    const resolveLink = (incidents, vId) => {
      let incidentsNoFace = [];
      for (let i = 0; i < incidents.length; i++) {
        if (this.getHEdge(incidents[i]).face == undefined) incidentsNoFace.push(incidents[i]);
      }
      if(incidentsNoFace.length >= 2){
        let first, end;
        if(this.getHEdge(incidentsNoFace[0]).vhead == vId){ first = 0; end = 1; }
        else { first = 1; end = 0; }
        this.getHEdge(incidentsNoFace[first]).next = incidentsNoFace[end];
        this.getHEdge(incidentsNoFace[end]).prev = incidentsNoFace[first];
      }
    }

    resolveLink(incidentV0, idV0);
    resolveLink(incidentV1, idV1);
    resolveLink(incidentV2, idV2);

    return f;
  }

  vertexFace(face) {
  	let vertices = [];
  	for (let i = 0; i < 3; i++) {
  		let edge = getFace(face).edges[i];
  		vertices.push(this.getHEdge(edge).vhead);
  	}
  	return vertices;
  }

  vertexEdge(e) {
  	let vertices = [];
  	let edge = this.getHEdge(e);
  	vertices.push(edge.vhead);
  	vertices.push(this.getHEdge(edge.opposite).vhead);
  	return vertices;
  }

  facesAdajcentEdge(e) {
  	let faces = [];
  	let edge = this.getHEdge(e);
  	face1 = edge.face;
  	face2 = this.getHEdge(edge.opposite).face;
  	if (face1 != undefined) faces.push(face1);
  	if (face2 != undefined) faces.push(face2);
  	return faces;
  }

  getEdgesFace(face) {
  	let edges = [];
    let e = getFace(face).edge;
    edges.push(e.edge);
    edges.push(this.getHEdge(e.edge).next);
    edges.push(this.getHEdge(e.edge).prev);
  	return edges;
  }

  getVertexFace(face){
    let edges = getEdgesFace(face);
    edges[0] = this.getHEdge(edges[0]).vhead;
    edges[1] = this.getHEdge(edges[1]).vhead;
    edges[2] = this.getHEdge(edges[2]).vhead;
    return edges;
  }

  edgesFace(face) {
  	let edges = [];
  	for (let i = 0; i < 3; i++) {
  		edge = getFace(face).edges[i];
  		edges.push(edge);
  		edges.push(this.getHEdge(edge).opposite);
  	}
  	return edges;
  }

  //Incident Iterator Vertex
  *incidentIteratorVertex(v){
    let iMax = 0;
    let e = this.getVertex(v).edge;
    let head = this.getVertex(v).edge;
    do {
      yield e;
      e = this.getHEdge(e).opposite;
      yield e;
      e = this.getHEdge(e).prev;
    } while(e != head);
  }

  //Incident Iterator FAce
  *incidentIteratorFace(){
    for(let i = 0; i < this.faces.length; i++){
      yield i;
    }
  }

  incidentEdgeVertex(v) {
  	let edges = [];
  	for (let i = 0; i < this.hedges.length; i++) {
  		if (this.getHEdge(i).vhead == v || this.getHEdge(this.getHEdge(i).opposite).vhead == v) edges.push(i);
  	}
  	return edges;
  }

  legalEdge(iHedge){
    let mainHedge = this.getHEdge(iHedge);
    let mainHedgeOpposite = this.getHEdge(this.getHEdge(iHedge).opposite);
    if(mainHedge.face == undefined || mainHedgeOpposite.face == undefined) return true;

    let face1_start = this.getVertex(this.getHEdge(mainHedge.next).vhead);
    let face1_second = this.getVertex(mainHedge.vhead);
    let face1_third = this.getVertex(this.getHEdge(mainHedge.opposite).vhead);

    let face2_start = this.getVertex(this.getHEdge(mainHedgeOpposite.next).vhead);
    let face2_second = this.getVertex(mainHedgeOpposite.vhead);
    let face2_third = this.getVertex(this.getHEdge(mainHedgeOpposite.opposite).vhead);

    let Face1_Vector1 = createVector(face1_start, face1_second);
    let Face1_Vector2 = createVector(face1_start, face1_third);
    let angleFace1 = angleVector(Face1_Vector1, Face1_Vector2);

    let Face2_Vector1 = createVector(face2_start, face2_second);
    let Face2_Vector2 = createVector(face2_start, face2_third);
    let angleFace2 = angleVector(Face2_Vector1, Face2_Vector2);

    return angleFace1 + angleFace2 < 180;
  }

  flipHEdge(iHedge){
    let mainHedge = this.getHEdge(iHedge);
    let mainHedgeOpposite = this.getHEdge(this.getHEdge(iHedge).opposite);

    if(mainHedge.face == undefined || mainHedgeOpposite.face == undefined) return true;
    mainHedge.vhead = this.getHEdge(mainHedge.next).vhead;
    mainHedgeOpposite.vhead = this.getHEdge(mainHedgeOpposite.next).vhead;
    //Calcul suivant précédents
    let oppNext = mainHedgeOpposite.next;
    let self = iHedge;
    let opp = mainHedge.opposite;
    let oppPrev = mainHedgeOpposite.prev;
    let prev = mainHedge.prev;
    let oppNextOpp = this.getHEdge(mainHedgeOpposite.next).opposite;
    //Opposite
    let o_oppNext = mainHedge.next;
    let o_self = mainHedge.opposite;
    let o_opp = iHedge;
    let o_oppPrev = mainHedge.prev;
    let o_prev = mainHedgeOpposite.prev;
    let o_oppNextOpp = this.getHEdge(mainHedge.next).opposite;
    //correction des Vertex
    if(mainHedge.vhead == this.getVertex(mainHedge.vhead).edge) this.getVertex(mainHedge.vhead).edge = oppNextOpp;
    if(mainHedgeOpposite.vhead == this.getVertex(mainHedgeOpposite.vhead).edge) this.getVertex(mainHedgeOpposite.vhead).edge = o_oppNextOpp;
    //Adjacent en premier
    this.getHEdge(mainHedge.prev).next = oppNext;
    this.getHEdge(mainHedge.prev).prev = self;
    this.getHEdge(mainHedge.next).next = opp;
    this.getHEdge(mainHedge.next).prev = oppPrev;
    this.getHEdge(self).next = prev;
    this.getHEdge(self).prev = oppNext;
    //Opposite
    this.getHEdge(mainHedgeOpposite.prev).next = o_oppNext;
    this.getHEdge(mainHedgeOpposite.prev).prev = o_self;
    this.getHEdge(mainHedgeOpposite.next).next = o_opp;
    this.getHEdge(mainHedgeOpposite.next).prev = o_oppPrev;
    this.getHEdge(o_self).next = o_prev;
    this.getHEdge(o_self).prev = o_oppNext;
    //On Update les faces
    this.getHEdge(prev).face = this.getHEdge(self).face;
    this.getHEdge(oppNext).face = this.getHEdge(self).face;
    this.getHEdge(o_prev).face = this.getHEdge(o_self).face;
    this.getHEdge(o_oppNext).face = this.getHEdge(o_self).face;
    //On Update les HEdges des faces
    this.getFace(this.getHEdge(self).face).edges = [prev, self, oppNext];
    this.getFace(this.getHEdge(o_self).face).edges = [o_prev, o_self, o_oppNext];
  }

  /**
   * recursiveCorrection permet d'effectuer une succession de flip si les différentes edges sont illégales
   * @param  {Number} iHedge            l'identifiant de l'edge
   * @param  {Number} [maxRecursion=50] éviter une boucle infinie
   */
  recursiveCorrection(iHedge, maxRecursion = 15){
    if(!this.legalEdge(iHedge) && maxRecursion > 0){
      this.flipHEdge(iHedge);
      this.recursiveCorrection(this.getHEdge(iHedge).next, --maxRecursion);
      this.recursiveCorrection(this.getHEdge(iHedge).prev, --maxRecursion);
      this.recursiveCorrection(this.getHEdge(this.getHEdge(iHedge).opposite).next, --maxRecursion);
      this.recursiveCorrection(this.getHEdge(this.getHEdge(iHedge).opposite).prev, --maxRecursion);
    }
  }
}

class Vertex {
  constructor(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
	  this.edge = undefined;
  }

  copy(){
    return new Vertex(this.x, this.y, this.z);
  }

  add(vertex){
    return new Vertex(this.x + vertex.x, this.y + vertex.y, this.z + vertex.z);
  }

  devide(a){
    return new Vertex(this.x / a, this.y / a, this.z / a);
  }

  distance(v){
    return Math.sqrt( Math.pow((this.x-v.x), 2) + Math.pow((this.y-v.y), 2) + Math.pow((this.z-v.z), 2) );
  }

  draw(ctx, color){
    let c = color || '#000';
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2, true);
    ctx.fill();
  }
}

class HEdge {
  constructor(vhead, next, prev, opposite, face){
    this.vhead = vhead;
    this.next = next;
    this.prev = prev;
    this.opposite = opposite;
    this.face = face;
  }

  draw(ctx, i, mesh, color, infos){
    let c = color || '#000';
    let headlen = 10; // length of head in pixels
    ctx.textAlign = 'center';
    ctx.fillStyle = c;

    let edgeOpposite = mesh.getHEdge(this.opposite);
    let oppositePoint = mesh.getVertex(edgeOpposite.vhead);
    let point = mesh.getVertex(this.vhead);

    let dx = point.x - oppositePoint.x;
    let dy = point.y - oppositePoint.y;
    let angle = Math.atan2(dy, dx);

    let displacmentX = 2 * Math.cos(angle + Math.PI / 2);
    let displacmentY = 2 * Math.sin(angle + Math.PI / 2);
    displacmentX = 0;
    displacmentY = 0;

    ctx.strokeStyle = c;
    ctx.beginPath();
    canvas_arrow(ctx, oppositePoint.x + displacmentX, oppositePoint.y + displacmentY, point.x + displacmentX, point.y + displacmentY);
    ctx.stroke();
    if(infos) ctx.fillText('E' + i, (oppositePoint.x + point.x) / 2 + headlen * Math.cos(angle + Math.PI / 2), (oppositePoint.y + point.y) / 2 + headlen * Math.sin(angle + Math.PI / 2));
  }
}

class Face {
  constructor(){
    this.edges = [];
  }
}

function rand(min, max) {
  return (Math.random() * (max - min) ) + min;
}

function randomizePoints(n, centre, rayon) {
    let points = [];
    for (let i = 0; i < n; ++i) {
        let angle = Math.random()*Math.PI*2;
        let randR = rand(0, rayon);
        let x = Math.cos(angle) * randR;
        let y = Math.sin(angle) * randR;
        points[i] = new Vertex(Math.round(x + centre.x), Math.round(y + centre.y), 0);
    }
    return points;
}

function canvas_arrow(context, fromx, fromy, tox, toy) {
  let headlen = 10; // length of head in pixels
  let dx = tox - fromx;
  let dy = toy - fromy;
  let angle = Math.atan2(dy, dx);
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 20), toy - headlen * Math.sin(angle - Math.PI / 20));
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 20), toy - headlen * Math.sin(angle + Math.PI / 20));
}
