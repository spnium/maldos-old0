(<any>window).$ = (<any>window).jQuery = require("jquery");
const { ipcRenderer } = require("electron");

export async function loadNav(activeElementClass: string) {
	$(() => {
		$(".nav").load("../nav/nav.html");
	});
	await addActiveNavClass(activeElementClass);
	attachHandlersToNavs();
}
async function addActiveNavClass(activeElementClass: string) {
	return new Promise((resolve, reject) => {
		const addClassInterval = setInterval(() => {
			if ($("." + activeElementClass).hasClass("active")) {
				clearInterval(addClassInterval);
				resolve(undefined);
			} else {
				$("." + activeElementClass).addClass("active");
			}
		}, 10);
	});
}

function attachHandlersToNavs() {
	let navs = $(".nav-link");

	for (let i = 0; i < navs.length; i++) {
		if (!navs[i].classList.contains("active")) {
			navs[i].addEventListener("click", () => {
				ipcRenderer.send("nav-btn-click", navs[i].id);
				console.log(navs[i].id + " clicked");
			});
		}
	}
}
