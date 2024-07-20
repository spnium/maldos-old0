import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

// Hot reload
try {
	require("electron-reloader")(module);
} catch (_) {}

let win: any = null;
let alredyInit = false;
const TIMELIMIT = 10;
const SNOOZELIMIT = 5;
let timeLimit = TIMELIMIT;
let timeLeft = timeLimit;

let timerInterval: any = null;

const createWindow = () => {
	win = new BrowserWindow({
		width: 1080,
		height: 720,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	win.loadFile(path.join(__dirname, "/pages/main/main.html"));

	win.webContents.openDevTools();

	win.on("closed", () => {
		win = null;
	});

	const startTimer = () => {
		if (timeLeft > 0) {
			sendToRenderer("render-buttons", true);
		} else {
			sendToRenderer("render-buttons", false);
		}
		sendToRenderer("update-timer", [timeLeft, timeLimit]);
		if (!alredyInit) {
			alredyInit = true;
			timerInterval = new Interval(() => {
				timeLeft -= 0.01;
				if (timeLeft < 1) {
					sendToRenderer("update-timer", [0, timeLimit]);
					sendToRenderer("render-buttons", false);
					timeLeft = 0;
					timerInterval.stop();
				} else {
					sendToRenderer("update-timer", [timeLeft, timeLimit]);
				}
			}, 10);
			timerInterval.run();
		}
	};

	const restartTimer = (t: number) => {
		if (timerInterval) {
			timerInterval.stop();
			timerInterval = null;
			alredyInit = false;
		}
		timeLeft = t;
		timeLimit = t;
		startTimer();
	};

	const sendToRenderer = (event: string, arg: any) => {
		if (win) {
			win.webContents.send(event, arg);
		}
	};

	win.webContents.on("did-finish-load", () => {
		if (!timerInterval) {
			timerInterval = null;
		}
		startTimer();
	});

	ipcMain.on("start-game", () => {
		restartTimer(TIMELIMIT);
	});

	ipcMain.on("snooze", () => {
		restartTimer(SNOOZELIMIT);
	});
};

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	// if (process.platform !== 'darwin') {
	//     app.quit();
	// }
});

const Interval = function (this: any, fn: Function, duration: number, ...args: any): void {
	const _this = this;
	this.baseline = undefined;

	this.run = function (flag: boolean) {
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
		_this.run = () => {};
	};
} as any;

ipcMain.on("nav-btn-click", (event: any, arg: any) => {
	console.log(arg + " clicked");
});
