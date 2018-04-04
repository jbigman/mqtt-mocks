# mqtt-request-response
MQTT tool that take a json file as entry. It describes responses to provide according to provided requests


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
      "payload": {
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
        "payload": {
          "test": 9000
        }
      },
      "responses": [
        {
          "topic": "response/test",
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
