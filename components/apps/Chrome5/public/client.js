const canvas = document.getElementById('browser');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;

const wsInput = new WebSocket("ws://localhost:8081");
const wsFrame = new WebSocket("ws://localhost:8082");
wsFrame.binaryType = "arraybuffer";

let remoteWidth = 1200;
let remoteHeight = 800;
let zoomFactor = 1.0;
let remoteMouse = { x: -10, y: -10 };

wsInput.onmessage = (msg) => {
  const packet = JSON.parse(msg.data);
  if (packet.type === 'size') {
    remoteWidth = packet.width;
    remoteHeight = packet.height;
  }
  if (packet.type === 'zoom') {
    zoomFactor = packet.factor;
  }
};

function sendMouseEvent(type, e, clickCount = 1) {
  const scaleX = remoteWidth / canvas.width / zoomFactor;
  const scaleY = remoteHeight / canvas.height / zoomFactor;

  const rx = e.offsetX * scaleX;
  const ry = e.offsetY * scaleY;
  remoteMouse = { x: rx, y: ry };

  wsInput.send(JSON.stringify({
    type: 'input',
    payload: {
      type: type,
      x: rx,
      y: ry,
      button: 'left',
      clickCount: clickCount
    }
  }));
}

canvas.addEventListener("mousedown", (e) => sendMouseEvent('mouseDown', e, 1));
canvas.addEventListener("mouseup", (e) => {
  sendMouseEvent('mouseUp', e, 1);
  sendMouseEvent('mouseDown', e, 1);
  sendMouseEvent('mouseUp', e, 1);
});
canvas.addEventListener("mousemove", (e) => sendMouseEvent('mouseMove', e, 0));

canvas.addEventListener("wheel", (e) => {
  wsInput.send(JSON.stringify({
    type: 'input',
    payload: {
      type: 'mouseWheel',
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      canScroll: true
    }
  }));
});

window.addEventListener("keydown", (e) => {
  wsInput.send(JSON.stringify({
    type: 'input',
    payload: {
      type: 'keyDown',
      keyCode: e.key
    }
  }));
});
window.addEventListener("keyup", (e) => {
  wsInput.send(JSON.stringify({
    type: 'input',
    payload: {
      type: 'keyUp',
      keyCode: e.key
    }
  }));
});
window.addEventListener("keypress", (e) => {
  wsInput.send(JSON.stringify({
    type: 'input',
    payload: {
      type: 'char',
      keyCode: e.key
    }
  }));
});

// 截图 + 鼠标渲染
wsFrame.onmessage = (msg) => {
  const blob = new Blob([msg.data], { type: 'image/png' });
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);

    if (remoteMouse.x >= 0) {
      const cx = remoteMouse.x / (remoteWidth / canvas.width / zoomFactor);
      const cy = remoteMouse.y / (remoteHeight / canvas.height / zoomFactor) - 10;  // 增加10像素偏移补偿
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();
    }
  };
};