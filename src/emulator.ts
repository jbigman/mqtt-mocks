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
  description?: string;
  request: ITestData;
  responses: ITestData[];
}

export interface ITestFile {
  fixtures?: ITestData[];
  cases: ITestCase[];
}

/**
 * Main Function
 *
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export const main = async (args: string[]) => {

  const client = connect(config.MQTT_URI);
  const fixtures: ITestData[] = [];
  const cases: ITestCase[] = [];

  // Read files (from arg2 to infinity and beyond)
  for (const arg of args.slice(2)) {

    if (typeof arg !== "string") {
      console.log("ERROR: mqtt-reqres <filepath>");
      return;
    }

    const filepath = arg.endsWith(".json") ? arg : arg + ".json";
    const file: ITestFile = JSON.parse(readFileSync(filepath).toString("utf-8"));

    if (file.fixtures) {
      fixtures.push(...file.fixtures);
    }
    cases.push(...file.cases);
  }

  console.log("Start MQTT connection...");
  // Publish fixtures in MQTT broker
  client.on("connect", () => {
    console.log("MQTT connection established");
    for (const test of cases) {
      console.log("+", test.request.topic);
      client.subscribe(test.request.topic);
    }

    for (let fixture of fixtures) {
      client.publish(fixture.topic, JSON.stringify(fixture.payload));
    }

    console.log("\n", "Ready to work !")
  });

  client.on("message", (topic, rawPayload) => {
    console.log("-> REQUEST:", topic, "\n", rawPayload.toString());
    const match = cases.find(matchTest(topic, rawPayload));
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
