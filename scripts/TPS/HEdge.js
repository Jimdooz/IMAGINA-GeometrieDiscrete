/**
 * HEdge représente une demi arrête ( Half Edge )
 * Il pointe vers un Vertex
 * Vers sont suivant et précédent et opposé
 * Et appartient à une face
 */
class HEdge {
  constructor(vhead, next, prev, opposite, face){
    this.vhead = vhead;       // Le vertex pointé par le Half Edge
    this.next = next;         // Représente la HEdge suivant
    this.prev = prev;         // Représente la HEdge précédente
    this.opposite = opposite; // Représente la HEdge opposé
    this.face = face;         // Représente la face auquel appartient la HEdge
  }
}
