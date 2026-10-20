// Adapted from gen-city, MIT, Copyright (c) 2023 Nikita Galadiy. See LICENSE and PROVENANCE.md.
export class Building {
    vertices;
    position;
    width;
    height;
    path;
    constructor(path, vertices) {
        if (vertices.length !== 4) {
            throw Error('Invalid building vertices');
        }
        this.path = path;
        this.vertices = vertices;
        const xs = this.vertices.map((position) => position.x);
        const ys = this.vertices.map((position) => position.y);
        this.position = {
            x: Math.min(...xs),
            y: Math.min(...ys),
        };
        this.width = Math.max(...xs) - this.position.x + 1;
        this.height = Math.max(...ys) - this.position.y + 1;
    }
    remove() {
        const pathBuildings = this.path.getBuildings();
        const index = pathBuildings.findIndex((building) => building === this);
        if (index !== -1) {
            pathBuildings.splice(index, 1);
        }
    }
    each(callback) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                callback({
                    x: this.position.x + x,
                    y: this.position.y + y,
                });
            }
        }
    }
}
