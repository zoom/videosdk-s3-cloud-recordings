declare namespace NodeJS {
  interface ProcessEnv {
    // AWS IAM
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;

    // Zoom Webhooks
    ZOOM_WEBHOOK_SECRET_TOKEN?: string;
  }
}
