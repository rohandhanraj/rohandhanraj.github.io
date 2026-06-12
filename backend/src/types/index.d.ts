declare namespace Express {
  export interface Request {
    chatSessionId?: string;
    visitorId?: string;
  }
}
