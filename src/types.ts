import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

/* AWS S3 */
export type S3Url = {
  bucketName: string;
  region: string;
};

/* Queue Processor */
export type QueueItem = {
  downloadToken: string;
  fileInfo: RecordingFile;
};

/* Zoom Webhook Payloads */
export type FileExtension = "MP4" | "M4A";

export type RecordingFile = {
  id: string;
  file_size: number;
  download_url: string;
  file_extension: FileExtension;
};

/* HTTP Requests */
type RequestBody<E, P> = {
  event: E;
  payload: P;
  event_ts: number;
};

export type DownloadableRequestBody<E, P> = RequestBody<E, P> & {
  download_token: string;
};

export type RecordingCompletedRequestBody = DownloadableRequestBody<
  "session.recording_completed",
  {
    account_id: string;
    object: {
      session_id: string;
      recording_files?: Array<RecordingFile>;
      participant_audio_files?: Array<RecordingFile>;
      participant_video_files?: Array<RecordingFile>;
    };
  }
>;

export type ValidationRequestBody = RequestBody<"endpoint.url_validation", { plainToken: string }>;

export type WebhookRequest = Omit<ExpressRequest, "body"> & {
  body: RecordingCompletedRequestBody | ValidationRequestBody;
};

/* HTTP Responses */
export type MessageResponseBody = {
  message: string;
};

export type ValidationResponseBody = {
  plainToken: string;
  encryptedToken: string;
};

export type WebhookResponse = ExpressResponse<MessageResponseBody | ValidationResponseBody>;
