// o1js - True Zero-Knowledge Proof Implementation
// This replaces the Ed25519 signature-based approach with actual ZK proofs
import { Field, Poseidon, ZkProgram } from "o1js";

/**
 * True Zero-Knowledge Proof Structure
 * The proof hides the actual data (fullName, dob, idNumber)
 * but proves it matches a known hash
 */
export interface ZkProof {
  proof: string; // Serialized proof (JSON string)
  publicOutput: string; // The hash that verifier knows (Field as string)
  verificationKey: string; // VK for verification (JSON string)
}

/**
 * Helper function to convert string to Field (o1js native type)
 * Fields are finite field elements used in ZK proofs
 */
function stringToField(str: string): Field {
  // Convert string to bytes, then to a big integer, then to Field
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  // Use Poseidon hash to convert string to Field (more efficient)
  // For multiple strings, we can hash them together
  return Field.from(bytes.reduce((acc, byte, i) => acc + BigInt(byte) * (256n ** BigInt(i)), 0n));
}

/**
 * KYC Zero-Knowledge Program
 * 
 * This defines what we want to prove:
 * "I know fullName, dob, and idNumber that hash to a specific value"
 * WITHOUT revealing the actual values!
 * 
 * The circuit:
 * 1. Takes private inputs: fullName, dob, idNumber (hidden)
 * 2. Takes public input: expectedHash (known to verifier)
 * 3. Computes hash of private inputs
 * 4. Verifies computed hash equals expected hash
 */
const KYCProgram = ZkProgram({
  name: "KYCProof",
  publicInput: Field, // The expected hash (what verifier knows)
  methods: {
    /**
     * Proves knowledge of data that hashes to expectedHash
     * 
     * @param fullName - Private input (hidden from verifier)
     * @param dob - Private input (hidden from verifier)
     * @param idNumber - Private input (hidden from verifier)
     * @param expectedHash - Public input (known to verifier)
     */
    prove: {
      privateInputs: [Field, Field, Field], // [fullName, dob, idNumber]
      async method(publicInput: Field, fullName: Field, dob: Field, idNumber: Field): Promise<void> {
        // Hash the three private fields together using Poseidon
        // Poseidon is a ZK-friendly hash function (efficient in circuits)
        const computedHash = Poseidon.hash([fullName, dob, idNumber]);
        
        // Assert that the computed hash equals the expected hash
        // This is the constraint that makes it a proof
        // If this fails, the proof generation will fail
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

// Cache for compiled program (to avoid recompiling every time)
let compiledProgram: { verificationKey: any } | null = null;

/**
 * Compile the ZK program (one-time setup)
 * This generates the proving key and verification key
 * 
 * Note: Compilation takes time (~30 seconds to minutes)
 * In production, you'd compile once and cache the result
 */
export async function compileProgram(): Promise<{ verificationKey: any }> {
  if (compiledProgram) {
    return compiledProgram;
  }
  
  console.log("Compiling KYC ZK program... (this may take a while)");
  const { verificationKey } = await KYCProgram.compile();
  compiledProgram = { verificationKey };
  console.log("Compilation complete!");
  
  return compiledProgram;
}

/**
 * Create a zero-knowledge proof
 * 
 * Proves: "I know fullName, dob, idNumber that hash to expectedHash"
 * WITHOUT revealing the actual values!
 * 
 * @param fullName - User's full name (will be hidden)
 * @param dob - Date of birth (will be hidden)
 * @param idNumber - ID number (will be hidden)
 * @returns ZK proof object
 */
export async function createProof(
  fullName: string,
  dob: string,
  idNumber: string
): Promise<ZkProof> {
  // Validate inputs
  if (!fullName || !dob || !idNumber) {
    throw new Error("Missing required fields: fullName, dob, and idNumber are required");
  }

  // Step 1: Convert strings to Fields (ZK-friendly format)
  const fullNameField = stringToField(fullName.toUpperCase());
  const dobField = stringToField(dob);
  const idNumberField = stringToField(idNumber.toUpperCase());

  // Step 2: Calculate the expected hash (public input)
  // This is what the verifier will know
  const expectedHash = Poseidon.hash([fullNameField, dobField, idNumberField]);

  // Step 3: Compile the program (if not already compiled)
  const { verificationKey } = await compileProgram();

  // Step 4: Generate the zero-knowledge proof
  // This is where the magic happens - the proof is generated
  // but the actual data (fullName, dob, idNumber) is NOT revealed
  const { proof } = await KYCProgram.prove(
    expectedHash, // Public input (what verifier knows)
    fullNameField, // Private input (hidden)
    dobField, // Private input (hidden)
    idNumberField // Private input (hidden)
  );

  // Step 5: Serialize proof and VK for storage/transmission
  // o1js proof object has a toJSON method that returns the proof data
  const proofJson = proof.toJSON();
  return {
    proof: JSON.stringify(proofJson),
    publicOutput: expectedHash.toString(),
    verificationKey: JSON.stringify(verificationKey),
  };
}

/**
 * Verify a zero-knowledge proof
 * 
 * Verifies that the proof is valid WITHOUT knowing the actual data
 * The verifier only knows the expected hash
 * 
 * @param proof - The ZK proof object
 * @returns true if proof is valid, false otherwise
 */
export async function verifyProof(proof: ZkProof): Promise<boolean> {
  try {
    // Step 1: Compile the program (if not already compiled)
    // This ensures we have the verification key
    await compileProgram();
    
    // Step 2: Deserialize the proof
    const proofJson = JSON.parse(proof.proof);
    const publicOutput = Field.from(proof.publicOutput);

    // Step 3: Reconstruct the proof object from JSON
    // Use the KYCProof class (extends ZkProgram.Proof) - this is required!
    // You cannot use the generic Proof class directly
    const proofObj = await KYCProof.fromJSON(proofJson);

    // Step 4: Verify the proof using the ZkProgram's verify method
    // This checks that the proof is mathematically valid
    // It does NOT reveal the private inputs
    const isValid = await KYCProgram.verify(proofObj);

    return isValid;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

/**
 * Helper function to calculate the expected hash from user data
 * This is used by the verifier to know what hash to expect
 * 
 * @param fullName - User's full name
 * @param dob - Date of birth
 * @param idNumber - ID number
 * @returns The hash as a string (Field.toString())
 */
export function calculateExpectedHash(
  fullName: string,
  dob: string,
  idNumber: string
): string {
  const fullNameField = stringToField(fullName.toUpperCase());
  const dobField = stringToField(dob);
  const idNumberField = stringToField(idNumber.toUpperCase());
  
  const hash = Poseidon.hash([fullNameField, dobField, idNumberField]);
  return hash.toString();
}
