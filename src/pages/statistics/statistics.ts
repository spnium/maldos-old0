var { ipcRenderer } = require("electron");

ipcRenderer.on("yellow", () => {
	document.getElementById("yellow")!.classList.add("yellow");
});
