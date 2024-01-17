declare module "http" {
  interface IncomingHttpHeaders {
    "x-zm-request-timestamp"?: string;
    "x-zm-signature"?: string;
  }
}
