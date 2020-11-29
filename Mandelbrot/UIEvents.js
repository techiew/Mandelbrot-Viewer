
function maxIterationsChanged(value) {
    let regEx = /[a-zA-Z]/g;

    if(regEx.test(value)) {
        return;
    }

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
    x1Pos = -2.8;
    x2Pos = 2.2;
    y1Pos = 1.2;
    y2Pos = -1.2;
    maxIterations = 500;
    ui.setValue("Max Iterations", 500);
    requestDraw();
}
