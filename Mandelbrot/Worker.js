
let buffer = [];

onmessage = function(e) {
    let x1Pos = e.data.x1Pos;
    let x2Pos = e.data.x2Pos;
    let y1Pos = e.data.y1Pos;
    let y2Pos = e.data.y2Pos;
    let width = e.data.width;
    let height = e.data.height;
    let startRow = e.data.startRow;
    let endRow = e.data.endRow;
    let maxIterations = e.data.maxIterations;
    calculateMandelbrot(x1Pos, x2Pos, y1Pos, y2Pos, width, height, startRow, endRow, maxIterations);
}

function calculateMandelbrot(x1Pos, x2Pos, y1Pos, y2Pos, width, height, startRow, endRow, maxIterations) {
    let numRows = endRow - startRow;
    let y = startRow;
    let count = 1;

    for(let row = 0; row < numRows; row++) {
        let rowPixels = [];

        for(let x = 0; x < width; x++) {

            // Map the x and y coords of the window to a reasonable range for the Mandelbrot set
            let a = map(x, 0, width, x1Pos, x2Pos);
            let b = map(y, 0, height, y1Pos, y2Pos);

            // Set up the complex numbers that we need
            // [real, imaginary]
            let c = [a, b];
            let z = [0, 0];

            let iterations = 0;
            let colorIntensity = 0;
            let red = 1.0;
            let green = 1.0;
            let blue = 1.0;

            for(; iterations < maxIterations; iterations++) {
                z = mandelbrot(z, c);

                // This gets the absolute value of the complex number z
                // If it's higher than 2 then this sequence will escape
                // We color it according to how long it took to escape (number of iterations)
                if(Math.sqrt(z[0] * z[0] + z[1] * z[1]) > 2) {
                    colorIntensity = colorModeNormal(z, iterations, maxIterations);
                    break;
                }

            }

            let borderColor = green;
            let outerColor = blue;
            let borderSize = 100;

            red = map(iterations, 0, maxIterations, 0, 20);
            green = map(iterations, 0, maxIterations, 0, 20);
            //blue = map(iterations, 0, maxIterations, 0, 20);

            let pixel = x * 4
            rowPixels[pixel + 0] = colorIntensity * red;
            rowPixels[pixel + 1] = colorIntensity * green;
            rowPixels[pixel + 2] = colorIntensity * blue;
            rowPixels[pixel + 3] = 255;
        }

        onRowCompleted(y, rowPixels);
        y += 10;

        if(y + 1 > endRow) {
            y = startRow + count;
            count++;
        }

        if(y % 3 == 0) {
            sendData();
        }

    }

    sendData();
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

function wolfbrot(z, c) {
    // Square z
    //z.real = z.real * z.real - z.imaginary * z.imaginary;
    //z.imaginary = 2 * z.real * z.imaginary;
    // Add z with c
    //z.real = z.real + c.real,
    //z.imaginary = z.imaginary + c.imaginary;
}

function colorModeNormal(z, iterations, maxIterations) {
    let intensity = iterations + 1 - Math.log(Math.log(Math.abs(z[0] * z[0] + z[1] * z[1]))) / Math.log(2);
    return intensity = 255 * iterations / maxIterations;
}

function colorModeWavy(z, iterations, maxIterations) {
    let intensity = iterations + 1 - Math.log(Math.log(Math.abs(z[0] * z[0] + z[1] * z[1]))) / Math.log(2);
    return intensity *= 255;
}

function onRowCompleted(rowIndex, rowPixels) {
    buffer.push({"rowIndex": rowIndex, "rowPixels": rowPixels});
}

function sendData() {
    postMessage(buffer);
    buffer = [];
}

function map(number, fromMin, fromMax, toMin, toMax) {
    return (number - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}
