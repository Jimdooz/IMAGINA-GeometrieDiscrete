function getElementEnv(m, v){
  let incidents = m.incidentEdgeVertex(v);
  // console.log("Start", v);
  for (let i = 0; i < incidents.length; i++) {
    // console.log(v, m.getHEdge(incidents[i]));
    if (m.getHEdge(incidents[i]).face == undefined && m.getHEdge(incidents[i]).vhead != v) {
      return incidents[i];
    }
  }
}

function Triangulation(givenPoints, ctx, debug = false){
    let m = new Mesh();

    //Sort points
    let points = [...givenPoints].sort((a, b) => {
      if(a.x == b.x){
          return a.y > b.y? 1: -1;
      }
      return a.x > b.x? 1: -1;
    });

    //On ajoute les points à l'enveloppe convexe
    let iv0 = m.addVertex(points[0]);
  	let iv1 = m.addVertex(points[1]);
  	let iv2 = m.addVertex(points[2]);

	  m.addFace(iv0, iv1, iv2); //Ajout de la première face

    let ilastVertex = iv2;
    let nbPoints = 3;
    let totalPoints = points[0].add(points[1]).add(points[2]);
    let O = totalPoints.devide(nbPoints);

    for(let i=3;i<points.length;++i){

      if(debug) drawVertex(O, ctx, '#ff0000');

      //Dernier point vu
      let lastVertex = m.getVertex(ilastVertex);
      // drawVertex(lastVertex, ctx, '#0000ff');
      let edgeEnveloppe = getElementEnv(m, ilastVertex); //L'Edge qui permet de débuter le chemin de l'enveloppe convexe
      let lastPointView = lastVertex; //On copy le dernier point qui a été ajouté à l'enveloppe convexe

      let edgeCalcul = edgeEnveloppe;
      let horizonF = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'avant
      let horizonB = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'arrière
      let HEdgeHorizonF = undefined;
      let HEdgeHorizonB = edgeEnveloppe;
      let foundF = false; //Condition de sortie si on a trouvé l'horizon du parcours avant
      let foundB = false; //Condition de sortie si on a trouvé l'horizon du parcours arrière
      let max = 200;

      // if(i == 4) console.log(edgeEnveloppe, "head", m.getHEdge(edgeCalcul).vhead, edgeCalcul, m.getHEdge(m.getHEdge(edgeCalcul).opposite).vhead);

      //Côté forward
      while(!foundF){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête
          if(!nextEdge) console.log(i, iv2, ilastVertex, m.getVertex(ilastVertex), edgeEnveloppe, edgeCalcul, nextEdge);
          let headId = nextEdge.vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          // if(i == 4) {
          //   ctx.strokeStyle = "#ff0000";
          //   canvas_arrow(ctx, points[i].x, points[i].y, head.x, head.y);
          //   ctx.stroke();
          // }
          if(pointVisible(points[i], O, head, lastVertex, debug, ctx)){
            // if(i >= 4) drawVertex(head, ctx, '#0000ff');
            HEdgeHorizonF = edgeCalcul;
            edgeCalcul = nextEdge.next;
            lastVertex = head;
            horizonF = headId;
          }else{
            foundF = true;
          }
          if(horizonF == 0) foundF = true; //Si on a trouvé le premier point alors on s'arrête on évite de boucle la recherche dans le cas de 3 points visible
      }


      edgeCalcul = m.getHEdge(edgeEnveloppe).prev;
      lastVertex = m.getVertex(ilastVertex); //On réinitialise le dernier point vu
      while(!foundB){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête de son opposé
          let headId = m.getHEdge(nextEdge.opposite).vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          // if(i == 4) {
          //   ctx.strokeStyle = "#0000ff";
          //   canvas_arrow(ctx, points[i].x, points[i].y, head.x, head.y);
          //   ctx.stroke();
          // }
          if(pointVisible(points[i], O, head, lastVertex, debug, ctx)){
              // if(i >= 5) drawVertex(head, ctx, '#0000ff');
              HEdgeHorizonB = edgeCalcul;
              edgeCalcul = nextEdge.prev;
              lastVertex = head;
              horizonB = headId;
          }else{
              foundB = true;
          }
          if(headId == horizonF || horizonB == 0) foundB = true; //Si le prochain point appartient déjà à l'autre horizon alors on s'arrête
      }
      // if(i >= 4) return m;

      //On commence d'une extrémité
      let ivNext = m.addVertex(points[i]);
      //Création du premier triangle
      let horizonEdge = m.getHEdge(HEdgeHorizonB); //On récupère l'opposé d'un point de l'horizon
      let constructorParcours = true;
      let toBuild = [];
      while(constructorParcours){
          if(--max < 0) break;
          let nextHead = horizonEdge.vhead;
          toBuild.push(nextHead);
          toBuild.push(ivNext);
          toBuild.push(horizonB);
          if(nextHead == horizonF) constructorParcours = false;

          horizonB = nextHead;
          horizonEdge = m.getHEdge(horizonEdge.next);
      }

      for(let i = 0; i < toBuild.length; i+=3){
        //console.log(HEdgeHorizonB, horizonEdge, toBuild[i], toBuild[i+1], toBuild[i+2]);
        horizonEdge = m.getHEdge(HEdgeHorizonB);
        let copyHEdgeHorizonB = HEdgeHorizonB;
        HEdgeHorizonB = horizonEdge.next;
        m.addFace(toBuild[i], toBuild[i+1], toBuild[i+2]);
        m.recursiveCorrection(copyHEdgeHorizonB);
      }

      ilastVertex = ivNext;

      //Calcul du point O
      totalPoints = totalPoints.add(points[i]);
      nbPoints++;
      O = totalPoints.devide(nbPoints);

    }

    return m;
}

function drawVertex(vertex, ctx, color){
  let c = color || '#000';
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, 4, 0, Math.PI * 2, true);
  ctx.fill();
}

function createVector(A, B){
    return new Vertex(B.x - A.x, B.y - A.y, B.z - A.z);
}

function oppositeSigns(x, y) {
  return (x < 0)? (y >= 0): (y < 0);
}

function determinant(u,v) {
    return u.x * v.y - v.x * u.y;
}

//On cherche à savoir si le point pk est visible du point pi en sachant que O appartient à l'enveloppe convexe et que pj est un point déjà visible du point pi
//On recherche donc si les déterminants sont opposé
// (pi, pj) (pi, pk) & (O, pj) (O, pk)
function pointVisible(pi, O, pk, pj, show = false, ctx){
    //Déterminants opposés alors vrai
    let pi_pj = createVector(pi, pj);
    let pi_pk = createVector(pi, pk);
    let determinantA = determinant(pi_pk, pi_pj);

    let O_pj = createVector(O, pj);
    let O_pk = createVector(O, pk);
    let determinantB = determinant(O_pk, O_pj);

    let opposite = oppositeSigns(determinantA, determinantB);

    if(show){
      canvas_arrow(ctx, pi.x, pi.y, pj.x, pj.y);
      canvas_arrow(ctx, pi.x, pi.y, pk.x, pk.y);

      canvas_arrow(ctx, O.x, O.y, pj.x, pj.y);
      canvas_arrow(ctx, O.x, O.y, pk.x, pk.y);

      ctx.strokeStyle = opposite ? "#0000ff" : "#ff0000";
      ctx.stroke();
    }

    return opposite; //Si la multiplication est négative alors opposé
}
