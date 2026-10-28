export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 503,
    message: string,
    public headers?: Record<string, string>
  ) {
    super(message);
  }
}
