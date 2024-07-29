import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import Store from "electron-store";
import { execSync, exec } from "child_process";
import { UDPSocket } from "socket-udp";
import { spawn } from "node:child_process";

const socket = new UDPSocket({ port: 6969 } as any);

const handleUDP = async () => {
	for await (const message of socket) {
		//format = "id~score"
		let data = message.toString("utf8").split("~");
		let id = +data[0];
		let score = +data[1];
		console.log(`id: ${id} score: ${score}`);
	}
};
handleUDP();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

// Hot reload
try {
	require("electron-reloader")(module);
} catch (_) {}

const store = new Store();

let win: BrowserWindow | null = null;
let alreadyInit = false;
let TIMELIMIT: number = +(store.get("time_limit") as any)!;
if (!TIMELIMIT) {
	TIMELIMIT = 2701;
	store.set("time_limit", TIMELIMIT);
}

let temperature = getTemperature();
let lightLevel = getLight();
let soundLevel = getSound();

let SNOOZELIMIT = 601;
let timeLimit = TIMELIMIT;
let timeLeft = timeLimit;

let timerInterval: any = null;

const createWindow = () => {
	win = new BrowserWindow({
		width: 1080,
		height: 720,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	win.loadFile(path.join(__dirname, "/pages/main_page/main.html"));

	win.webContents.openDevTools({ mode: "detach" });

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
		} else {
			sendToRenderer("render-buttons", false);
		}
		if (!alreadyInit) {
			alreadyInit = true;
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
			alreadyInit = false;
		}
		timeLeft = t;
		timeLimit = t;
		startTimer();
	};

	function startGame() {
		spawn("python", ["/Users/maytanan/Desktop/maldos/src/game/maldos_client.py"]);
	}

	const sendToRenderer = (event: string, arg: any) => {
		if (win) {
			win.webContents.send(event, arg);
		}
	};

	win.webContents.on("did-finish-load", () => {
		startTimer();
		let envInterval = new Interval(() => {
			temperature = getTemperature();
			lightLevel = getLight();
			soundLevel = getSound();
			sendToRenderer("update-env", [temperature, lightLevel, soundLevel]);
		}, 2000);
		envInterval.run();
	});

	ipcMain.on("load-page", (event, page) => {
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

	ipcMain.on("quit", () => {
		app.quit();
	});

	ipcMain.on("start-game", () => {
		sendToRenderer("show-warning", true);
	});

	ipcMain.on("spawn-game-process", () => {
		startGame();
		sendToRenderer("show-loading", true);
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

app.on("window-all-closed", () => {});

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

ipcMain.on("set-time-limit", (event: any, arg: any) => {
	TIMELIMIT = arg * 60 + 1;
	timeLimit = TIMELIMIT;
	store.set("time_limit", TIMELIMIT);
});

function getTemperature(): number {
	return (
		+execSync(`ioreg -rn AppleSmartBattery`, { encoding: "utf8" })
			.toString()
			.split("\n")[50]
			.replace(/\D/g, "") / 100
	);
}

function getLight(): number {
	return +execSync(`/Users/maytanan/Desktop/maldos/src/light_sensor/light`, { encoding: "utf8" })
		.toString()
		.replace(/\D/g, "");
}

function getSound(): number {
	return +exec("python /Users/maytanan/Desktop/maldos/src/sound_sensor/sound.py", {
		encoding: "utf8",
	})
		.toString()
		.replace(/\D/g, "");
}

console.log("Temperature:" + getTemperature());
console.log("Light:" + getLight());