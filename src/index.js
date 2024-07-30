"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const electron_store_1 = __importDefault(require("electron-store"));
const child_process_1 = require("child_process");
const socket_udp_1 = require("socket-udp");
const node_child_process_1 = require("node:child_process");
const socket = new socket_udp_1.UDPSocket({ port: 6969 });
const handleUDP = async () => {
    var _a, e_1, _b, _c;
    try {
        for (var _d = true, socket_1 = __asyncValues(socket), socket_1_1; socket_1_1 = await socket_1.next(), _a = socket_1_1.done, !_a; _d = true) {
            _c = socket_1_1.value;
            _d = false;
            const message = _c;
            //format = "id~score"
            let data = message.toString("utf8").split("~");
            let id = +data[0];
            let score = +data[1];
            console.log(`id: ${id} score: ${score}`);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = socket_1.return)) await _b.call(socket_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
handleUDP();
const showTimesUpNotification = () => {
    const notification = new electron_1.Notification({
        title: "Time's up!",
        body: "It's time to take a break and do some exercises.",
    });
    notification.show();
};
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    electron_1.app.quit();
}
// Hot reload
try {
    require("electron-reloader")(module);
}
catch (_) { }
const store = new electron_store_1.default();
let win = null;
let alreadyInit = false;
let TIMELIMIT = +store.get("time_limit");
if (!TIMELIMIT) {
    TIMELIMIT = 2701;
    store.set("time_limit", TIMELIMIT);
}
let soundLevel = 60;
let temperature = getTemperature();
let lightLevel = getLight();
let SNOOZELIMIT = 601;
let timeLimit = TIMELIMIT;
let timeLeft = timeLimit;
let timerInterval = null;
let alreadyPlayedGame = false;
const createWindow = () => {
    win = new electron_1.BrowserWindow({
        width: 1080,
        height: 720,
        icon: node_path_1.default.join(__dirname, "/pages/assets/maldos.ico"),
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: node_path_1.default.join(__dirname, "preload.js"),
        },
    });
    win.loadFile(node_path_1.default.join(__dirname, "/pages/main_page/main.html"));
    // win.webContents.openDevTools({ mode: "detach" });
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
            showTimesUpNotification();
        }
        if (!alreadyInit) {
            alreadyInit = true;
            timerInterval = new Interval(() => {
                timeLeft -= 0.01;
                if (timeLeft < 1) {
                    sendToRenderer("update-timer", [0, timeLimit]);
                    sendToRenderer("render-buttons", false);
                    showTimesUpNotification();
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
            alreadyInit = false;
        }
        timeLeft = t;
        timeLimit = t;
        startTimer();
    };
    function startGame() {
        (0, node_child_process_1.spawn)("python", ["/Users/maytanan/Desktop/maldos/src/game/maldos_client.py"]);
        // exec("python /Users/maytanan/Desktop/maldos/src/game/maldos_client.py");
    }
    const sendToRenderer = (event, arg) => {
        if (win) {
            win.webContents.send(event, arg);
        }
    };
    win.webContents.on("did-finish-load", async () => {
        startTimer();
        let envInterval = new Interval(async () => {
            soundLevel = await getSound();
            temperature = getTemperature();
            lightLevel = getLight();
            sendToRenderer("update-env", [temperature, lightLevel, soundLevel]);
        }, 2000);
        envInterval.run();
    });
    electron_1.ipcMain.on("load-page", (event, page) => {
        switch (page) {
            case "home":
                startTimer();
                break;
            case "settings":
                sendToRenderer("render-settings", (timeLimit - 1) / 60);
                break;
            case "statistics":
                if (alreadyPlayedGame) {
                    sendToRenderer("yellow", true);
                }
                break;
            default:
                break;
        }
    });
    electron_1.ipcMain.on("quit", () => {
        electron_1.app.quit();
    });
    electron_1.ipcMain.on("start-game", () => {
        sendToRenderer("show-warning", true);
    });
    electron_1.ipcMain.on("spawn-game-process", () => {
        startGame();
        sendToRenderer("show-loading", true);
        restartTimer(TIMELIMIT);
        alreadyPlayedGame = true;
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
electron_1.app.on("window-all-closed", () => { });
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
electron_1.ipcMain.on("set-time-limit", (event, arg) => {
    TIMELIMIT = arg * 60 + 1;
    timeLimit = TIMELIMIT;
    store.set("time_limit", TIMELIMIT);
});
function getTemperature() {
    // return Math.round(
    // 	+execSync(`ioreg -rn AppleSmartBattery`, { encoding: "utf8" })
    // 		.toString()
    // 		.split("\n")[50]
    // 		.replace(/\D/g, "") / 100
    // );
    return 30;
}
function getLight() {
    return +(0, child_process_1.execSync)(`/Users/maytanan/Desktop/maldos/src/light_sensor/light`, { encoding: "utf8" })
        .toString()
        .replace(/\D/g, "");
}
async function getSound() {
    return new Promise((resolve) => {
        (0, child_process_1.exec)("python /Users/maytanan/Desktop/maldos/src/sound_sensor/sound.py", (err, stdout, stderr) => {
            resolve(+stdout.toString().replace(/\D/g, ""));
        });
    });
}
console.log("Temperature:" + getTemperature());
console.log("Light:" + getLight());
// getSound().then((value) => {
// 	console.log("Sound:" + value);
// });
