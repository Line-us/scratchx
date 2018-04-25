/* Extension demonstrating a blocking command block */
/* Sayamindu Dasgupta <sayamindu@media.mit.edu>, May 2014 */

new (function() {
    var ext = this;
    var ws;
    var lastX = 1000;
    var lastY = 1000;
    var lastZ = 1000;
    var z = 1000;

    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {
      ext.disconnectLineUs();
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    // Functions for block with type 'w' will get a callback function as the
    // final argument. This should be called to indicate that the block can
    // stop waiting.
    ext.connectLineUs = function(name, callback) {
      if(! ws) {
        console.log('Connecting to Line-us: ' + name);
        ws = new WebSocket("ws://" + name + "/");
        ws.onopen = function (event) {
          console.log("Conected");
          callback();
        }
        ws.onmessage = function (event) {
            console.log(event.data);
          }
      } else {
        console.log('Line-us is already connected');
        callback();
      }
    };

    ext.disconnectLineUs = function(callback) {
      if(! ws) {
        console.log("Line-us is already disconnected");
      } else {
        console.log("Disconnecting Line-us");
        ws.close();
      }
      ws = null;
      callback();
    }

    ext.moveTo = function(unscaledX, unscaledY, callback) {
      if(! ws) {
        console.log("Line-us is not connected");
        callback();
      } else {
        scaledPosition = scaleToLineUs(unscaledX, unscaledY);
        x = Math.round(scaledPosition[0]);
        y = Math.round(scaledPosition[1]);
        if(!(x == lastX && y == lastY)) {
          console.log("Moving to: " + x + "," + y);
          ws.send("G01 X" + x + " Y" + y);
          ws.onmessage = function (event) {
            console.log("Move callback: " + event.data);
            callback();
          }
          lastX = x;
          lastY = y;
          lastZ = z;
        } else {
          callback();
        }
      }
    }

    ext.pen = function(pen, callback) {
      if(! ws) {
        console.log("Line-us is not connected");
      } else {
        console.log("Pen: " + pen);
        if(pen == "up") {
          ws.send("G01 Z1000");
          lastZ = 1000;
        } else if (pen == "down"){
          ws.send("G01 Z0");
          lastZ = 0;
        } else {
          ws.send("G01 Z" + pen);
        }
      }
      callback();
    }

    ext.home = function(callback) {
      if(! ws) {
        console.log("Line-us is not connected");
      } else {
        console.log("Home");
        ws.send("G28");
        lastX = 1000;
        lastY = 1000;
        lastZ = 1000;
      }
      callback();
    }

    ext.speed = function (speed, callback) {
      if(! ws) {
        console.log("Line-us is not connected");
        callback();
      } else {
        switch(speed) {
          case 'Slow':
            speedVal = 1;
            break;
          case 'Normal':
            speedVal = 5;
            break;
          case 'Fast':
            speedVal = 15;
            break;
          default:
            speedVal = speed;
          }
          ws.send('G94 S' + speedVal);
          ws.onmessage = function (event) {
            callback();
          }
      }
    }

    ext.sendGcode = function(gcode, callback) {
      if(! ws) {
        console.log("Line-us is not connected");
        callback();
      } else {
        ws.send(gcode);
        ws.onmessage = function (event) {
          callback();
        }
      }
    }

    scaleToLineUs = function(x, y) {
      scale = 1;
      baseScale = 2.778;
      xOut = (433 - y) * baseScale * scale;
      yOut = x * baseScale * scale;
      return [xOut, yOut];
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['w', 'Connect to Line-us %s', 'connectLineUs', 'line-us.local'],
            ['w', 'Disconnect Line-us', 'disconnectLineUs'],
            ['w', 'Pen %d.pen', 'pen', 'up'],
            ['w', 'Move to: X%n, Y%n', 'moveTo', 0, 0],
            ['w', 'Go to home position', 'home'],
            ['w', 'Set drawing speed to %d.speed', 'speed', 'Normal'],
            ['w', 'Send GCode %s', 'sendGcode', 'G01 X1000 Y1000 Z1000']
        ],
        menus: {
          pen: ['up', 'down'],
          speed: ['Slow', 'Normal', 'Fast'],
        },
        url: 'http://www.line-us.com/'
    };

    // Register the extension
    ScratchExtensions.register('Line-us', descriptor, ext);
})();
