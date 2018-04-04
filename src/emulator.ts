import { connect } from "mqtt";
import { readFileSync } from "fs";

export const config = {
  MQTT_URI: process.env.MQTT_URI || "mqtt://127.0.0.1:1883",
};

export interface ITestData {
  topic: string;
  payload?: object;
}

export interface ITestCase {
  request: ITestData;
  responses: ITestData[];
}

export interface ITestFile {
  fixtures?: ITestData[];
  tests: ITestCase[];
}

/**
 * Main Function
 *
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export const main = async (args: string[]) => {

  let filepath = args[2];

  if (typeof filepath !== "string") {
    console.log("ERROR: mqtt-reqres <filepath>");
    return;
  }

  if (!filepath.endsWith(".json")) {
    filepath = filepath + ".json"
  }

  const file: ITestFile = JSON.parse(readFileSync(filepath).toString("utf-8"));
  const client = connect(config.MQTT_URI);

  client.on("connect", () => {
    for (const test of file.tests) {
      console.log("+", test.request.topic);
      client.subscribe(test.request.topic);
    }

    if (file.fixtures) {
      for (let fixture of file.fixtures) {
        client.publish(fixture.topic, JSON.stringify(fixture.payload));
      }
    }

    console.log("\n", "Ready to work !")
  });

  client.on("message", (topic, rawPayload) => {
    console.log("-> REQUEST:", topic, "\n", rawPayload.toString());
    const match = file.tests.find(matchTest(topic, rawPayload));
    if (!!match) {
      for (const response of match.responses) {
        client.publish(response.topic, JSON.stringify(response.payload));
        console.log("<- RESPONSE:", response.topic, "\n", JSON.stringify(response.payload));
      }
    } else {
      console.log("<- ERROR: No match");
    }
  });
};

/**
 * Find the correct test case.
 *
 * @param {string} topic
 * @param {Buffer} rawPayload
 */
export const matchTest = (topic: string, rawPayload?: Buffer) => (t: ITestCase) => {
  if (rawPayload) {
    try {
      const payload = JSON.parse(rawPayload.toString("utf-8"));
      return t.request.topic === topic && JSON.stringify(t.request.payload) === JSON.stringify(payload)
    } catch (e) {
      console.log("<- ERROR: Invalid payload");
    }
  }
  return t.request.topic === topic;
};

//
// Run the script.
//
//
main(process.argv).catch(console.error);
