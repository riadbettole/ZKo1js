import * as Comlink from "comlink";
import type { api } from "./zkWorker";

export default class ZkWorkerClient {
  worker: Worker;
  remoteApi: Comlink.Remote<typeof api>;

  constructor() {
    this.worker = new Worker(new URL("./zkWorker.ts", import.meta.url), {
      type: "module",
    });

    this.remoteApi = Comlink.wrap(this.worker);
  }

  async sayHi(): Promise<string> {
    return await this.remoteApi.sayHi();
  }

  async calculateExpectedHash(
    fullName: string,
    dob: string,
    idNumber: string
  ): Promise<string> {
    return await this.remoteApi.calculateExpectedHash(fullName, dob, idNumber);
  }

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

  async verifyProof(proofData: {
    proof: string;
    publicOutput: string;
    verificationKey: string;
  }): Promise<boolean> {
    return await this.remoteApi.verifyProof(proofData);
  }

  terminate(): void {
    this.worker.terminate();
  }
}

