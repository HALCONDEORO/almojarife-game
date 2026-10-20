// Adapted from gen-city, MIT, Copyright (c) 2023 Nikita Galadiy. See LICENSE and PROVENANCE.md.
import { Path } from './path.mjs';
import { NodeType } from './types.mjs';
export class Node {
    position;
    id;
    outputPaths = [];
    inputPaths = [];
    constructor(id, position) {
        this.id = id;
        this.position = position;
    }
    addOutputPath(direction) {
        const path = new Path(this, direction);
        this.outputPaths.push(path);
        return path;
    }
    removeOutputPath(path) {
        const index = this.outputPaths.indexOf(path);
        if (index !== -1) {
            this.outputPaths.splice(index, 1);
        }
    }
    getOutputPaths() {
        return this.outputPaths;
    }
    addInputPath(path) {
        const existNode = path.getNodeEnd();
        if (existNode) {
            existNode.removeInputPath(path);
        }
        this.inputPaths.push(path);
    }
    removeInputPath(path) {
        const index = this.inputPaths.indexOf(path);
        if (index !== -1) {
            this.inputPaths.splice(index, 1);
        }
    }
    getInputPaths() {
        return this.inputPaths;
    }
    getAllPaths() {
        return this.outputPaths.concat(this.inputPaths);
    }
    getType() {
        const pathsCount = this.outputPaths.length + this.inputPaths.length;
        if (pathsCount === 2) {
            return NodeType.TURN;
        }
        if (pathsCount === 1) {
            return NodeType.END;
        }
        return NodeType.CROSS;
    }
}
