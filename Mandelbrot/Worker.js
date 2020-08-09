
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
    let iterations = e.data.iterations;
    calculateMandelbrot(x1Pos, x2Pos, y1Pos, y2Pos, width, height, startRow, endRow, iterations);
}

function calculateMandelbrot(x1Pos, x2Pos, y1Pos, y2Pos, width, height, startRow, endRow, iterations) {
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
            let c = {"real": a, "imaginary": b};
            let z = {"real": 0, "imaginary": 0};

            let color = 0;

            for(let i = 0; i < iterations; i++) {
                z = mandelbrot(z, c);

                // Get the absolute value of the complex number z
                // If it's higher than 2 then it will escape to infinity
                if(Math.sqrt(z.real * z.real + z.imaginary * z.imaginary) > 2) {
                    color = i;
                    break;
                }

            }

            let pixel = x * 4
            rowPixels[pixel + 0] = color * 2;
            rowPixels[pixel + 1] = 0;
            rowPixels[pixel + 2] = 0;
            rowPixels[pixel + 3] = 255;
        }

        onRowCompleted(y, rowPixels);
        y += 10;

        if(y + 1 > endRow) {
            y = startRow + count;
            count++;
        }

        if(y % 4 == 0) {
            sendData();
        }

    }

    console.log("Chunk completed");
    sendData();
}

// f(z) = z² + c
function mandelbrot(z, c) {
    // Square z
    z.real = z.real * z.real - z.imaginary * z.imaginary;
    z.imaginary = 2 * z.real * z.imaginary;
    // Add z with c
    z.real = z.real + c.real,
    z.imaginary = z.imaginary + c.imaginary;
    return z;
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
