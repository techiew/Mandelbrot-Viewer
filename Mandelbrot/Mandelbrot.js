
// Screen edge coords
let x1Pos = -3;
let x2Pos = 2;
let y1Pos = 2;
let y2Pos = -2;

let workers = [];
let needToDraw = true;
let maxIterations = 1000;
let zoomSpeed = 0.1;

function setup() {
    createCanvas(windowWidth, windowHeight);
    clearBackground();

    if(window.Worker) {

        for(let i = 0; i < 4; i++) {
            workers.push(new Worker("Mandelbrot/Worker.js"));
            workers[i].addEventListener("message", onWorkerMessage);
        }

    }

}

function draw() {

    if(needToDraw) {

        for(let i = 0; i < workers.length; i++) {
            let startRow = windowHeight / workers.length * i;
            let endRow = windowHeight / workers.length * (i + 1);

            if(window.Worker) {
                workers[i].postMessage({
                        "x1Pos": x1Pos,
                        "x2Pos": x2Pos,
                        "y1Pos": y1Pos,
                        "y2Pos": y2Pos,
                        "width": windowWidth,
                        "height": windowHeight,
                        "startRow": startRow,
                        "endRow": endRow,
                        "iterations": maxIterations
                    });
            }

        }

        needToDraw = false;
    }

}

function onWorkerMessage(e) {
    let data = e.data;

    for(let i = 0; i < data.length; i++) {

        for(let x = 0; x < windowWidth; x++) {
            let pixel = (x + data[i].rowIndex * width) * 4;
            pixels[pixel + 0] = data[i].rowPixels[x * 4 + 0];
            pixels[pixel + 1] = data[i].rowPixels[x * 4 + 1];
            pixels[pixel + 2] = data[i].rowPixels[x * 4 + 2];
            pixels[pixel + 3] = data[i].rowPixels[x * 4 + 3];
        }

    }

    updatePixels();
}

function requestDraw() {
    clearBackground();
    needToDraw = true;
}

function smoothPass() {
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
}

function clearBackground() {
    loadPixels();

    for(let i = 0; i < pixels.length; i++) {
        let pixel = i * 4;
        pixels[pixel + 0] = 10;
        pixels[pixel + 1] = 10;
        pixels[pixel + 2] = 20;
        pixels[pixel + 3] = 255;
    }

    updatePixels();
}

function mousePressed() {
    if(mouseButton != LEFT) return;

    let centerX = map(width / 2, 0, width, x1Pos, x2Pos);
    let centerY = map(height / 2, 0, height, y1Pos, y2Pos);
    let mouseOffsetX = map(mouseX, 0, width, x1Pos, x2Pos);
    let mouseOffsetY = map(mouseY, 0, height, y1Pos, y2Pos);
    x1Pos += mouseOffsetX - centerX;
    x2Pos += mouseOffsetX - centerX;
    y1Pos += mouseOffsetY - centerY;
    y2Pos += mouseOffsetY - centerY;

    requestDraw();

    //smoothPass();
    return false;
}

function mouseWheel(event) {
    let centerX = map(width / 2, 0, width, x1Pos, x2Pos);
    let centerY = map(height / 2, 0, height, y1Pos, y2Pos);

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

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    requestDraw();
}
