"use strict";

// Screen edge coords
let x1Pos = -2.3;
let x2Pos = 1.3;
let y1Pos = 1.3;
let y2Pos = -1.3;

let workers = [];
let numWorkers = 4;
let needToDraw = true;
let maxIterations = 1000;
let color1 = "#FF00FF";
let zoomSpeed = 0.1;

let ui;

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
    ui = QuickSettings.create(50, 50, "Options");
    ui.addHTML("Info", "<div> <ul style='padding-left: 17px; margin-top: 5px;'> <li>Left click to move around</li> <li>Mouse wheel to zoom</li> <li>Right click to save/view image</li> <li>Increase max iterations for more detail</li> <li>Press 1 to hide this menu</li> </ul> </div>");
    ui.addNumber("Max Iterations", 0, 999999999999999999, maxIterations, 500, maxIterationsChanged);
    ui.addColor("Color", color1, colorChanged);
    ui.addRange("Num Workers", 1, 16, numWorkers, 1, onNumWorkersChanged);
    ui.addRange("Zoom Speed", 0.01, 0.99, zoomSpeed, 0.01, onZoomSpeedChanged);
    ui.addButton("Reset Zoom", onResetZoom);
    requestDraw();
}

function draw() {

    // We only draw when there has been a change.
    if(needToDraw) {
        respawnWorkers();

        for(let i = 0; i < workers.length; i++) {
            let interlacedOrder = [];
            let startRow = Math.floor(windowHeight / workers.length * i);
            let endRow = Math.floor(windowHeight / workers.length * (i + 1));
            let row = startRow;
            let count = 1;

            // This stores all the rows on the canvas in interlaced order,
            // meaning we increment by some number and add that row (y-coord) to an array,
            // untill we've gone through all of the rows on the canvas.
            // We use this so we can render in a way that more quickly gives an idea of the whole image.
            for(let y = 0; y < (endRow - startRow); y++) {
                interlacedOrder.push(row);
                row += 10;

                if(row + 1 > endRow) {
                    row = startRow + count;
                    count++;
                }

            }

            let pColor = color(color1);

            if(window.Worker) {
                workers[i].postMessage([
                        interlacedOrder,
                        x1Pos,
                        x2Pos,
                        y1Pos,
                        y2Pos,
                        windowWidth,
                        windowHeight,
                        maxIterations,
                        [red(pColor) / 255, green(pColor) / 255, blue(pColor) / 255]
                    ]);
            }

        }

        needToDraw = false;
    }

}

// This is used to terminate WebWorkers that are currently running,
// cancelling their current task, and then recreating those workers
// to be used for a new task.
function respawnWorkers() {

    if(window.Worker) {

        for(let i = 0; i < workers.length; i++) {

            if(typeof workers[i] !== "undefined") {
                workers[i].removeEventListener("message", onWorkerMessage);
                workers[i].terminate();
                workers[i] = "undefined";
            }

            workers.length = numWorkers;
        }

        for(let i = 0; i < numWorkers; i++) {
            workers[i] = new Worker("Mandelbrot/Worker.js");
            workers[i].addEventListener("message", onWorkerMessage);
        }

    }

}

function onWorkerMessage(e) {
    let data = e.data;

    for(let i = 0; i < data.length; i++) {

        for(let x = 0; x < windowWidth; x++) {
            let pixel = (x + data[i][0] * width) * 4;
            pixels[pixel + 0] = data[i][1][x * 4 + 0];
            pixels[pixel + 1] = data[i][1][x * 4 + 1];
            pixels[pixel + 2] = data[i][1][x * 4 + 2];
            pixels[pixel + 3] = data[i][1][x * 4 + 3];
        }

    }

    updatePixels();
}

function requestDraw() {
    background(10, 10, 15);
    loadPixels();
    needToDraw = true;
}

/*function smoothPass() {
    loadPixels();

    for(let i = 0; i < pixels.length / 4; i++) {
        let c1 = [0, 0, 0, 0];
        let c2 = [0, 0, 0, 0];
        let c3 = [0, 0, 0, 0];
        let c4 = [0, 0, 0, 0];
        let c5 = [0, 0, 0, 0];
        let pixel = i * 4;

        c1 = pixels.slice(pixel, pixel + 4);
        if(pixel - 4 >= 0) c2 = pixels.slice(pixel - 4, pixel);
        if(pixel + 8 <= pixels.length) c3 = pixels.slice(pixel + 4, pixel + 8);
        if(pixel + windowWidth * 4 + 4 <= pixels.length) c4 = pixels.slice(pixel + windowWidth * 4, pixel + windowWidth * 4 + 4);
        if(pixel - windowWidth * 4 >= 0) c5 = pixels.slice(pixel - windowWidth * 4, pixel - windowWidth * 4 + 4);

        let avgR = (c1[0]  + c2[0] + c3[0] + c4[0] + c5[0]) / 5;
        let avgG = (c1[1] + c2[1] + c3[1] + c4[1] + c5[1]) / 5;
        let avgB = (c1[2] + c2[2] + c3[2] + c4[2] + c5[2]) / 5;

        pixels[pixel + 0] = avgR;
        pixels[pixel + 1] = avgG;
        pixels[pixel + 2] = avgB;
        pixels[pixel + 3] = 255;
    }

    updatePixels();
}*/

function mousePressed(e) {
    if(mouseButton != LEFT) return true;

    if(e.target.tagName != "CANVAS") return true;

    let centerX = map(width / 2, 0, width, x1Pos, x2Pos);
    let centerY = map(height / 2, 0, height, y1Pos, y2Pos);
    let mouseOffsetX = map(mouseX, 0, width, x1Pos, x2Pos);
    let mouseOffsetY = map(mouseY, 0, height, y1Pos, y2Pos);
    x1Pos += mouseOffsetX - centerX;
    x2Pos += mouseOffsetX - centerX;
    y1Pos += mouseOffsetY - centerY;
    y2Pos += mouseOffsetY - centerY;

    requestDraw();
    return false;
}

function mouseWheel(e) {
    let centerX = map(width / 2, 0, width, x1Pos, x2Pos);
    let centerY = map(height / 2, 0, height, y1Pos, y2Pos);

    if(e.target.tagName != "CANVAS") return true;

    if(event.delta >= 0) {
        x1Pos += (x1Pos - centerX) * zoomSpeed;
        x2Pos += (x2Pos - centerX) * zoomSpeed;
        y1Pos += (y1Pos - centerY) * zoomSpeed;
        y2Pos += (y2Pos - centerY) * zoomSpeed;
    } else {
        x1Pos -= (x1Pos - centerX) * zoomSpeed;
        x2Pos -= (x2Pos - centerX) * zoomSpeed;
        y1Pos -= (y1Pos - centerY) * zoomSpeed;
        y2Pos -= (y2Pos - centerY) * zoomSpeed;
    }

    requestDraw();
    return false;
}

function keyPressed() {

    if(keyCode === 49) { // Number 1 on keyboard
        ui.toggleVisibility();
    }

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    requestDraw();
}
