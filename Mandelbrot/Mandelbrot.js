"use strict";

// Screen edge coords
let x1Pos = -2.3;
let x2Pos = 1.3;
let y1Pos = 1.3;
let y2Pos = -1.3;

let workers = [];
let numWorkers = 4; // More than 4 can cause bad performance because of too many worker messages
let needToDraw = true;
let framesWaited = 999;
let maxIterations = 500;
let color1 = "#FF00FF";
let zoomSpeed = 0.15;

let ui;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noSmooth();
    pixelDensity(1);
    ui = QuickSettings.create(50, 50, "Options");
    ui.addHTML("Tips", "<div> <ul style='padding-left: 17px; margin-top: 5px;'> <li>Left click to move around</li> <li>Mouse wheel to zoom</li> <li>Right click to save/view image</li> <li>Increase max iterations for more detail</li> <li>Press Z to hide this menu</li> </ul> </div>");
    ui.addNumber("Max Iterations", 0, 999999999999999999, maxIterations, 500, maxIterationsChanged);
    ui.addColor("Color", color1, colorChanged);
    //ui.addRange("Num Workers", 1, 16, numWorkers, 1, onNumWorkersChanged);
    ui.addRange("Zoom Speed", 0.01, 0.99, zoomSpeed, 0.01, onZoomSpeedChanged);
    ui.addButton("Reset Zoom", onResetZoom);
    requestDraw();
}

function draw() {

    // We only draw when there has been a change.
    // Also wait some frames before we start the workers to avoid spawning too many too fast.
    if(needToDraw && framesWaited > 30) {
        let workload = [];
        let workerIndex = 0;

        for(let y = 0; y < height; y++) {

            if(workload[workerIndex] === undefined) {
                workload[workerIndex] = [];
            }

            workload[workerIndex].push(y);
            workerIndex++;

            if(workerIndex + 1 > workers.length) {
                workerIndex = 0;
            }

        }

        for(let i = 0; i < workers.length; i++) {
            let temp = color(color1);

            if(window.Worker) {
                workers[i].postMessage([
                        workload[i],
                        x1Pos,
                        x2Pos,
                        y1Pos,
                        y2Pos,
                        width,
                        height,
                        maxIterations,
                        [red(temp) / 255, green(temp) / 255, blue(temp) / 255]
                    ]);
            }

        }

        needToDraw = false;
    }

    framesWaited++;
}

// This is used to terminate WebWorkers that are currently running,
// cancelling their current task, and then recreating those workers
// to be used for a new task.
function respawnWorkers() {

    if(window.Worker) {

        for(let i = 0; i < workers.length; i++) {

            if(workers[i] !== undefined) {
                workers[i].terminate();
            }

        }

        workers = [];

        for(let i = 0; i < numWorkers; i++) {
            workers[i] = new Worker("Mandelbrot/Worker.js");
            workers[i].onmessage = onWorkerMessage;
        }

    }

}

// Receives the calculated pixels from the WebWorkers
function onWorkerMessage(e) {
    let buffer = e.data;

    for(let i = 0; i < buffer.length; i++) {

        for(let x = 0; x < width; x++) {
            let pixel = (buffer[i][0] * width + x) * 4;
            pixels[pixel + 0] = buffer[i][1][x * 4 + 0];
            pixels[pixel + 1] = buffer[i][1][x * 4 + 1];
            pixels[pixel + 2] = buffer[i][1][x * 4 + 2];
            pixels[pixel + 3] = buffer[i][1][x * 4 + 3];
        }

    }

    updatePixels();
}

// Called whenever we need to redraw the canvas
function requestDraw() {
    background(0, 0, 0, 255);
    drawLowResPreview();
    loadPixels();
    respawnWorkers();
    needToDraw = true;
    framesWaited = 0;
}

// Generates a low resolution version of the fractal to be used as a quick preview.
function drawLowResPreview() {
    let temp = color(color1);
    temp = [red(temp) / 255, green(temp) / 255, blue(temp) / 255];

    let lowResData = drawingContext.createImageData(width / 15, height / 15);

    for(let y = 0; y < lowResData.height; y++) {
        let rowPixels = mandelbrot(y, x1Pos, x2Pos, y1Pos, y2Pos, lowResData.width, lowResData.height, maxIterations * 0.5, temp);

        for(let x = 0; x < lowResData.width; x++) {
            let pixel = (y * lowResData.width + x) * 4;
            lowResData.data[pixel + 0] = rowPixels[x * 4 + 0];
            lowResData.data[pixel + 1] = rowPixels[x * 4 + 1];
            lowResData.data[pixel + 2] = rowPixels[x * 4 + 2];
            lowResData.data[pixel + 3] = rowPixels[x * 4 + 3];
        }

    }

    // This is a workaround to stretch and display the low res version over the entire canvas
    // p5's image() function heavily blurs the image when you use it to stretch so I had to find something else
    let newCanvas = document.createElement("canvas");
    newCanvas.width = lowResData.width;
    newCanvas.height = lowResData.height;
    newCanvas.getContext("2d").putImageData(lowResData, 0, 0);
    drawingContext.drawImage(newCanvas, 0, 0, width, height);
    newCanvas.remove();
}

/*
* A copy of the Mandelbrot function found in the worker code,
* we could use importScripts() in the workers to avoid having a copy of this function,
* but constantly importing scripts could slow the workers down.
* In this file we use it to generate the low resolution preview.
*/
function mandelbrot(y, x1Pos, x2Pos, y1Pos, y2Pos, width, height, maxIterations, color1) {
    let pixels = [];

    for(let x = 0; x < width; x++) {

        // Map the current x and y coords in the window to a reasonable range for the Mandelbrot set
        let a = map(x, 0, width, x1Pos, x2Pos);
        let b = map(y, 0, height, y1Pos, y2Pos);

        // Set up the complex numbers that we need
        // [real, imaginary]
        let c = [a, b];
        let z = [0, 0];

        let iterations = 0;
        let colorIntensity = 0;

        for(; iterations < maxIterations; iterations++) {
            z = [z[0] * z[0] - z[1] * z[1], 2 * z[0] * z[1]];
            z = [z[0] + c[0], z[1] + c[1]];

            // This checks the absolute value of the complex number z
            // If it's higher than 2 then that means the sequence will escape and we stop
            if(Math.sqrt(z[0] * z[0] + z[1] * z[1]) > 2) {
                // The following code decides how each pixel should be colored, based on how long it took to escape (number of iterations)
                // I found this on the internet somewhere cause I suck at math, this equation somehow makes the coloring more smooth
                colorIntensity = iterations + 1 - Math.log(Math.log(Math.abs(z[0] * z[0] + z[1] * z[1]))) / Math.log(2);
                colorIntensity = 255 * iterations / maxIterations;
                colorIntensity = colorIntensity * (colorIntensity / 10); // Creates bigger contrast
                break;
            }

        }

        let modifier = map(iterations, 0, maxIterations, 0, 1);
        let color = [lerp(color1[0], 1.0, modifier), lerp(color1[1], 1.0, modifier), lerp(color1[2], 1.0, modifier)];

        // Here we set the actual colors for each pixel on the row
        let pixel = x * 4;
        pixels[pixel + 0] = colorIntensity * color[0]; // red
        pixels[pixel + 1] = colorIntensity * color[1]; // green
        pixels[pixel + 2] = colorIntensity * color[2]; // blue
        pixels[pixel + 3] = 255; // alpha
    }

    return pixels;
}

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

    if(keyCode === 90) { // Z on keyboard
        ui.toggleVisibility();
    }

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    requestDraw();
}
