import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

export interface UseStorageUploadResult {
  upload: (file: File, onProgress?: (pct: number) => void) => Promise<string>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useStorageUpload(): UseStorageUploadResult {
  const { identity } = useInternetIdentity();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const config = await loadConfig();
        const agent = new HttpAgent({
          ...(identity ? { identity } : {}),
          host: config.backend_host,
        });

        if (config.backend_host?.includes("localhost")) {
          await agent.fetchRootKey().catch(() => {});
        }

        const storageClient = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );

        const bytes = new Uint8Array(await file.arrayBuffer());
        const progressHandler = (pct: number) => {
          setUploadProgress(pct);
          onProgress?.(pct);
        };

        const { hash } = await storageClient.putFile(bytes, progressHandler);
        const url = await storageClient.getDirectURL(hash);
        setUploadProgress(100);
        return url;
      } finally {
        setIsUploading(false);
      }
    },
    [identity],
  );

  return { upload, isUploading, uploadProgress };
}
