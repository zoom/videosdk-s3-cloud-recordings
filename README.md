# Zoom Cloud Recordings S3 Auto-Upload

Use of this sample app is subject to our [Terms of Use](https://explore.zoom.us/en/video-sdk-terms/).

This Express/Node.js project demonstrates how to set up and listen to Zoom webhooks that, when processed, will automatically stream a download and subsequent upload to AWS S3 for Cloud Recordings storage.

## Installation

In a terminal window (e.g., Git Bash for Windows or Terminal for Linux/Mac OS), clone this repository by executing the following command:

```bash
$ git clone https://github.com/zoom/videosdk-s3-cloud-recordings.git
```

## Setup & Configuration

1. In a terminal window, `cd` into the cloned repository:

    ```bash
    $ cd zoom-video-sdk-s3-uploader
    ```

2. Install all necessary dependencies with `npm`, `yarn`, or `pnpm`:

    ```bash
    $ npm install
    ```

3. Rename `.env.local` to `.env`, replacing all environment variables for use with the [AWS SDK](https://github.com/zoom/videosdk-s3-cloud-recordings/wiki/Preparing-Your-AWS-Account) and [Zoom's Video SDK](https://marketplace.zoom.us/develop).

4. Start the development server

    ```bash
    $ npm run dev
    ```

5. Once the server is up and running, Zoom requires all webhook endpoints are first validated before webhooks are sent. Refer to Zoom's [_Using Webhooks_](https://developers.zoom.us/docs/api/rest/webhook-reference/) guide for more information.

> [!NOTE]
> The only required webhook event for this application is **Video SDK > Session recording completed**. All others events that are sent to this application will return `200 OK`, but will not be processed.

## Usage

This application exposes the `POST /` endpoint; however, this endpoint should not be called manually. Instead, this endpoint is called by Zoom once a Video SDK [Cloud Recording](https://developers.zoom.us/docs/video-sdk/web/recording/) has finished successfully.

## Deployment

As this application is written in TypeScript, it will need to be deployed with the ability to run via `ts-node`, `tsx`, `swc-node`, or similar; `node` will be unable to run this application out of the box.

If you want to be able to run the application via the `node` command, it must first be built by executing `npm run build`, which will transpile all TypeScript files to JavaScript, outputting them to the `dist` directory. Once transpiled you can run the application by executing `node server.js` within the `dist` directory.

## Need Help?

If you're looking for help, try [Developer Support](https://devsupport.zoom.us) or our [Developer Forum](https://devforum.zoom.us). Priority support is also available with [Premier Developer Support](https://explore.zoom.us/docs/en-us/developer-support-plans.html) plans.
