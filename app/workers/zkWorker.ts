// Web Worker for o1js Zero-Knowledge Proof Operations
// This runs ZK operations in a separate thread to avoid blocking the UI
import * as Comlink from "comlink";
import { Field, Poseidon, ZkProgram } from "o1js";

/**
 * Helper function to convert string to Field (o1js native type)
 */
function stringToField(str: string): Field {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Field.from(bytes.reduce((acc, byte, i) => acc + BigInt(byte) * (256n ** BigInt(i)), 0n));
}

/**
 * KYC Zero-Knowledge Program
 * 
 * This defines what we want to prove:
 * "I know fullName, dob, and idNumber that hash to a specific value"
 * WITHOUT revealing the actual values!
 */
const KYCProgram = ZkProgram({
  name: "KYCProof",
  publicInput: Field, // The expected hash (what verifier knows)
  methods: {
    prove: {
      privateInputs: [Field, Field, Field], // [fullName, dob, idNumber]
      async method(publicInput: Field, fullName: Field, dob: Field, idNumber: Field): Promise<void> {
        // Hash the three private fields together using Poseidon
        const computedHash = Poseidon.hash([fullName, dob, idNumber]);
        
        // Assert that the computed hash equals the expected hash
        computedHash.assertEquals(publicInput);
      },
    },
  },
});

/**
 * KYC Proof Class
 * 
 * Following o1js pattern: create a proof subclass that extends ZkProgram.Proof
 * This is required - you cannot use the Proof class directly
 */
class KYCProof extends ZkProgram.Proof(KYCProgram) {}

// Cache for compiled program
let compiledProgram: { verificationKey: any } | null = null;

/**
 * Compile the ZK program (one-time setup)
 */
async function compileProgram(): Promise<{ verificationKey: any }> {
  if (compiledProgram) {
    return compiledProgram;
  }
  
  console.log("Compiling KYC ZK program in worker... (this may take a while)");
  const { verificationKey } = await KYCProgram.compile();
  compiledProgram = { verificationKey };
  console.log("Compilation complete in worker!");
  
  return compiledProgram;
}

/**
 * Worker API exposed via Comlink
 */
export const api = {
  /**
   * Test function to verify worker is working
   */
  async sayHi(): Promise<string> {
    return "Hello from the ZK worker!";
  },

  /**
   * Calculate expected hash from user data
   */
  async calculateExpectedHash(
    fullName: string,
    dob: string,
    idNumber: string
  ): Promise<string> {
    const fullNameField = stringToField(fullName.toUpperCase());
    const dobField = stringToField(dob);
    const idNumberField = stringToField(idNumber.toUpperCase());
    
    const hash = Poseidon.hash([fullNameField, dobField, idNumberField]);
    return hash.toString();
  },

  /**
   * Create a zero-knowledge proof
   * 
   * Proves: "I know fullName, dob, idNumber that hash to expectedHash"
   * WITHOUT revealing the actual values!
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
    // Step 1: Convert strings to Fields
    const fullNameField = stringToField(fullName.toUpperCase());
    const dobField = stringToField(dob);
    const idNumberField = stringToField(idNumber.toUpperCase());

    // Step 2: Calculate the expected hash (public input)
    const expectedHash = Poseidon.hash([fullNameField, dobField, idNumberField]);

    // Step 3: Compile the program (if not already compiled)
    const { verificationKey } = await compileProgram();

    // Step 4: Generate the zero-knowledge proof
    const { proof } = await KYCProgram.prove(
      expectedHash, // Public input (what verifier knows)
      fullNameField, // Private input (hidden)
      dobField, // Private input (hidden)
      idNumberField // Private input (hidden)
    );

    // Step 5: Serialize proof and VK for storage/transmission
    const proofJson = proof.toJSON();
    return {
      proof: JSON.stringify(proofJson),
      publicOutput: expectedHash.toString(),
      verificationKey: JSON.stringify(verificationKey),
    };
  },

  /**
   * Verify a zero-knowledge proof
   */
  async verifyProof(proofData: {
    proof: string;
    publicOutput: string;
    verificationKey: string;
  }): Promise<boolean> {
    try {
      // Step 1: Compile the program (if not already compiled)
      await compileProgram();
      
      // Step 2: Deserialize the proof
      const proofJson = JSON.parse(proofData.proof);

      // Step 3: Reconstruct the proof object from JSON
      // Use the KYCProof class (extends ZkProgram.Proof) - this is required!
      const proofObj = await KYCProof.fromJSON(proofJson);

      // Step 4: Verify the proof using the ZkProgram's verify method
      const isValid = await KYCProgram.verify(proofObj);

      return isValid;
    } catch (error) {
      console.error("Verification error in worker:", error);
      return false;
    }
  },
};

// Expose the API via Comlink
Comlink.expose(api);

