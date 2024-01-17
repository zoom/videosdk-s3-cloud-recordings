import dotenv from "dotenv";
import express from "express";
import fastq, { type queueAsPromised as JobQueue } from "fastq";
import { createHmac } from "node:crypto";
import { uploadToBucket } from "./aws-uploader";
import type { QueueItem, WebhookRequest, WebhookResponse } from "./types";
import { getEnvironmentVariable, mapToQueueItems } from "./utils";
import { downloadCloudRecording } from "./zoom-downloader";

// Ingest .env environment variables
dotenv.config();

// Create an Express web server to handle web requests
const app = express();
app.use(express.json());

/**
 * Create a job queue that downloads cloud recordings and uploads them to AWS S3.
 *
 * WARNING: This queue is implemented using fastq, an ephemeral, in-memory database,
 * which should not be used in a production environment.
 */
const fetchQueue: JobQueue<QueueItem> = fastq.promise(async ({ downloadToken, fileInfo }) => {
  const downloadStream = downloadCloudRecording(fileInfo, downloadToken);
  await uploadToBucket(fileInfo, downloadStream);
}, 4);

/**
 * When a POST request is received by our web server, we want to ensure that the request is from Zoom and
 * validate ownership of the domain/server. Then, we can handle business logic - in this app, that means
 * mapping session recordings to queue items,  which will download the file(s) and upload them to AWS S3.
 */
app.post("/", (req: WebhookRequest, res: WebhookResponse) => {
  console.log("Received request body: ", JSON.stringify(req.body));

  // Construct the message with "v0," the request timestamp (Zoom provided), and the request body, each separated by a colon
  const message = `v0:${req.headers["x-zm-request-timestamp"]}:${JSON.stringify(req.body)}`;

  // Hash the message using HMAC SHA-256, outputting in hex format
  const hashForVerify = createHmac("sha256", getEnvironmentVariable("ZOOM_WEBHOOK_SECRET_TOKEN"))
    .update(message)
    .digest("hex");

  // Creating the final webhook signature to match against Zoom
  const signature = `v0=${hashForVerify}`;

  // Request validation passed, meaning that the request came from Zoom
  if (req.headers["x-zm-signature"] === signature) {
    // Zoom is ensuring that we have ownership over the domain/server, so we're responding to the challenge
    // See: https://developers.zoom.us/docs/api/rest/webhook-reference/#validate-your-webhook-endpoint
    if (req.body.event === "endpoint.url_validation") {
      const hashForValidate = createHmac("sha256", getEnvironmentVariable("ZOOM_WEBHOOK_SECRET_TOKEN"))
        .update(req.body.payload.plainToken)
        .digest("hex");

      return res.status(200).json({ plainToken: req.body.payload.plainToken, encryptedToken: hashForValidate });
    }

    // Zoom is informing us that a session recording has finished, so we can queue it for download
    if (req.body.event === "session.recording_completed") {
      const queueItems = mapToQueueItems(req.body);
      console.log("Mapped recording items: ", JSON.stringify(queueItems));
      queueItems.map((item) => fetchQueue.push(item));

      return res.status(200).json({ message: "Authorized request to Zoom Webhook sample." });
    }
  }

  // Request validation failed, meaning that the request likely did not come from Zoom
  return res.status(401).json({ message: "Unauthorized request to Zoom Webhook sample." });
});

// Start the Express server, listening on port 3000
app.listen(3000, () => console.info("Zoom Cloud Recordings S3 Auto-Upload now listening on http://localhost:3000"));
