/**
 *
 */
class Paint {
  constructor(canvas) {
    this.x = null;
    this.y = null;
    this.linesArray = [];
    this.canvas = canvas;
    this.startDrawIds = [];
    this.revokeDrawIds = [];
    this.isDrawingMode = true;
    this.isDrawingMode = true;
    this.isErasing = false;
    this.isDrawing = false;
    this.isDisabled = false;
    // pen
    this.pen = {
      lineDash: [],
      lineDashOffset: 0.0,
      lineWidth: 5,
      lineCap: "round",
      strokeStyle: "#fd1db9",
    };
    // eraser
    this.eraser = {
      width: 30,
      lineWidth: 1,
      shape: "round",
      strokeStyle: "#00f",
    };
    this.loadTimeOffset = 20;
    this.timeoutValidity = 0;
    this.data = null;
    this.ctx = this.canvas.getContext("2d");
  }

  init() {
    // this.retinaResize();
    this.initStrokeStyle();
    // this.initCanvasEvent();
  }

  initStrokeStyle() {
    this.initPenStyle();
    this.initEraserStyle();
  }

  initPenStyle() {
    this.setLineSize(this.pen.lineWidth);
    this.setLineColor(this.pen.strokeColor);
    this.setLineCap(this.pen.lineCap);
    this.setLineDash(this.pen.lineDash);
    this.setLineDashOffset(this.pen.lineDashOffset);
  }

  initEraserStyle() {
    this.setEraserSize(this.eraser.lineWidth);
    this.setEraserColor(this.eraser.strokeStyle);
  }

  setEraserSize(size) {
    this.eraser.lineWidth = size;
  }

  setEraserColor(color) {
    this.eraser.strokeStyle = color;
  }

  dispose() {}

  getSaveData() {
    var saveData = {
      width: this.canvas.width,
      height: this.canvas.height,
      linesArray: this.linesArray,
    };
    return JSON.stringify(saveData);
  }

  loadSaveData(saveData, immediate) {
    try {
      if (typeof saveData !== "string") {
        throw new Error("saveData needs to be a stringified array!");
      }

      var data = JSON.parse(saveData);
      var linesArray = data.linesArray;
      var width = data.width;
      var height = data.height;

      if (!linesArray || typeof linesArray.push !== "function") {
        throw new Error("linesArray must be an array!");
      }

      var canvas = this.canvas;
      this.clear();

      if (width === canvas.width && height === canvas.height) {
        this.linesArray = linesArray;
      } else {
        var scaleX = canvas.width / width;
        var scaleY = canvas.height / height;
        var scaleAvg = (scaleX + scaleY) / 2;

        this.linesArray = linesArray.map(function (line) {
          return {
            // ...line,
            time: line.time,
            color: line.color,
            lineCap: line.lineCap,
            endX: line.endX * scaleX,
            endY: line.endY * scaleY,
            startX: line.startX * scaleX,
            startY: line.startY * scaleY,
            size: line.size * scaleAvg,
          };
        });
      }

      this.redraw(immediate);
    } catch (err) {
      throw err;
    }
  }

  getMousePos(e) {
    var rect = this.canvas.getBoundingClientRect();
    var clientX = e.clientX;
    var clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  redraw(points, immediate) {
    this.timeoutValidity++;
    var timeoutValidity = this.timeoutValidity;
    points.forEach((point, idx) => {
      if (!immediate) {
        setTimeout(() => {
          if (timeoutValidity === this.timeoutValidity) {
            this.drawLine(point);
          }
        }, idx * this.loadTimeOffset);
      } else {
        this.drawLine(point);
      }
    });
  }

  redrawAll(immediate) {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.redraw(this.linesArray, immediate);
  }

  redrawLast(points, immediate) {
    this.redraw(points, immediate);
  }

  redo(immediate) {
    if (this.revokeDrawIds.length > 0) {
      const points = this.revokeDrawIds.pop();
      this.linesArray.push(...points);
      this.startDrawIds.push(this.linesArray.length - points.length);
      // this.redrawAll(immediate);
      this.redrawLast(points, immediate);
      return true;
    }
    return false;
  }

  undo() {
    if (this.startDrawIds.length > 0) {
      const undoStartId = this.startDrawIds.pop();
      this.revokeDrawIds.push(this.linesArray.slice(undoStartId));
      this.linesArray.splice(undoStartId);
      this.redrawAll(true);
      return true;
    }

    return false;
  }

  drawLine(data) {
    var ctx = this.ctx;
    if (!ctx) {
      return;
    }

    var points = data.points || [];
    if (!points.length) {
      return;
    }

    this.setLineColor(data.color);
    this.setLineSize(data.size);
    this.setLineCap(data.lineCap);
    this.setLineDash(data.dash);
    this.setLineDashOffset(data.dashOffset);
    ctx.save();
    ctx.beginPath();

    var point = points[0];
    // ctx.moveTo(data.startX, data.startY);
    // ctx.lineTo(data.endX, data.endY);

    ctx.moveTo(point.x, point.y);
    for (var i = 1, len = points.length; i < len; i++) {
      point = points[i];
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  startDraw(e) {
    const style = document.body.style;
    if (this.isDisabled) {
      style.cursor = "not-allowed";
      return;
    } else {
      style.cursor = "url('./pen.png') 0 128, auto";
    }

    this.isDrawing = true;
    this.startDrawIds.push(this.linesArray.length);

    var pos = this.getMousePos(e);
    var x = pos.x;
    var y = pos.y;

    this.x = x;
    this.y = y;

    this.draw(e);
  }

  stopDraw() {
    this.isDrawing = false;
    this.isDrawingMode = true;
  }

  endDraw() {
    if (this.isDrawingMode) {
      if (this.isDrawing) {
        this.stopDraw();
      }
    } else {
      this.stopErase();
    }
    document.body.style.cursor = "auto";
  }

  draw(e) {
    if (!(this.isDrawingMode && this.isDrawing) || this.isDisabled) {
      return;
    }

    var pos = this.getMousePos(e);
    var x = pos.x;
    var y = pos.y;

    var newX = x + 1;
    var newY = y + 1;
    var time = +new Date();
    var offset = Math.floor(Math.random() * 6 + 5) * 100;

    var line = {
      dashOffset: this.pen.lineDashOffset,
      lineCap: this.pen.lineCap,
      color: this.pen.strokeColor,
      dash: this.pen.lineDash,
      size: this.pen.lineWidth,
      time: time + offset,
      startX: this.x,
      startY: this.y,
      endX: newX,
      endY: newY,
      points: [
        {
          x: this.x,
          y: this.y,
        },
        {
          x: newX,
          y: newY,
        },
      ],
    };

    this.drawLine(line);

    this.linesArray.push(line);

    // if (typeof this.onChange === 'function') {
    //     this.onChange(this.linesArray);
    // }

    this.x = newX;
    this.y = newY;
  }

  drawHouse() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    // Set line width
    ctx.lineWidth = 10;

    // Wall
    ctx.strokeRect(75, 140, 150, 110);

    // Door
    ctx.fillRect(130, 190, 40, 60);

    // Roof
    ctx.beginPath();
    ctx.moveTo(50, 140);
    ctx.lineTo(150, 60);
    ctx.lineTo(250, 140);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawEraser(loc) {
    this.ctx.save();
    this.updateEraserStyle();
    this.setEraserDrawPath(loc);
    this.ctx.stroke();
    this.ctx.restore();
  }

  changeMode() {
    this.isDrawingMode = false;
  }

  startErase(e) {
    if (this.isDisabled) {
      return;
    }

    this.isDrawing = false;
    this.isErasing = true;
    if (!this.isDrawingMode) {
      // this.ease(e);
      this.eraseLast();
    }
  }

  ease(e) {
    if (this.isDisabled) {
      return;
    }

    const loc = this.getMousePos(e);
    if (!this.isDrawingMode && this.isErasing) {
      this.eraseLast();
      this.drawEraser(loc);
    }
    this.x = loc.x;
    this.y = loc.y;
  }

  stopErase() {
    this.eraseLast();
    this.isDrawing = false;
    this.isErasing = false;
    this.isDrawingMode = true;
  }

  setEraserDrawPath(loc) {
    const { ctx, eraser } = this;
    const { shape, width } = eraser;
    const eraserWidth = parseFloat(width);

    ctx.beginPath();

    if (shape === "round") {
      ctx.arc(loc.x, loc.y, eraserWidth / 2, 0, Math.PI * 2, false);
    } else {
      ctx.rect(
        loc.x - eraserWidth / 2,
        loc.y - eraserWidth / 2,
        eraserWidth,
        eraserWidth
      );
    }

    ctx.clip();
  }

  setErasePath() {
    const { ctx, x: lastX, y: lastY, eraser } = this;
    const { lineWidth, shape, width } = eraser;
    const eraserWidth = parseFloat(width);

    ctx.beginPath();

    if (shape === "round") {
      ctx.arc(lastX, lastY, eraserWidth / 2 + lineWidth, 0, Math.PI * 2, false);
    } else {
      ctx.rect(
        lastX - eraserWidth / 2 - lineWidth,
        lastY - eraserWidth / 2 - lineWidth,
        eraserWidth + lineWidth * 2,
        eraserWidth + lineWidth * 2
      );
    }
    ctx.clip();
  }

  erasePoints() {
    this.ctx.save();
    this.setErasePath();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  eraseLast() {
    this.erasePoints();
  }

  setEraserStyle(option) {
    const { lineWidth, strokeStyle, shape, width } = option || {};
    this.eraser.shape = shape;
    this.eraser.width = width;
    this.eraser.lineWidth = lineWidth;
    this.eraser.strokeStyle = strokeStyle;
  }

  updateEraserStyle() {
    this.ctx.lineWidth = this.eraser.lineWidth;
    this.ctx.strokeStyle = this.eraser.strokeStyle;
  }

  retinaResize() {
    var canvas = this.canvas;
    var width = canvas.width;
    var height = canvas.height;
    var ratio =
      typeof window.devicePixelRatio !== "undefined"
        ? window.devicePixelRatio
        : 1;

    if (ratio > 1) {
      width *= ratio;
      height *= ratio;
    }

    this.resize(width, height);
  }

  resize(width, height) {
    var canvas = this.canvas;

    const w = Math.floor(width) || Infinity;
    const h = Math.floor(height) || Infinity;
    canvas.setAttribute("width", w);
    canvas.setAttribute("height", h);
  }

  updateLineColor(color) {
    this.pen.strokeColor = color;
  }
  setLineColor(color) {
    this.ctx.strokeStyle = color;
  }
  updateLineDashOffset(offset) {
    this.pen.lineDashOffset = offset >> 0;
  }
  setLineDashOffset(offset) {
    this.ctx.lineDashOffset = offset;
  }
  updateLineDash(dash) {
    this.pen.lineDash = dash || [];
  }
  setLineDash(segments) {
    this.ctx.setLineDash(segments);
  }
  updateLineSize(size) {
    this.pen.lineWidth = size;
  }
  setLineSize(lineWidth) {
    this.ctx.lineWidth = lineWidth;
  }
  updateLineCap(cap) {
    this.pen.lineCap = cap;
  }
  setLineCap(cap) {
    this.ctx.lineCap = cap;
  }
  setTimeOffset(num) {
    this.loadTimeOffset = parseInt(num, 10) || this.loadTimeOffset;
  }
  toggleLockCanvas() {
    this.isDisabled = !this.isDisabled;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.isDrawing = false;
    this.isDisabled = false;
    this.isErasing = false;
    this.linesArray = [];
    this.startDrawIds = [];
    this.timeoutValidity++;
  }

  restore() {
    this.ctx.putImageData(this.data, 0, 0);
  }

  save() {
    this.data = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }
}
