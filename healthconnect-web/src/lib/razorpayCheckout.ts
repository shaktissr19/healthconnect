'use client';

type RazorpayResult = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type CheckoutOptions = {
  key: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: Record<string, string>;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

let loader: Promise<void> | null = null;

export const loadRazorpayCheckout = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay Checkout requires a browser.'));
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-hc-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.hcRazorpay = 'checkout';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
    document.head.appendChild(script);
  }).catch(error => {
    loader = null;
    throw error;
  });

  return loader;
};

export const openRazorpayCheckout = async (options: CheckoutOptions): Promise<RazorpayResult | null> => {
  await loadRazorpayCheckout();
  const RazorpayCtor = window.Razorpay;
  if (!RazorpayCtor) throw new Error('Razorpay Checkout did not initialize.');

  return new Promise<RazorpayResult | null>((resolve, reject) => {
    let settled = false;
    const settle = (value: RazorpayResult | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const razorpay = new RazorpayCtor({
      ...options,
      name: options.name || 'HealthConnect India',
      theme: { color: '#0D9488', ...(options.theme || {}) },
      handler: (response: RazorpayResult) => settle(response),
      modal: {
        ondismiss: () => settle(null),
        escape: true,
        backdropclose: false,
        confirm_close: true,
      },
    });

    razorpay.on?.('payment.failed', (response: any) => {
      if (settled) return;
      settled = true;
      reject(new Error(response?.error?.description || 'Payment failed.'));
    });

    razorpay.open();
  });
};
