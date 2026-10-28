/**
 * Device capability profile for the OCG browser voice runtime.
 *
 * Decides execution providers and worker thread count from what the
 * device reports. Deliberately conservative: synthesis QUALITY is
 * never reduced adaptively (same steps, same model) — adaptation only
 * changes where and how wide inference runs, and flags constrained
 * devices so the UI can set expectations before a big download.
 */
export interface DeviceSignals {
  hardwareConcurrency?: number;
  /** navigator.deviceMemory in GB (Chrome-only, approximate buckets). */
  deviceMemoryGB?: number;
  mobileUserAgent?: boolean;
  crossOriginIsolated?: boolean;
  webgpuAdapter?: boolean;
}

export interface DeviceProfile {
  providers: string[];
  numThreads: number;
  constrained: boolean;
  reasons: string[];
}

export function selectDeviceProfile(s: DeviceSignals): DeviceProfile {
  const reasons: string[] = [];
  const providers = s.webgpuAdapter ? ["webgpu", "wasm"] : ["wasm"];
  if (s.webgpuAdapter) reasons.push("webgpu adapter present");
  const cores = s.hardwareConcurrency ?? 2;
  // WASM threads need SharedArrayBuffer, which needs cross-origin
  // isolation; ORT ignores numThreads without it.
  const numThreads = s.crossOriginIsolated ? Math.max(1, Math.min(4, cores)) : 1;
  reasons.push(`threads=${numThreads} (cores=${cores}, isolated=${!!s.crossOriginIsolated})`);
  const lowMemory = (s.deviceMemoryGB ?? 8) <= 2;
  const constrained = lowMemory || (s.mobileUserAgent === true && cores <= 4);
  if (lowMemory) reasons.push("deviceMemory <= 2GB");
  if (constrained) reasons.push("constrained tier");
  return { providers, numThreads, constrained, reasons };
}

/** Probe for a usable WebGPU adapter (false on any failure). */
export async function probeWebGPU(): Promise<boolean> {
  try {
    const gpu = (self as any).navigator?.gpu;
    if (!gpu?.requestAdapter) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}
