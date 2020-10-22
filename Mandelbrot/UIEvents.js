
function maxIterationsChanged(value) {
    maxIterations = value;
    requestDraw();
}

function colorChanged(value) {
    color1 = value;
    requestDraw();
}

function onNumWorkersChanged(value) {
    numWorkers = value;
}

function onZoomSpeedChanged(value) {
    zoomSpeed = value;
}

function onResetZoom(value) {
    x1Pos = -2.3;
    x2Pos = 1.3;
    y1Pos = 1.3;
    y2Pos = -1.3;
    maxIterations = 1000;
    ui.setValue("Max Iterations", 1000);
    requestDraw();
}
