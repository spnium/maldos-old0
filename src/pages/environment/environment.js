"use strict";
var { ipcRenderer } = require("electron");
ipcRenderer.on("update-env", (_event, arg) => {
    // let temperatureMessage = "normal";
    // if (arg[0] > 33) {
    // 	temperatureMessage = "too hot";
    // }
    // if (arg[0] < 18) {
    // 	temperatureMessage = "too cold";
    // }
    // let lightMessage = "normal";
    // if (arg[1] > 4000) {
    // 	lightMessage = "too bright";
    // }
    // if (arg[1] < 100) {
    // 	lightMessage = "too dark";
    // }
    // let soundMessage = "normal";
    // if (arg[2] > 80) {
    // 	soundMessage = "too loud";
    // }
    // if (arg[2] < 20) {
    // 	soundMessage = "quiet";
    // }
    // document.getElementById(
    // 	"temperature"
    // )!.innerHTML = `<span>Temperature : ${temperatureMessage}</span>`;
    // document.getElementById("light")!.innerHTML = `<span>Light : ${lightMessage}</span>`;
    // document.getElementById("sound")!.innerHTML = `<span>Sound : ${soundMessage}</span>`;
    document.getElementById("temperature").innerHTML = `<span>Temperature : ${arg[0] - 5}℃</span>`;
    document.getElementById("light").innerHTML = `<span>Light : ${arg[1]} lx</span>`;
    document.getElementById("sound").innerHTML = `<span>Sound : ${arg[2]} dB</span>`;
});
