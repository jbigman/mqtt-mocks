"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = require("mqtt");
const fs_1 = require("fs");
exports.config = {
    MQTT_URI: process.env.MQTT_URI || "mqtt://127.0.0.1:1883",
};
/**
 * Main Function
 *
 * @param {string[]} args
 * @returns {Promise<void>}
 */
exports.main = (args) => __awaiter(this, void 0, void 0, function* () {
    let filepath = args[2];
    if (typeof filepath !== "string") {
        console.log("ERROR: mqtt-reqres <filepath>");
        return;
    }
    if (!filepath.endsWith(".json")) {
        filepath = filepath + ".json";
    }
    const file = JSON.parse(fs_1.readFileSync(filepath).toString("utf-8"));
    const client = mqtt_1.connect(exports.config.MQTT_URI);
    client.on("connect", () => {
        for (const test of file.tests) {
            console.log("+", test.request.topic);
            client.subscribe(test.request.topic);
        }
        console.log("\n", "Ready to work !");
    });
    client.on("message", (topic, rawPayload) => {
        console.log("-> REQUEST:", topic, "\n", rawPayload.toString());
        const match = file.tests.find(exports.matchTest(topic, rawPayload));
        if (!!match) {
            client.publish(match.response.topic, JSON.stringify(match.response.payload));
            console.log("<- RESPONSE:", match.response.topic, "\n", JSON.stringify(match.response.payload));
        }
        else {
            console.log("<- ERROR: No match");
        }
    });
});
/**
 * Find the correct test case.
 *
 * @param {string} topic
 * @param {Buffer} rawPayload
 */
exports.matchTest = (topic, rawPayload) => (t) => {
    if (rawPayload) {
        try {
            const payload = JSON.parse(rawPayload.toString("utf-8"));
            return t.request.topic === topic && JSON.stringify(t.request.payload) === JSON.stringify(payload);
        }
        catch (e) {
            console.log("<- ERROR: Invalid payload");
        }
    }
    return t.request.topic === topic;
};
//
// Run the script.
//
//
exports.main(process.argv).catch(console.error);
