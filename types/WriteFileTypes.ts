export interface WriteFileInput {
  path: string;
  content: string | Record<string, unknown>;
}

export interface WriteFileOutput {
  path: string;
}

export interface WriteFileError {
  code: "write_failed";
  message?: string;
}