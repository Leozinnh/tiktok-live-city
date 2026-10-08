import * as THREE from 'three';

export class PathGraph {
  constructor() {
    this.roadNodes = [];
    this.sidewalkNodes = [];
    this.intersections = [];
  }

  addRoadNode(id, x, z, connections = [], isIntersection = false) {
    const node = { id, x, z, connections: [...connections], isIntersection };
    this.roadNodes.push(node);
    return node;
  }

  addSidewalkNode(id, x, z, connections = []) {
    const node = { id, x, z, connections: [...connections] };
    this.sidewalkNodes.push(node);
    return node;
  }

  connectRoadNodes(fromId, toId) {
    const from = this.roadNodes.find(n => n.id === fromId);
    if (from && !from.connections.includes(toId)) {
      from.connections.push(toId);
    }
  }

  connectSidewalkNodes(fromId, toId, bidirectional = true) {
    const from = this.sidewalkNodes.find(n => n.id === fromId);
    const to = this.sidewalkNodes.find(n => n.id === toId);
    if (from && to) {
      if (!from.connections.includes(toId)) from.connections.push(toId);
      if (bidirectional && !to.connections.includes(fromId)) to.connections.push(fromId);
    }
  }

  getRandomRoadNode() {
    if (this.roadNodes.length === 0) return null;
    return this.roadNodes[Math.floor(Math.random() * this.roadNodes.length)];
  }

  getNextRoadNode(currentNode) {
    if (!currentNode || !currentNode.connections || currentNode.connections.length === 0) {
      return this.getRandomRoadNode();
    }
    const nextId = currentNode.connections[Math.floor(Math.random() * currentNode.connections.length)];
    return this.roadNodes.find(n => n.id === nextId) || this.getRandomRoadNode();
  }

  getRandomSidewalkNode() {
    if (this.sidewalkNodes.length === 0) return null;
    return this.sidewalkNodes[Math.floor(Math.random() * this.sidewalkNodes.length)];
  }

  getNextSidewalkNode(currentNode) {
    if (!currentNode || !currentNode.connections || currentNode.connections.length === 0) {
      return this.getRandomSidewalkNode();
    }
    const nextId = currentNode.connections[Math.floor(Math.random() * currentNode.connections.length)];
    return this.sidewalkNodes.find(n => n.id === nextId) || this.getRandomSidewalkNode();
  }

  getClosestSidewalkNode(x, z) {
    let closest = null;
    let minDst = Infinity;
    for (const node of this.sidewalkNodes) {
      const dst = (node.x - x) ** 2 + (node.z - z) ** 2;
      if (dst < minDst) {
        minDst = dst;
        closest = node;
      }
    }
    return closest || this.getRandomSidewalkNode();
  }
}
