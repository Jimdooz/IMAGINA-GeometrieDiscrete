function getElementEnv(m, v){
  let incidents = m.incidentEdgeVertex(v);
  // console.log("Start", v);
  for (let i = 0; i < incidents.length; i++) {
    // console.log(v, m.getHEdge(incidents[i]));
    if (m.getHEdge(incidents[i]).face == undefined && m.getHEdge(incidents[i]).vhead != v) {
      return incidents[i];
    }
  }
  for (let i = 0; i < incidents.length; i++) {
    console.log(m.getHEdge(incidents[i]).face, m.getHEdge(incidents[i]).vhead);
  }
}

/**
 * Permet d'obtenir le HEdge n'ayant pas de face pointant à l'opposé de v
 * @param  {Mesh} m le maillage
 * @param  {Vertex} v le vertex
 */
function incidentEdgeNoFace(m, v){
  let incr = m.incidentIteratorVertex(v);
  let incrValue = incr.next();
  while(!incrValue.done){
    if (m.getHEdge(incrValue.value).face == undefined && m.getHEdge(incrValue.value).vhead != v) {
      return incrValue.value;
    }
    incrValue = incr.next();
  }
}

function lexicographiqueSort(points){
  return [...points].sort((a, b) => {
    if(a.x == b.x){
        return a.y > b.y? 1: -1;
    }
    return a.x > b.x? 1: -1;
  });
}

function Triangulation(givenPoints, ctx, version2 = false, debug = false){
    let m = new Mesh();

    //Sort points
    let points = lexicographiqueSort(givenPoints);

    //On ajoute les points à l'enveloppe convexe
    let iv0 = m.addVertex(points[0]);
  	let iv1 = m.addVertex(points[1]);
  	let iv2 = m.addVertex(points[2]);

    //Ajout de la première face
	  m.addFace(iv0, iv1, iv2);

    let ilastVertex = iv2;
    // Calcul du point O qui sera un point appartenant à l'enveloppe convexe
    let nbPoints = 3;
    let totalPoints = points[0].add(points[1]).add(points[2]);
    let O = totalPoints.devide(nbPoints);

    for(let i=3;i<points.length;++i){
      // Dernier point vu
      let lastVertex = m.getVertex(ilastVertex);
      let edgeEnveloppe = incidentEdgeNoFace(m, ilastVertex); //L'Edge qui permet de débuter le chemin de l'enveloppe convexe

      let edgeCalcul = edgeEnveloppe;
      let horizonF = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'avant
      let horizonB = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'arrière
      let HEdgeHorizonF = edgeEnveloppe;
      let HEdgeHorizonB = edgeEnveloppe;
      let foundF = false; //Condition de sortie si on a trouvé l'horizon du parcours avant
      let foundB = false; //Condition de sortie si on a trouvé l'horizon du parcours arrière
      let max = 500; //Sécurité pour éviter une boucle infinie

      // Côté forward
      while(!foundF){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête
          if(!nextEdge){ return m; } //Parfois la génération de points créé des points au même endroit
          let headId = nextEdge.vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          if(pointVisible(points[i], O, head, lastVertex)){
            HEdgeHorizonF = edgeCalcul;
            edgeCalcul = nextEdge.next;
            lastVertex = head;
            horizonF = headId;
          }else{
            foundF = true;
          }
          if(horizonF == 0) foundF = true; //Si on a trouvé le premier point alors on s'arrête on évite de boucle la recherche dans le cas de 3 points visible
      }

      // Côté Backward
      edgeCalcul = m.getHEdge(edgeEnveloppe).prev;
      lastVertex = m.getVertex(ilastVertex); //On réinitialise le dernier point vu
      while(!foundB){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête de son opposé
          let headId = m.getHEdge(nextEdge.opposite).vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          if(pointVisible(points[i], O, head, lastVertex)){
              HEdgeHorizonB = edgeCalcul;
              edgeCalcul = nextEdge.prev;
              lastVertex = head;
              horizonB = headId;
          }else{
              foundB = true;
          }
          if(headId == horizonF || horizonB == 0) foundB = true; //Si le prochain point appartient déjà à l'autre horizon alors on s'arrête
      }

      // On commence d'une extrémité
      let ivNext = m.addVertex(points[i]);
      // Création du premier triangle
      let horizonEdge = m.getHEdge(HEdgeHorizonB); //On récupère l'opposé d'un point de l'horizon
      let constructorParcours = true;
      let toBuild = [];
      // On récupères les différents points de l'horizon qui servirons à construire les différents triangles
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

      // On construit les différents triangles
      for(let i = 0; i < toBuild.length; i+=3){
        m.addFace(toBuild[i], toBuild[i+1], toBuild[i+2]);
      }
      // On défini la nouvelle dernière vertex vue
      ilastVertex = ivNext;

      // On update la position de O
      totalPoints = totalPoints.add(points[i]);
      nbPoints++;
      O = totalPoints.devide(nbPoints);
    }

    return m;
}

function TriangulationDelauney(givenPoints, ctx){
    let m = new Mesh();

    //Sort points
    let points = lexicographiqueSort(givenPoints);

    //On ajoute les points à l'enveloppe convexe
    let iv0 = m.addVertex(points[0]);
  	let iv1 = m.addVertex(points[1]);
  	let iv2 = m.addVertex(points[2]);

    //Ajout de la première face
	  m.addFace(iv0, iv1, iv2);

    let ilastVertex = iv2;
    let nbPoints = 3;
    let totalPoints = points[0].add(points[1]).add(points[2]);
    let O = totalPoints.devide(nbPoints);

    for(let i=3;i<points.length;++i){
      //Dernier point vu
      let lastVertex = m.getVertex(ilastVertex);
      let edgeEnveloppe = incidentEdgeNoFace(m, ilastVertex); //L'Edge qui permet de débuter le chemin de l'enveloppe convexe

      let edgeCalcul = edgeEnveloppe;
      let horizonF = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'avant
      let horizonB = ilastVertex; //La position du vertex sur l'horizon en exerçant un parcours vers l'arrière
      let HEdgeHorizonF = undefined;
      let HEdgeHorizonB = edgeEnveloppe;
      let foundF = false; //Condition de sortie si on a trouvé l'horizon du parcours avant
      let foundB = false; //Condition de sortie si on a trouvé l'horizon du parcours arrière
      let max = 50;

      //Côté forward
      while(!foundF){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête
          if(!nextEdge){ return m; } //Parfois la génération de points créé des points au même endroit
          let headId = nextEdge.vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          if(pointVisible(points[i], O, head, lastVertex)){
            HEdgeHorizonF = edgeCalcul;
            edgeCalcul = nextEdge.next;
            lastVertex = head;
            horizonF = headId;
          }else{
            foundF = true;
          }
          if(horizonF == 0) foundF = true; //Si on a trouvé le premier point alors on s'arrête on évite de boucle la recherche dans le cas de 3 points visible
      }

      // Côté Backward
      edgeCalcul = m.getHEdge(edgeEnveloppe).prev;
      lastVertex = m.getVertex(ilastVertex); //On réinitialise le dernier point vu
      while(!foundB){
          if(--max < 0) break;
          let nextEdge = m.getHEdge(edgeCalcul); //On récupère l'edge pour calculer la tête de son opposé
          let headId = m.getHEdge(nextEdge.opposite).vhead; //On récupère l'id de la tête
          let head = m.getVertex(headId); //On obtient les information sur le point
          if(pointVisible(points[i], O, head, lastVertex)){
              HEdgeHorizonB = edgeCalcul;
              edgeCalcul = nextEdge.prev;
              lastVertex = head;
              horizonB = headId;
          }else{
              foundB = true;
          }
          if(headId == horizonF || horizonB == 0) foundB = true; //Si le prochain point appartient déjà à l'autre horizon alors on s'arrête
      }

      //On commence d'une extrémité
      let ivNext = m.addVertex(points[i]);
      //Création du premier triangle
      let horizonEdge = m.getHEdge(HEdgeHorizonB); //On récupère l'opposé d'un point de l'horizon
      let constructorParcours = true;
      let toBuild = [];
      // On récupères les différents points de l'horizon qui servirons à construire les différents triangles
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
      // On construit les différents triangles
      for(let i = 0; i < toBuild.length; i+=3){
        horizonEdge = m.getHEdge(HEdgeHorizonB);
        let copyHEdgeHorizonB = HEdgeHorizonB;
        HEdgeHorizonB = horizonEdge.next;
        m.addFace(toBuild[i], toBuild[i+1], toBuild[i+2]);
        // On lance une correction successive de flip si les edges sont illégales
        m.recursiveCorrection(copyHEdgeHorizonB);
      }
      // On défini la nouvelle dernière vertex vue
      ilastVertex = ivNext;
      // On update la position de O
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

//Permet de créer le vecteur allant de A à B
function createVector(A, B){
    return new Vertex(B.x - A.x, B.y - A.y, B.z - A.z);
}

//Fonction de test de signe inverse
function oppositeSigns(x, y) {
  return (x < 0)? (y >= 0): (y < 0);
}

//Permet d'obtenir le déterminants de deux vecteurs
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
