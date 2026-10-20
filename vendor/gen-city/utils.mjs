// Adapted from gen-city, MIT, Copyright (c) 2023 Nikita Galadiy. See LICENSE and PROVENANCE.md.
export function randomChance(value) {
    return Math.random() > 1.0 - value;
}
export function randomItem(list) {
    const r = Math.floor(Math.random() * list.length);
    return list[r];
}
export function randomRange(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
}
export function generateSeed(size = 32) {
    const seed = [];
    for (let i = 0; i < size; i++) {
        seed.push(Math.round(Math.random() * 1000));
    }
    return seed;
}
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}
export function turnDirection(direction) {
    return [
        (direction + 90) % 360,
        (direction - 90) % 360,
    ];
}
export function forkDirection(direction) {
    return [direction].concat(turnDirection(direction));
}
export function getShift(direction, offset = 1) {
    return {
        x: Math.round(Math.cos(degToRad(direction))) * offset,
        y: Math.round(Math.sin(degToRad(direction))) * offset,
    };
}
export function between(value, period) {
    return value >= period[0] && value <= period[1];
}
