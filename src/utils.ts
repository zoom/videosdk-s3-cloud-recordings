import type { QueueItem, RecordingCompletedRequestBody } from "./types";

/**
 * Given an `Array<T[] | undefined>`, filter any array(s) that are `undefined` and
 * concatenate them all together, returning a final, flattened array.
 */
const flatMerge = <T>(...arr: Array<T[] | undefined>) =>
  arr
    .filter((value): value is Array<T> => Array.isArray(value))
    .reduce((acc, curr) => (Array.isArray(curr) ? acc.concat(...curr) : acc.concat(curr)));

/**
 * Get a Node environment variable, returning the {@link NonNullable} equivalent if present,
 * or throwing an {@link Error} if the environment variable was **not** found.
 */
export const getEnvironmentVariable = <T extends keyof NodeJS.ProcessEnv>(
  key: T
): NonNullable<NodeJS.ProcessEnv[T]> => {
  const envVar = process.env[key];
  if (!envVar) throw new Error(`Environment variable ${key} is required, please update variable and restart server`);
  return envVar;
};

/**
 * Take a `session.recording_completed` request body that Zoom sends over, and map it to an {@link Array} of
 * {@link QueueItem}s that can be subsequently sent to Zoom to download the recording and uploaded to AWS S3.
 */
export const mapToQueueItems = (requestBody: RecordingCompletedRequestBody): Array<QueueItem> => {
  const {
    download_token: downloadToken,
    payload: {
      object: {
        recording_files: recordingFiles,
        participant_audio_files: participantAudioFiles,
        participant_video_files: participantVideoFiles
      }
    }
  } = requestBody;

  // Map all recording arrays into QueueItems for download/queue processing
  const mappedItems = flatMerge(recordingFiles, participantAudioFiles, participantVideoFiles).map((value) => ({
    downloadToken,
    fileInfo: value
  }));

  // Filter any ID duplicates out of our mapped items
  const filteredItems = mappedItems.filter(
    (value, index) => index === mappedItems.findIndex((other) => other.fileInfo.id === value.fileInfo.id)
  );

  return filteredItems;
};
