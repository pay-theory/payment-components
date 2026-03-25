import { CARD_IFRAME, BANK_IFRAME, CASH_IFRAME } from '../common/data';
import { complianceBeaconString } from '../common/message';
import { hostedFieldsEndpoint } from '../common/network';
import { generateUUID } from '../field-set/payment-fields-v2';

const COMPLIANCE_META_SELECTOR = 'meta[name="pt-compliance-id"]';
const CSP_META_SELECTOR = 'meta[http-equiv="Content-Security-Policy"]';
const RELAY_TARGET_NAMES = [CARD_IFRAME, BANK_IFRAME, CASH_IFRAME];

export interface ComplianceScriptRecord {
  normalized_url: string;
  raw_url?: string;
  integrity_hash?: string;
  crossorigin?: string;
  nonce?: string;
  type?: string;
  async: boolean;
  defer: boolean;
  is_inline: boolean;
  inline_content_hash?: string;
  injection_timing?: 'initial' | 'late';
}

export interface ComplianceCSPPolicy {
  source: 'meta_tag';
  value: string;
}

export interface ComplianceBeaconPayload {
  contract_version: 'v1';
  source: 'client';
  snapshot_type: 'client_initial' | 'client_final';
  compliance_id: string;
  page_key: string;
  timestamp: string;
  origin: string;
  sdk_status?: 'ok' | 'offline' | 'unknown';
  csp_policy?: ComplianceCSPPolicy;
  scripts: ComplianceScriptRecord[];
}

export interface ComplianceBeaconMessage {
  type: typeof complianceBeaconString;
  data: ComplianceBeaconPayload;
}

export interface ComplianceBeaconController {
  start(): Promise<void>;
  flushFinalSnapshot(): Promise<void>;
  stop(): void;
}

interface ComplianceMeta {
  complianceId: string;
  pageKey: string;
  sdkStatus?: 'ok' | 'offline' | 'unknown';
}

let activeBeaconController: ComplianceBeaconController | null = null;

const encodeBytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const sha256 = async (value: string): Promise<string> => {
  const subtle = window.crypto?.subtle;
  if (!subtle) {
    return `sha256-${window.btoa(value).slice(0, 32)}`;
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return `sha256-${encodeBytesToBase64(new Uint8Array(digest))}`;
};

const normalizeExternalUrl = (rawUrl: string, locationRef: Location): string => {
  try {
    const url = new URL(rawUrl, locationRef.href);
    url.hash = '';
    return url.toString();
  } catch {
    return rawUrl;
  }
};

const readComplianceMeta = (documentRef: Document, locationRef: Location): ComplianceMeta => {
  const correlationMeta = documentRef.querySelector<HTMLMetaElement>(COMPLIANCE_META_SELECTOR);

  if (!correlationMeta) {
    return {
      complianceId: `client:${generateUUID()}`,
      pageKey: `origin:${locationRef.origin}`,
    };
  }

  const sdkStatus = correlationMeta.dataset.ptStatus;
  const pageKey = correlationMeta.dataset.ptPageKey || `route:${locationRef.pathname}`;

  return {
    complianceId: correlationMeta.content,
    pageKey,
    sdkStatus:
      sdkStatus === 'ok' || sdkStatus === 'offline' || sdkStatus === 'unknown'
        ? sdkStatus
        : 'unknown',
  };
};

const readCSPPolicy = (documentRef: Document): ComplianceCSPPolicy | undefined => {
  const cspValues = Array.from(documentRef.querySelectorAll<HTMLMetaElement>(CSP_META_SELECTOR))
    .map(meta => meta.content.trim())
    .filter(Boolean);

  if (!cspValues.length) {
    return undefined;
  }

  return {
    source: 'meta_tag',
    value: cspValues.join('; '),
  };
};

const collectAddedScripts = (node: Node): HTMLScriptElement[] => {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  const scripts: HTMLScriptElement[] = [];
  if (element.tagName === 'SCRIPT') {
    scripts.push(element as HTMLScriptElement);
  }

  scripts.push(...Array.from(element.querySelectorAll('script')));
  return scripts;
};

const findComplianceRelayTarget = (documentRef: Document = document): HTMLIFrameElement | null => {
  for (const name of RELAY_TARGET_NAMES) {
    const candidate = documentRef.getElementsByName(name)[0];
    if (candidate instanceof HTMLIFrameElement && candidate.contentWindow) {
      return candidate;
    }
  }

  return null;
};

const serializeScript = async (
  script: HTMLScriptElement,
  injectionTiming: 'initial' | 'late',
  locationRef: Location,
): Promise<ComplianceScriptRecord> => {
  const rawUrl = script.getAttribute('src') || script.src || '';
  const isInline = rawUrl.trim() === '';

  if (isInline) {
    const inlineContentHash = await sha256(script.textContent || '');
    return {
      normalized_url: `inline:${inlineContentHash}`,
      integrity_hash: script.getAttribute('integrity') || undefined,
      crossorigin: script.getAttribute('crossorigin') || undefined,
      nonce: script.getAttribute('nonce') || script.nonce || undefined,
      type: script.getAttribute('type') || undefined,
      async: script.async,
      defer: script.defer,
      is_inline: true,
      inline_content_hash: inlineContentHash,
      injection_timing: injectionTiming,
    };
  }

  return {
    normalized_url: normalizeExternalUrl(rawUrl, locationRef),
    raw_url: rawUrl,
    integrity_hash: script.getAttribute('integrity') || undefined,
    crossorigin: script.getAttribute('crossorigin') || undefined,
    nonce: script.getAttribute('nonce') || script.nonce || undefined,
    type: script.getAttribute('type') || undefined,
    async: script.async,
    defer: script.defer,
    is_inline: false,
    injection_timing: injectionTiming,
  };
};

export const buildComplianceBeaconPayload = async (
  snapshotType: ComplianceBeaconPayload['snapshot_type'],
  options?: {
    documentRef?: Document;
    locationRef?: Location;
    lateScripts?: WeakSet<HTMLScriptElement>;
  },
): Promise<ComplianceBeaconPayload> => {
  const documentRef = options?.documentRef || document;
  const locationRef = options?.locationRef || window.location;
  const lateScripts = options?.lateScripts;
  const meta = readComplianceMeta(documentRef, locationRef);
  const cspPolicy = readCSPPolicy(documentRef);
  const scriptElements = Array.from(documentRef.querySelectorAll<HTMLScriptElement>('script'));
  const scripts = await Promise.all(
    scriptElements.map(script =>
      serializeScript(script, lateScripts?.has(script) ? 'late' : 'initial', locationRef),
    ),
  );

  const payload: ComplianceBeaconPayload = {
    contract_version: 'v1',
    source: 'client',
    snapshot_type: snapshotType,
    compliance_id: meta.complianceId,
    page_key: meta.pageKey,
    timestamp: new Date().toISOString(),
    origin: locationRef.origin,
    scripts,
  };

  if (meta.sdkStatus) {
    payload.sdk_status = meta.sdkStatus;
  }

  if (cspPolicy) {
    payload.csp_policy = cspPolicy;
  }

  return payload;
};

class DOMComplianceBeaconController implements ComplianceBeaconController {
  private documentRef: Document;
  private locationRef: Location;
  private lateScripts: WeakSet<HTMLScriptElement>;
  private mutationObserver: MutationObserver | null = null;
  private finalSnapshotSent = false;
  private started = false;
  private cleanupHandlers: Array<() => void> = [];

  constructor(documentRef: Document = document, locationRef: Location = window.location) {
    this.documentRef = documentRef;
    this.locationRef = locationRef;
    this.lateScripts = new WeakSet<HTMLScriptElement>();
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await this.postSnapshot('client_initial');
    this.observeLateScripts();
    this.registerFinalSnapshotTriggers();
  }

  async flushFinalSnapshot(): Promise<void> {
    if (this.finalSnapshotSent) {
      return;
    }

    this.finalSnapshotSent = true;
    await this.postSnapshot('client_final');
    this.stop();
  }

  stop(): void {
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers = [];

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (activeBeaconController === this) {
      activeBeaconController = null;
    }
  }

  private observeLateScripts(): void {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          collectAddedScripts(node).forEach(script => {
            this.lateScripts.add(script);
          });
        });
      });
    });

    this.mutationObserver.observe(this.documentRef.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private registerFinalSnapshotTriggers(): void {
    const onSubmit = () => {
      void this.flushFinalSnapshot();
    };
    const onPageHide = () => {
      void this.flushFinalSnapshot();
    };
    const onVisibilityChange = () => {
      if (this.documentRef.visibilityState === 'hidden') {
        void this.flushFinalSnapshot();
      }
    };

    this.documentRef.addEventListener('submit', onSubmit, true);
    window.addEventListener('pagehide', onPageHide, true);
    this.documentRef.addEventListener('visibilitychange', onVisibilityChange);

    this.cleanupHandlers.push(() => {
      this.documentRef.removeEventListener('submit', onSubmit, true);
      window.removeEventListener('pagehide', onPageHide, true);
      this.documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  private async postSnapshot(
    snapshotType: ComplianceBeaconPayload['snapshot_type'],
  ): Promise<void> {
    try {
      const iframe = findComplianceRelayTarget(this.documentRef);
      if (!iframe?.contentWindow) {
        return;
      }

      const payload = await buildComplianceBeaconPayload(snapshotType, {
        documentRef: this.documentRef,
        locationRef: this.locationRef,
        lateScripts: this.lateScripts,
      });

      const message: ComplianceBeaconMessage = {
        type: complianceBeaconString,
        data: payload,
      };

      iframe.contentWindow.postMessage(message, hostedFieldsEndpoint);
    } catch (error) {
      console.warn('Failed to send compliance beacon', error);
    }
  }
}

export const startComplianceBeacon = (): ComplianceBeaconController => {
  if (activeBeaconController) {
    return activeBeaconController;
  }

  activeBeaconController = new DOMComplianceBeaconController();
  void activeBeaconController.start();
  return activeBeaconController;
};

export { findComplianceRelayTarget };
