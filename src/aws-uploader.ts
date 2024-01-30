import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";
import config from "../config.json" assert { type: "json" };
import type { RecordingFile, S3Url } from "./types";
import { getEnvironmentVariable } from "./utils.js";

const S3_URI_PATTERN = /https:\/\/([\w\W]+).s3.([\w\W]+).amazonaws.com/;

/**
 * Fetch the S3 URI that will be used when uploading cloud recordings to a bucket.
 *
 * The URI is pulled from the current environment variables, and will throw an error
 * if a required environment variable was not found. See {@link getEnvironmentVariable}.
 */
export const getS3Url = (): S3Url => {
  const {
    aws: {
      s3: { url: s3Url }
    }
  } = config;
  const uriMatches = s3Url.match(S3_URI_PATTERN);

  if (!uriMatches) {
    throw new Error(`Failed to decode S3 URI ${s3Url}, no matches found`);
  }

  const bucketName = uriMatches[1];
  const region = uriMatches[2];

  if (!bucketName || !region) {
    throw new Error(`Failed to decode bucket name and/or region`);
  }

  return {
    bucketName,
    region
  };
};

/**
 * Upload a downloadable Node byte stream to an AWS S3 bucket.
 */
export const uploadToBucket = async (fileInfo: RecordingFile, requestStream: Readable): Promise<void> => {
  // Destructure the file ID, file size, and file extension that Zoom provides. The file ID
  // and file extension are concatenated to create the key, and the file size is used to
  // calculate the upload completed percentage
  const { id: fileId, file_size: fileSize, file_extension: fileExtension } = fileInfo;
  const fileKey = `${fileId}.${fileExtension.toLowerCase()}`;

  // Get the bucket name and AWS region to upload to from Node environment
  const { bucketName, region } = getS3Url();

  // Instantiate our S3 client, specifying our AWS credentials, as well as the bucket
  // to upload to, the file key (name), and the request stream that will be uploaded
  const uploader = new Upload({
    client: new S3Client({
      credentials: {
        accessKeyId: getEnvironmentVariable("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getEnvironmentVariable("AWS_SECRET_ACCESS_KEY")
      },
      region
    }),
    params: {
      Bucket: bucketName,
      Key: fileKey,
      Body: requestStream
    }
  });

  // Report our current upload percentage to the console. This can be removed
  // in your implementation, or output to another stream (such as CloudWatch)
  uploader.on("httpUploadProgress", ({ loaded }) => {
    if (!loaded) return;
    const pctDone = ((loaded / fileSize) * 100).toFixed(2);
    console.log(`Uploading to S3 bucket, ${pctDone}% done.`);
  });

  await uploader.done();
  console.log(`Successfully uploaded ${fileKey} to S3 bucket`);
};
