"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const electron_store_1 = __importDefault(require("electron-store"));
const store = new electron_store_1.default();
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    electron_1.app.quit();
}
// Hot reload
try {
    require("electron-reloader")(module);
}
catch (_) { }
let win = null;
let alredyInit = false;
let TIMELIMIT = +store.get("time_limit");
if (!TIMELIMIT) {
    TIMELIMIT = 2701;
    store.set("time_limit", TIMELIMIT);
}
let SNOOZELIMIT = 601;
let timeLimit = TIMELIMIT;
let timeLeft = timeLimit;
let timerInterval = null;
const createWindow = () => {
    win = new electron_1.BrowserWindow({
        width: 1080,
        height: 720,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    win.loadFile(node_path_1.default.join(__dirname, "/pages/main_page/main.html"));
    win.webContents.openDevTools();
    win.on("closed", () => {
        win = null;
    });
    const startTimer = () => {
        if (!timerInterval) {
            timerInterval = null;
        }
        sendToRenderer("update-timer", [timeLeft, timeLimit]);
        if (timeLeft > 0) {
            sendToRenderer("render-buttons", true);
        }
        else {
            sendToRenderer("render-buttons", false);
        }
        if (!alredyInit) {
            alredyInit = true;
            timerInterval = new Interval(() => {
                timeLeft -= 0.01;
                if (timeLeft < 1) {
                    sendToRenderer("update-timer", [0, timeLimit]);
                    sendToRenderer("render-buttons", false);
                    timeLeft = 0;
                    timerInterval.stop();
                }
                else {
                    sendToRenderer("update-timer", [timeLeft, timeLimit]);
                }
            }, 10);
            timerInterval.run();
        }
    };
    const restartTimer = (t) => {
        if (timerInterval) {
            timerInterval.stop();
            timerInterval = null;
            alredyInit = false;
        }
        timeLeft = t;
        timeLimit = t;
        startTimer();
    };
    const sendToRenderer = (event, arg) => {
        if (win) {
            win.webContents.send(event, arg);
        }
    };
    win.webContents.on("did-finish-load", () => {
        startTimer();
    });
    electron_1.ipcMain.on("load-page", (event, page) => {
        switch (page) {
            case "home":
                startTimer();
                break;
            case "settings":
                sendToRenderer("render-settings", (timeLimit - 1) / 60);
                break;
            default:
                break;
        }
    });
    electron_1.ipcMain.on("start-game", () => {
        restartTimer(TIMELIMIT);
    });
    electron_1.ipcMain.on("snooze", () => {
        restartTimer(SNOOZELIMIT);
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    // if (process.platform !== 'darwin') {
    //     app.quit();
    // }
});
const Interval = function (fn, duration, ...args) {
    const _this = this;
    this.baseline = undefined;
    this.run = function (flag) {
        if (_this.baseline === undefined) {
            _this.baseline = new Date().getTime() - duration;
        }
        if (flag) {
            fn(...args);
        }
        const end = new Date().getTime();
        _this.baseline += duration;
        let nextTick = duration - (end - _this.baseline);
        if (nextTick < 0) {
            nextTick = 0;
        }
        _this.timer = setTimeout(function () {
            _this.run(true);
        }, nextTick);
    };
    this.stop = function () {
        clearTimeout(_this.timer);
        _this.run = () => { };
    };
};
electron_1.ipcMain.on("nav-btn-click", (event, arg) => { });
electron_1.ipcMain.on("set-time-limit", (event, arg) => {
    TIMELIMIT = arg * 60 + 1;
    timeLimit = TIMELIMIT;
    store.set("time_limit", TIMELIMIT);
});
const { execSync } = require("child_process");
function getTemperature() {
    return (+execSync(`ioreg -rn AppleSmartBattery`, { encoding: "utf8" })
        .toString()
        .split("\n")[51]
        .replace(/\D/g, "") / 100);
}
function getLight() {
    return +execSync(`/Users/maytanan/Desktop/maldos/src/light_sensor/light`, { encoding: "utf8" })
        .toString()
        .replace(/\D/g, "")
        .slice(0, -6);
}
console.log("Temperature:" + getTemperature());
console.log("Light:" + getLight());
