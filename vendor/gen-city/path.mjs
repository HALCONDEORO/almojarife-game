// Adapted from gen-city, MIT, Copyright (c) 2023 Nikita Galadiy. See LICENSE and PROVENANCE.md.
import { Building } from './building.mjs';
import { getShift } from './utils.mjs';
export class Path {
    direction;
    buildings = [];
    nodeBeg;
    nodeEnd = null;
    cursor;
    constructor(node, direction) {
        this.direction = direction;
        this.nodeBeg = node;
        this.cursor = node.position;
    }
    getBuildings() {
        return this.buildings;
    }
    getPositions() {
        return {
            beg: this.nodeBeg.position,
            end: this.nodeEnd?.position ?? this.cursor,
        };
    }
    isCompleted() {
        return Boolean(this.nodeEnd);
    }
    getNextCursor() {
        const shift = getShift(this.direction);
        return {
            x: this.cursor.x + shift.x,
            y: this.cursor.y + shift.y,
        };
    }
    getCursor() {
        return this.cursor;
    }
    setCursor(position) {
        this.cursor = position;
    }
    getNodeBeg() {
        return this.nodeBeg;
    }
    getNodeEnd() {
        return this.nodeEnd;
    }
    setNodeEnd(node) {
        node.addInputPath(this);
        this.nodeEnd = node;
        this.cursor = node.position;
    }
    addBuilding(vertices) {
        const building = new Building(this, vertices);
        this.buildings.push(building);
        return building;
    }
    getLength() {
        const positions = this.getPositions();
        return Math.hypot(positions.beg.x - positions.end.x, positions.beg.y - positions.end.y);
    }
    remove() {
        this.nodeBeg.removeOutputPath(this);
        if (this.nodeEnd) {
            this.nodeEnd.removeInputPath(this);
        }
    }
    each(callback) {
        const shift = getShift(this.direction);
        const length = this.getLength();
        const position = { ...this.nodeBeg.position };
        for (let i = 0; i <= length; i++) {
            callback(position);
            position.x += shift.x;
            position.y += shift.y;
        }
    }
}
