import got from "got";
import type { Readable } from "node:stream";
import type { RecordingFile } from "./types";

/**
 * Download a Zoom cloud recording, returning a streamable interface that can be sent to AWS S3.
 *
 * This sample application uses got, an npm package for HTTP requests, since we want a Node Readable to
 * send to AWS S3. At the time of writing, Readable.fromWeb() can be used for converting Web fetch to a
 * Node Readable; however, this Node function is currently labeled as experimental. Once stable, this function
 * will get updated to perform this conversion without a third-party library.
 *
 * See {@link https://nodejs.org/docs/latest-v21.x/api/stream.html#streamreadablefromwebreadablestream-options Node Readable.fromWeb() Documentation}
 */
export const downloadCloudRecording = ({ download_url: downloadUrl }: RecordingFile, downloadToken: string): Readable =>
  got.stream(downloadUrl, { headers: { authorization: `Bearer ${downloadToken}` } });
