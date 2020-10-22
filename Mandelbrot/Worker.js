"use strict";

let buffer = [];

onmessage = function(e) {
    let j = e.data;
    let order = j[0];
    let x1Pos = j[1];
    let x2Pos = j[2];
    let y1Pos = j[3];
    let y2Pos = j[4];
    let width = j[5];
    let height = j[6];
    let maxIterations = j[7];
    let color1 = j[8];
    calculateMandelbrot(order, x1Pos, x2Pos, y1Pos, y2Pos, width, height, maxIterations, color1);
}

function calculateMandelbrot(order, x1Pos, x2Pos, y1Pos, y2Pos, width, height, maxIterations, color1) {
    let date = new Date();
    let startTime = date.getTime();

    for(let row = 0; row < order.length; row++) {
        let rowPixels = [];
        let y = order[row];

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
                z = mandelbrot(z, c);

                // This checks the absolute value of the complex number z
                // If it's higher than 2 then that means the sequence will escape and we just stop
                if(Math.sqrt(z[0] * z[0] + z[1] * z[1]) > 2) {
                    // The following code decides how each pixel should be colored, based on how long it took to escape (number of iterations)
                    // I found this on the internet somewhere cause I suck at math, this equation makes the coloring more smooth
                    colorIntensity = iterations + 1 - Math.log(Math.log(Math.abs(z[0] * z[0] + z[1] * z[1]))) / Math.log(2);
                    colorIntensity = 255 * iterations / maxIterations;
                    colorIntensity = colorIntensity * (colorIntensity / 10); // Creates bigger contrast
                    break;
                }

            }

            let modifier = map(iterations, 0, maxIterations, 0, 1);
            let color = [lerp(color1[0], 1.0, modifier), lerp(color1[1], 1.0, modifier), lerp(color1[2], 1.0, modifier)];

            // Here we set the actual colors for each pixel on the canvas
            let pixel = x * 4
            rowPixels[pixel + 0] = colorIntensity * color[0] // red
            rowPixels[pixel + 1] = colorIntensity * color[1]; // green
            rowPixels[pixel + 2] = colorIntensity * color[2]; // blue
            rowPixels[pixel + 3] = 255; // alpha
        }

        onRowCompleted(y, rowPixels);

        if(row % 4 == 0) {
            sendData();
        }

    }

    sendData();
    date = new Date()
    console.log("Chunk complete in: " + (date.getTime() - startTime) + "ms");
}

// f(z) = z² + c
function mandelbrot(z, c) {
    // Square z
    // z = z.real * z.real - z.imaginary, 2 * z.real * z.imaginary
    z = [z[0] * z[0] - z[1] * z[1], 2 * z[0] * z[1]];
    // Add z with c
    // z = z.real + c.real, z.imaginary + c.imaginary
    z = [z[0] + c[0], z[1] + c[1]];
    return z;
}

function demonbrot(z, c) {
    // Square z
    //z.real = z.real * z.real - z.imaginary * z.imaginary;
    //z.imaginary = 2 * z.real * z.imaginary;
    // Add z with c
    //z.real = z.real + c.real,
    //z.imaginary = z.imaginary + c.imaginary;
}

// Store pixeldata for rows in a buffer so we can send the data in batches,
// because WebWorkers don't like sending messages too fast.
function onRowCompleted(rowIndex, rowPixels) {
    buffer.push([rowIndex, rowPixels]);
}

function sendData() {
    postMessage(buffer);
    buffer = [];
}

// Linear interpolation
function lerp(value1, value2, percent) {
    return value1 * (1 - percent) + value2 * percent;
}

function map(number, fromMin, fromMax, toMin, toMax) {
    return (number - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}
