# mqtt-request-response
MQTT Tool used to prepare specific publications in reaction to other mqtt publications

this tool reads a json file which contains 
* fixtures: this way, we can insert default data in MQTT queues.
* tests: It describes responses to provide according to each provided request
Two messages sent on the same queue could be differentiated by different payloads. 

How to use
---

Install globally
```bash
git clone https://github.com/jbigman/mqtt-request-response.git && cd mqtt-request-response && sudo npm i -g .
```

Dev
```bash
npm start
```



How to write json file
---

```
{
  "fixtures": [
    {
      "topic": "response/test",       
      "payload": {                    // data sent for initialisation purpose
        "success": true,
        "extra": {
          "test": 5000
        }
      }
    }
  ],
  "tests": [
    {
      "request": {
        "topic": "request/test",      
        "payload": {                  // topic with this exact payload will match, payload is not mandatory
          "test": 9000
        }
      },
      "responses": [
        {
          "topic": "response/test",   // response sent on this topic
          "payload": {
            "success": true,
            "extra": {
              "test": 9000
            }
          }
        }
      ]
    }
  ]
}
```
