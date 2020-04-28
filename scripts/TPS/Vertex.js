/**
 * La Vertex représente un point du maillage
 * Il possède des positions dans l'espace
 * Et un pointeur vers la HEdge qui l'a en tête
 */
class Vertex {
  constructor(x, y, z){
    this.x = x; //La position x de la vertex
    this.y = y; //La position y de la vertex
    this.z = z; //La position z de la vertex
	  this.edge = undefined; //La Edge qui est connecté à ce vertex
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
}
