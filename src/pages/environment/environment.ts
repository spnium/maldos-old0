var { ipcRenderer } = require("electron");

ipcRenderer.on("update-env", (_event, arg) => {
	let temperatureMessage = "normal";
	if (arg[0] > 33) {
		temperatureMessage = "too hot";
	}
	if (arg[0] < 18) {
		temperatureMessage = "too cold";
	}

	let lightMessage = "normal";
	if (arg[1] > 4000) {
		lightMessage = "too bright";
	}
	if (arg[1] < 100) {
		lightMessage = "too dark";
	}

	let soundMessage = "normal";
	if (arg[2] > 100) {
		soundMessage = "too loud";
	}
	if (arg[2] < 10) {
		soundMessage = "quiet";
	}

	document.getElementById(
		"temperature"
	)!.innerHTML = `<span>Temperature : ${temperatureMessage}</span>`;
	document.getElementById("light")!.innerHTML = `<span>Light : ${lightMessage}</span>`;
	document.getElementById("sound")!.innerHTML = `<span>Sound : ${soundMessage}</span>`;
});
