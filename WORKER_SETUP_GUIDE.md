# Web Worker Setup for o1js - Complete Guide

## ✅ What Was Configured

We've successfully configured your Next.js app for effective o1js usage with web workers. Here's what was done:

### 1. ✅ Next.js Configuration (`next.config.ts`)

**COOP and COEP Headers:**
- Added `Cross-Origin-Opener-Policy: same-origin`
- Added `Cross-Origin-Embedder-Policy: require-corp`
- **Required for o1js WASM** to work in browsers

**Webpack WASM Support:**
- Enabled `asyncWebAssembly: true` for WASM support
- Enabled `layers: true` for webpack layers
- Configured WASM file handling as assets
- Added fallbacks for Node.js modules in browser

### 2. ✅ Installed Comlink

```bash
npm install comlink
```

Comlink is a library that wraps web workers with a convenient RPC-style API, making it easy to use workers.

### 3. ✅ Created Web Worker Files

**`app/workers/zkWorker.ts`** - The worker file that runs o1js operations:
- Contains the ZK program definition
- Exposes API via Comlink for proof generation and verification
- Runs in a separate thread to avoid blocking the UI

**`app/workers/zkWorkerClient.ts`** - The client wrapper:
- Provides a convenient interface to the worker
- Handles worker creation and communication
- Easy-to-use methods for ZK operations

### 4. ✅ Updated Frontend (`app/page.tsx`)

- Added worker test on component mount
- Worker is initialized and tested when the page loads
- Check browser console for "Hello from the ZK worker!" message

---

## 🚀 How It Works

### Architecture

```
┌─────────────────────┐
│   Browser (UI)      │
│   app/page.tsx      │
└──────────┬──────────┘
           │
           │ Comlink RPC
           │
┌──────────▼──────────┐
│   Web Worker        │
│   zkWorker.ts       │
│   - o1js            │
│   - ZK Proofs        │
│   - No UI blocking! │
└─────────────────────┘
```

### Benefits

1. **Non-blocking UI**: ZK operations run in a separate thread
2. **Better UX**: Page remains responsive during proof generation
3. **Proper WASM support**: COOP/COEP headers enable SharedArrayBuffer
4. **Easy API**: Comlink makes worker communication simple

---

## 📋 File Structure

```
zkpass-mobile/
├── app/
│   ├── workers/
│   │   ├── zkWorker.ts          # ✅ Worker file (runs o1js)
│   │   └── zkWorkerClient.ts    # ✅ Client wrapper
│   ├── api/
│   │   ├── submit/
│   │   │   └── route.ts          # Server-side API (still works)
│   │   └── verify/
│   │       └── route.ts          # Server-side API (still works)
│   └── page.tsx                  # ✅ Updated with worker test
├── lib/
│   └── zk.ts                     # Server-side ZK (still available)
├── next.config.ts                 # ✅ Updated with headers + WASM
└── package.json                   # ✅ Includes comlink
```

---

## 🧪 Testing the Worker

### 1. Start the Dev Server

```bash
npm run dev
```

### 2. Open Browser Console

- Open DevTools (F12)
- Go to Console tab
- Look for: `"Hello from the ZK worker!"`

**If you see this message, the worker is working! ✅**

### 3. Test ZK Operations

The worker is ready to use for:
- ✅ Proof generation (`createProof`)
- ✅ Proof verification (`verifyProof`)
- ✅ Hash calculation (`calculateExpectedHash`)

---

## 🔧 Using the Worker in Your Code

### Basic Usage

```typescript
import ZkWorkerClient from "./workers/zkWorkerClient";

// Create worker client
const workerClient = new ZkWorkerClient();

// Test worker
const message = await workerClient.sayHi();
console.log(message); // "Hello from the ZK worker!"

// Generate proof (runs in worker, doesn't block UI)
const proof = await workerClient.createProof(
  "John Doe",
  "1990-01-01",
  "ABC123"
);

// Verify proof (runs in worker, doesn't block UI)
const isValid = await workerClient.verifyProof(proof);
```

### Integration Example

You can now update your API routes or frontend to use workers:

**Option 1: Keep Server-Side (Current)**
- API routes use `lib/zk.ts` (server-side)
- Workers available for client-side operations

**Option 2: Use Workers (Client-Side)**
- Frontend uses `ZkWorkerClient` directly
- Operations run in browser worker thread
- No server round-trip needed

---

## 📝 Key Concepts

### COOP and COEP Headers

**Why needed:**
- o1js uses `SharedArrayBuffer` for WASM
- `SharedArrayBuffer` requires COOP/COEP headers
- Without these headers, WASM won't work in browsers

**What they do:**
- `COOP: same-origin` - Restricts cross-origin access
- `COEP: require-corp` - Requires cross-origin resources to be CORS-enabled

### Web Workers

**Why use workers:**
- ZK proof generation takes 10-30 seconds
- Without workers, the UI freezes during proof generation
- Workers run in a separate thread, keeping UI responsive

**How Comlink helps:**
- Makes worker communication easy (RPC-style)
- No need to manually handle `postMessage`
- Type-safe API access

---

## ⚠️ Important Notes

### Performance

1. **First Proof Generation**: ~30-60 seconds
   - Compilation: ~30 seconds (one-time)
   - Proof generation: ~10-30 seconds
   - Worker keeps UI responsive during this time!

2. **Subsequent Proofs**: ~10-30 seconds
   - Compilation is cached
   - Only proof generation needed

3. **Verification**: ~1 second
   - Fast verification
   - Also runs in worker (non-blocking)

### Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Requires COOP/COEP headers (now configured)
- ✅ SharedArrayBuffer support (enabled by headers)

### Server vs Client

**Current Setup:**
- Server-side API routes still work (`lib/zk.ts`)
- Client-side workers also available (`zkWorker.ts`)
- You can use either or both!

**Recommendation:**
- Use server-side for production (more secure)
- Use workers for client-side operations (better UX)

---

## 🐛 Troubleshooting

### Error: "Worker not loading"

**Solution:**
1. Check browser console for errors
2. Ensure COOP/COEP headers are set (check Network tab)
3. Verify `next.config.ts` has correct headers

### Error: "WASM files not found"

**Solution:**
1. Clear `.next` cache: `Remove-Item -Recurse -Force .next`
2. Restart dev server
3. Check webpack config in `next.config.ts`

### Error: "SharedArrayBuffer not available"

**Solution:**
1. Check COOP/COEP headers are set
2. Verify headers are returned in Network tab
3. Ensure using HTTPS (or localhost for development)

---

## 🎯 Next Steps

1. **Test the worker:**
   - Start dev server
   - Check browser console for "Hello from the ZK worker!"

2. **Use workers for ZK operations:**
   - Update frontend to use `ZkWorkerClient`
   - Or keep server-side API routes (current setup)

3. **Optimize for production:**
   - Pre-compile ZK program
   - Cache compiled results
   - Add error handling

---

## 📚 Resources

- [o1js Documentation](https://o1-labs.github.io/o1js/)
- [Comlink Documentation](https://github.com/GoogleChromeLabs/comlink)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [SharedArrayBuffer MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)

---

## ✅ Summary

You now have:
- ✅ COOP/COEP headers configured (required for WASM)
- ✅ Webpack WASM support enabled
- ✅ Comlink installed and configured
- ✅ Web worker infrastructure set up
- ✅ Worker test in place
- ✅ Ready for production ZK operations!

**The worker is ready to use!** 🚀

Check your browser console to confirm the worker is working.

