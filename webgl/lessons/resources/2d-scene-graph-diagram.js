"use strict";

function renderSceneGraph(root) {
  updateCSSIfInIFrame();

  var canvas = document.getElementById("c");
  var ctx = wrapCanvasRenderingContext2D(canvas.getContext("2d"));
  var g_update = true;

  var getAbsolutePosition = function(element) {
    var r = { x: element.offsetLeft, y: element.offsetTop };
    if (element.offsetParent) {
      var tmp = getAbsolutePosition(element.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  };

  /**
   * Gets the relative coordinates for an event
   * @func
   * @param {HTMLElement} reference html elemetn to reference
   * @param {Event} event from HTML mouse event
   * @returns {module:Input.Coordinate} the relative position
   * @memberOf module:Input
   */
  var getRelativeCoordinates = function(reference, event) {
    // Use absolute coordinates
    var pos = getAbsolutePosition(reference);
    var x = event.pageX - pos.x;
    var y = event.pageY - pos.y;
    return { x: x, y: y };
  };

    var pointers = {
    };

    var setPointer = function(id, pos, pressed) {
      var pointer = pointers[id];
      if (!pointer) {
        pointer = { };
        pointers[id] = pointer;
      }
      pointer.pos = pos;
      if (pressed) {
        pointer.pressed = true;
      }
    };

    var clearPointer = function(id, pos) {
      var pointer = pointers[id];
      if (!pointer) {
        pointer = { };
        pointers[id] = pointer;
      }
      pointer.pos = pos;
      pointer.pressed = false;
    };
    canvas.addEventListener('pointerdown', function(e) {
      var pos = getRelativeCoordinates(e.target, e);
      setPointer(e.pointerId, pos, true);
      g_update = true;
    }, true);

    canvas.addEventListener('pointermove', function(e) {
      var pos = getRelativeCoordinates(e.target, e);
      setPointer(e.pointerId, pos);
      g_update = true;
    }, false);

    canvas.addEventListener('pointerup', function(e) {
      var pos = getRelativeCoordinates(e.target, e);
      clearPointer(e.pointerId, pos);
      g_update = true;
    }, false);


  var canvas = document.getElementById("c");
  var ctx = wrapCanvasRenderingContext2D(canvas.getContext("2d"));

  function inRect(ctx, width, height, x, y) {
    x = x || 0;
    y = y || 0;
    var inv = ctx.currentTransform.duplicate();
    inv.invert();
//    ctx.save();
//      ctx.strokeStyle = "#0F0";
//      ctx.strokeRect(x, y, width, height);
//    ctx.restore();
    for (var id in pointers) {
      if (pointers.hasOwnProperty(id)) {
        var p = pointers[id];
        if (p.pressed) {
          var pnt = inv.transformPoint(p.pos.x, p.pos.y);
          if (pnt[0] >= x && pnt[0] < x + width &&
              pnt[1] >= y && pnt[1] < y + height) {
            return {
              x: (pnt[0] - x) / width,
              y: (pnt[1] - y) / height,
              pointer: p,
            };
          }
        }
      }
    }
  }

  var borderSize = 10;
  var height = 30;
  var somethingPressed;

  function drawArrow(node, parent) {
    ctx.save();
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    var mat = ctx.currentTransform.duplicate();
    ctx.restore();
    var inv = ctx.currentTransform.duplicate();
    inv.invert();
    inv.multiply(mat);

    ctx.save();
    if (node.draw !== false && parent && parent.draw !== false) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(inv.m[4], inv.m[5]);
      ctx.stroke();
    }
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    node.children.forEach(function(child) {
      drawArrow(child, node);
    });
    ctx.restore();
  }

  function drawNode(node) {
    ctx.save();
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    var tm = ctx.measureText(node.name);
    var rx = -tm.width / 2 - borderSize;
    var ry = -height / 2;
    var width = tm.width + borderSize * 2;
    if (node.draw !== false) {
      ctx.fillStyle = node.pressed ? "#F0F" : "#0FF";
      ctx.strokeStyle = "black";
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);
      ctx.fillStyle = "black";
      ctx.strokeStyle = "black";
      ctx.fillText(node.name, 0, 1);
    } else {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, 5);
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, -5);
      ctx.stroke();
    }
    node.children.forEach(drawNode);

    // Check UI stuff after children since children get
    // drawn last they appear in front.
    if (node.pressed) {
      if (node.pressed.pointer.pressed) {
        var diff = node.pressed.pointer.pos.x - node.startX;
        node.rotation = node.startRot - diff * 0.01;
      } else {
        somethingPressed = false;
        node.pressed = null;
      }
    } else if (!somethingPressed) {
      if (node.draw !== false) {
        node.pressed = inRect(ctx, width, height, rx, ry);
        if (node.pressed) {
          somethingPressed = node;
          node.startRot = node.rotation;
          node.startX   = node.pressed.pointer.pos.x;
        }
      }
    }


    ctx.restore();
  }

  function drawScene() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(ctx.canvas.width / 2, 40);
    drawArrow(root);
    drawNode(root);
    ctx.restore();
  }

  function render() {
    if (g_update) {
      g_update = false;
      drawScene();
    }

    requestAnimationFrame(render, canvas);
  }
  render();
}


