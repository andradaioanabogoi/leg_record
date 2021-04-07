/**
nexmo context: 
you can find this as the second parameter of rtcEvent funciton or as part or the request in req.nexmo in every request received by the handler 
you specify in the route function.

it contains the following: 
const {
        generateBEToken,
        generateUserToken,
        logger,
        csClient,
        storageClient
} = nexmo;

- generateBEToken, generateUserToken,// those methods can generate a valid token for application
- csClient: this is just a wrapper on https://github.com/axios/axios who is already authenticated as a nexmo application and 
    is gonna already log any request/response you do on conversation api. 
    Here is the api spec: https://jurgob.github.io/conversation-service-docs/#/openapiuiv3
- logger: this is an integrated logger, basically a bunyan instance
- storageClient: this is a simple key/value inmemory-storage client based on redis

*/

/**
 *
 * This function is meant to handle all the asyncronus event you are gonna receive from conversation api
 *
 * it has 2 parameters, event and nexmo context
 * @param {object} event - this is a conversation api event. Find the list of the event here: https://jurgob.github.io/conversation-service-docs/#/customv3
 * @param {object} nexmo - see the context section above
 * */

const DATACENTER = `https://api.nexmo.com`;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const voiceEvent = async (req, res, next) => {
  const { logger, csClient, storageClient } = req.nexmo;

  try {
    logger.info("voiceEvent", req.body, req.query);
    if (req.body.status === "answered" && req.body.direction === "outbound") {
      //save leg id
      //when memeber:media
      const { uuid } = req.body;
      await sleep(1000);
      const recordingData = await csClient({
        url: `${DATACENTER}/v0.3/legs/${uuid}/recording`,
        method: "post",
      });
    }
    res.json({});
  } catch (err) {
    logger.error("Error on voiceEvent function", err);
  }
};

const voiceAnswer = async (req, res, next) => {
  const { logger, csClient } = req.nexmo;
  logger.info("req", { req_body: req.body });
  try {
    return res.json([
      //   {
      //     action: "talk",
      //     text: `Hello , This Is an NCCO Demo`,
      //   },
      //   {
      //     action: "talk",
      //     text: `Your number is ${req.body.from.split("").join(" ")}`,
      //   },
      //   {
      //     action: "talk",
      //     text: `And you are colling the number ${req.body.to
      //       .split("")
      //       .join(" ")}`,
      //   },
      //   {
      //     action: "talk",
      //     text: `Have a nice day, now we are gonna hangup`,
      //   },
      {
        action: "connect",
        from: "447451276946",
        endpoint: [
          {
            type: "phone",
            number: "447479199288",
          },
        ],
      },
    ]);
  } catch (err) {
    logger.error("Error on voiceAnswer function");
  }
};

const rtcEvent = async (event, { logger, csClient, storageClient }) => {
  try {
    if (event.type === "audio:record:done") {
      await storageClient.set(`recording-event`, JSON.stringify(event));
      //   const storageUser = await storageClient.get(`user:${username}`);
    }
  } catch (err) {
    logger.error({ err }, "Error on rtcEvent function");
  }
};

/**
 *
 * @param {object} app - this is an express app
 * you can register and handler same way you would do in express.
 * the only difference is that in every req, you will have a req.nexmo variable containning a nexmo context
 *
 */
const route = (app) => {
  app.get("/hello", async (req, res) => {
    const { logger } = req.nexmo;

    logger.info(`Hello Request HTTP `);

    res.json({
      text: "Hello Request!",
    });
  });
  app.get("/recording", async (req, res) => {
    const { logger, storageClient } = req.nexmo;

    logger.info(`Get recording `);
    const recording = await storageClient.get("recording-event");
    logger.info("recording event", recording);
    res.json({
      recording: JSON.parse(recording),
    });
  });
};

module.exports = {
  voiceAnswer,
  voiceEvent,
  rtcEvent,
  route,
};
