const canvasTarget = document.querySelector("#target");
const ctx = canvasTarget.getContext("2d");

function drawRect(fillStyle = "red", position, size) {
  ctx.fillStyle = fillStyle || "red";
  const { x, y } = position || {};
  const { width, height } = size || {};
  ctx.fillRect(x, y, width, height);
}

function drawText(text, options) {
  const { font, x, y } = options || {};
  if (font) {
    ctx.font = font;
  }
  ctx.fillText(text, x, y);
}

function drawLink(text, options) {
  const { fillStyle } = options || {};
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
  }

  drawText(text, options);
  return getMetricsWidth(text);
}

function getMetricsWidth(text) {
  const textMetrics = ctx.measureText(text);
  return (
    Math.abs(textMetrics.actualBoundingBoxLeft) +
    Math.abs(textMetrics.actualBoundingBoxRight)
  );
}

function drawStrokeRect(strokeStyle = "red", position, size) {
  ctx.strokeStyle = strokeStyle || "red";
  const { x, y } = position || {};
  const { width, height } = size || {};
  ctx.strokeRect(x, y, width, height);
}

function genLinearGradient(position, colors = []) {
  const [x0, y0, x1, y1] = position;
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

  // Add three color stops
  colors.forEach((color) => {
    gradient.addColorStop(color.offset, color.value);
  });
  return gradient;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSize(min, max) {
  return getRandomInt(min, max);
}

// Init Canvas Event
let isMouseOverText = false;
let defaultBrushColor = "cyan";
const colorContainer = document.querySelector(".color-container");
const btns = colorContainer.querySelectorAll("button.btn");
for (const btn of btns) {
  if (btn.getAttribute("data-color") === defaultBrushColor) {
    btn.classList.add("current");
    break;
  }
}

const painter = new Paint(canvasTarget);
painter.updateLineColor(defaultBrushColor);
painter.init();

EventUtil.addHandler(painter.canvas, "mousedown", function (e) {
  if (painter.isDrawingMode) {
    painter.startDraw(e);
  } else {
    painter.startErase(e);
  }
});

EventUtil.addHandler(painter.canvas, "mouseup", painter.endDraw.bind(painter));

EventUtil.addHandler(painter.canvas, "mouseout", painter.endDraw.bind(painter));

EventUtil.addHandler(painter.canvas, "mousemove", function (e) {
  if (painter.isDrawingMode) {
    painter.draw(e);
  } else {
    painter.ease(e);
  }
});

function updateLineColor(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type || target.type !== "button") {
    return;
  }
  const color = target.getAttribute("data-color");

  for (const btn of btns) {
    btn.classList.remove("current");
  }
  target.classList.add("current");
  painter.updateLineColor(color);
}

EventUtil.addHandler(colorContainer, "click", updateLineColor);

function redo(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type || target.type !== "button") {
    return;
  }

  painter.redo();
}
EventUtil.addHandler(document.querySelector(".redo"), "click", redo);

function undo(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type || target.type !== "button") {
    return;
  }
  painter.undo();
}
EventUtil.addHandler(document.querySelector(".undo"), "click", undo);

EventUtil.addHandler(document.querySelector(".clear"), "click", function (e) {
  painter.clear();
});

EventUtil.addHandler(document.querySelector(".replay"), "click", (e) =>
  painter.redrawAll()
);

function getRamdomDash() {
  return [getRandomInt(3, 8), getRandomInt(13, 18)];
}
function updateLineDash(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type) {
    return;
  }

  const dash = target.getAttribute("data-lineDash") || getRamdomDash();
  painter.updateLineDash(dash);
}
EventUtil.addHandler(
  document.querySelector(".lineDash"),
  "click",
  updateLineDash
);

function getRandomDashOffset() {
  return getRandomInt(-5, 5);
}

function updateLineDashOffset(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type) {
    return;
  }

  var unit = [
    target.getAttribute("data-lineGap"),
    target.getAttribute("data-lineLen"),
  ];
  painter.updateLineDashOffset(unit);
}
EventUtil.addHandler(
  document.querySelector(".lineDashOffset"),
  "click",
  updateLineDashOffset
);

function getRandomCap() {
  const caps = ["butt", "round", "square"];
  return caps[Math.floor(Math.random() * caps.length)];
}

function updateLineCap(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type) {
    return;
  }
  const lineCap = target.getAttribute("data-lineCap") || getRandomCap();
  painter.updateLineCap(lineCap);
}
EventUtil.addHandler(
  document.querySelector(".lineCap"),
  "click",
  updateLineCap
);

function updateLineWidth(e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type) {
    return;
  }
  const lineWidth =
    target.getAttribute("data-lineWidth") || getRandomSize(1, 15);
  painter.updateLineSize(lineWidth);
}
EventUtil.addHandler(
  document.querySelector(".lineWidth"),
  "click",
  updateLineWidth
);

EventUtil.addHandler(document.querySelector(".lock"), "click", () => {
  painter.toggleLockCanvas();
});
EventUtil.addHandler(document.querySelector(".eraser"), "click", () => {
  painter.changeMode();
});
EventUtil.addHandler(document.querySelector(".save"), "click", function (e) {
  const event = EventUtil.getEvent(e);
  const target = EventUtil.getTarget(event);
  if (!target.type) {
    return;
  }
  const src = painter.ctx.canvas.toDataURL();
  target.download = "snapshot-" + new Date().valueOf() + ".png";
  target.href = src;
});
EventUtil.addHandler(
  document.querySelector(".drawHouse"),
  "click",
  function (e) {
    painter.drawHouse();
  }
);
