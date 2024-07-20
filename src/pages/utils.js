"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNav = loadNav;
window.$ = window.jQuery = require("jquery");
const { ipcRenderer } = require("electron");
function loadNav(activeElementClass) {
    return __awaiter(this, void 0, void 0, function* () {
        $(() => {
            $(".nav").load("../nav/nav.html");
        });
        yield addActiveNavClass(activeElementClass);
        attachHandlersToNavs();
    });
}
function addActiveNavClass(activeElementClass) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const addClassInterval = setInterval(() => {
                if ($("." + activeElementClass).hasClass("active")) {
                    clearInterval(addClassInterval);
                    resolve(undefined);
                }
                else {
                    $("." + activeElementClass).addClass("active");
                }
            }, 10);
        });
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
