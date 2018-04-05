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
    const client = mqtt_1.connect(exports.config.MQTT_URI);
    const fixtures = [];
    const tests = [];
    // Read files (from arg2 to infinity and beyond)
    for (const arg of args.slice(2)) {
        if (typeof arg !== "string") {
            console.log("ERROR: mqtt-reqres <filepath>");
            return;
        }
        const filepath = arg.endsWith(".json") ? arg : arg + ".json";
        const file = JSON.parse(fs_1.readFileSync(filepath).toString("utf-8"));
        if (file.fixtures) {
            fixtures.push(...file.fixtures);
        }
        tests.push(...file.tests);
    }
    // Publish fixtures in MQTT broker
    client.on("connect", () => {
        for (const test of tests) {
            console.log("+", test.request.topic);
            client.subscribe(test.request.topic);
        }
        for (let fixture of fixtures) {
            client.publish(fixture.topic, JSON.stringify(fixture.payload));
        }
        console.log("\n", "Ready to work !");
    });
    client.on("message", (topic, rawPayload) => {
        console.log("-> REQUEST:", topic, "\n", rawPayload.toString());
        const match = tests.find(exports.matchTest(topic, rawPayload));
        if (!!match) {
            for (const response of match.responses) {
                client.publish(response.topic, JSON.stringify(response.payload));
                console.log("<- RESPONSE:", response.topic, "\n", JSON.stringify(response.payload));
            }
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
