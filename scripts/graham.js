/**
 * Pour la structure point on considérera que c'est un vertex
 * auquel on a plaqué sa position z sur le plan 2D
 * @extends Vertex
 */
class Point extends Vertex {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 0;
  }
}

function crossProduct(p1, p2) {
    return (p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y);
}

function orientation(r, s, t) {
    let val = (s.y - r.y) * (t.x - s.x) - (s.x - r.x) * (t.y - s.y);
    return val == 0 ? 0 : val > 0 ? 1 : 2;
}

function concave (r, s, t){
    return orientation(r,s,t)!=2;
}

function compare(p1, p2) {
    let o = orientation(pivot, p1, p2);
    if (o == 0) return (crossProduct(pivot, p2) >= crossProduct(pivot, p1))? -1 : 1;
    return o == 2 ? -1: 1;
}

let pivot;

function Graham(points) {
    //On récupère le point pivot
    let min = 0;
    for (let i = 1; i < points.length; i++) {
        if ((points[i].y < points[min].y) || (points[min].y ==points[i].y && points[i].x < points[min].x))
            min = i;
    }
    // On place le point pivot à la première position
    let temp = points[0];
    points[0] = points[min];
    points[min] = temp;
    // On place le pivot en global
    pivot = points[0];

    // On tri par ordre d'orientation croissant
    let enveloppe = [];
    points = [...points].sort(compare);

    // On commence l'algorithme
    enveloppe.push(points[0]);
    enveloppe.push(points[1]);
    for (let i = 2; i < points.length; ++i) {
        while (enveloppe.length >= 2 && concave(enveloppe[enveloppe.length - 2], enveloppe[enveloppe.length - 1], points[i])) {
            enveloppe.pop();
        }
        enveloppe.push(points[i]);
    }
    return enveloppe;
}
