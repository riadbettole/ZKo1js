// Web Worker Client for o1js Zero-Knowledge Proof Operations
// This wraps the web worker with a convenient API
import * as Comlink from "comlink";
import type { api } from "./zkWorker";

/**
 * ZK Worker Client
 * 
 * This class provides a convenient interface to the ZK web worker.
 * All ZK operations run in a separate thread to avoid blocking the UI.
 */
export default class ZkWorkerClient {
  worker!: Worker;
  remoteApi!: Comlink.Remote<typeof api>;

  constructor() {
    // Create a new web worker
    // Using import.meta.url to ensure proper path resolution in Next.js
    const worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });

    // Wrap the worker with Comlink for easy RPC-style communication
    this.remoteApi = Comlink.wrap(worker);
  }

  /**
   * Test function to verify worker is working
   */
  async sayHi(): Promise<string> {
    return await this.remoteApi.sayHi();
  }

  /**
   * Calculate expected hash from user data
   */
  async calculateExpectedHash(
    fullName: string,
    dob: string,
    idNumber: string
  ): Promise<string> {
    return await this.remoteApi.calculateExpectedHash(fullName, dob, idNumber);
  }

  /**
   * Create a zero-knowledge proof
   * 
   * This runs in a web worker to avoid blocking the UI during proof generation.
   */
  async createProof(
    fullName: string,
    dob: string,
    idNumber: string
  ): Promise<{
    proof: string;
    publicOutput: string;
    verificationKey: string;
  }> {
    return await this.remoteApi.createProof(fullName, dob, idNumber);
  }

  /**
   * Verify a zero-knowledge proof
   * 
   * This runs in a web worker to avoid blocking the UI during verification.
   */
  async verifyProof(proofData: {
    proof: string;
    publicOutput: string;
    verificationKey: string;
  }): Promise<boolean> {
    return await this.remoteApi.verifyProof(proofData);
  }

  /**
   * Terminate the worker (cleanup)
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

