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
exports.getTemperature = getTemperature;
exports.getBatteryData = getBatteryData;
exports.getBatteryDataSync = getBatteryDataSync;
const { execSync, exec } = require("child_process");
function getTemperature() {
    return getBatteryDataSync().temperature;
}
const cmd = `ioreg -rn AppleSmartBattery`;
function getBatteryData() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield readData();
        return parseData(data);
    });
}
function getBatteryDataSync() {
    return parseData(readDataSync());
}
function readData() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            exec(cmd, { encoding: "utf8" }, (err, stdout, stderr) => {
                if (err || stderr !== "") {
                    reject(err || stderr);
                }
                else {
                    resolve(stdout.toString());
                }
            });
        });
    });
}
function readDataSync() {
    return execSync(cmd, { encoding: "utf8" }).toString();
}
function parseData(data) {
    const stats = data.split("\n").reduce((prev, curr) => {
        curr = curr.trim();
        if (curr.includes("ExternalConnected")) {
            prev.external_connected = curr.split("=")[1].trim() === "Yes" ? true : false;
        }
        if (curr.includes("BatteryInstalled")) {
            prev.battery_installed = curr.split("=")[1].trim() === "Yes" ? true : false;
        }
        if (curr.includes("FullyCharged")) {
            prev.fully_charged = curr.split("=")[1].trim() === "Yes" ? true : false;
        }
        if (curr.includes("IsCharging")) {
            prev.is_charging = curr.split("=")[1].trim() === "Yes" ? true : false;
        }
        if (curr.includes('"Voltage"') &&
            !curr.includes("LegacyBatteryInfo") &&
            !curr.includes("BatteryData")) {
            prev.voltage = Number(curr.split("=")[1].trim());
        }
        if (curr.includes('"CycleCount"') && !curr.includes("BatteryData")) {
            prev.cycle_count = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("DesignCapacity") && !curr.includes("BatteryData")) {
            prev.design_capacity = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("MaxCapacity")) {
            prev.max_capacity = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("CurrentCapacity")) {
            prev.current_capacity = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("DesignCycleCount9C")) {
            prev.design_cycle_count = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("TimeRemaining")) {
            prev.time_remaining = Number(curr.split("=")[1].trim());
        }
        if (curr.includes("Temperature")) {
            prev.temperature = Number(curr.split("=")[1].trim());
        }
        return prev;
    }, {});
    return Object.assign({}, stats, {
        percentage: Math.round(Number((stats.max_capacity / stats.design_capacity) * 100)),
        cycle_percentage: Math.round(Number((stats.cycle_count / stats.design_cycle_count) * 100)),
        temperature: Math.round(Number(stats.temperature / 100)),
        time_remaining_formatted: secondsToHms(stats.time_remaining || 0),
    });
}
function secondsToHms(s) {
    return s === 0 ? "/" : new Date(1000 * s).toISOString().substr(11, 8);
}
