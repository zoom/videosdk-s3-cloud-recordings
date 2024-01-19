import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";
import type { RecordingFile, S3Uri } from "./types";
import { getEnvironmentVariable } from "./utils";

const S3_URI_PATTERN = /https:\/\/([\w\W]+).s3.([\w\W]+).amazonaws.com/;

/**
 * Fetch the S3 URI that will be used when uploading cloud recordings to a bucket.
 *
 * The URI is pulled from the current environment variables, and will throw an error
 * if a required environment variable was not found. See {@link getEnvironmentVariable}.
 */
export const getS3Uri = (): S3Uri => {
  const s3Uri = getEnvironmentVariable("AWS_S3_URI");
  const uriMatches = s3Uri.match(S3_URI_PATTERN);

  if (!uriMatches) {
    throw new Error(`Failed to decode S3 URI ${s3Uri}, no matches found`);
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
  const { bucketName, region } = getS3Uri();

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