import { useCallback, useState } from 'react';
import { fetchPaymentConfig, createPaymentOrder, verifyPayment } from '../services/payments/index.js';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptPromise = null;

/** Loads Razorpay Checkout once per page; later calls reuse the same promise. */
function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function useRazorpayCheckout() {
  const [processing, setProcessing] = useState(false);

  const pay = useCallback(async ({ amount, description }) => {
    setProcessing(true);
    try {
      const [config, orderRes] = await Promise.all([
        fetchPaymentConfig(),
        createPaymentOrder({ amount, description }),
        loadCheckoutScript(),
      ]);
      const { order, prefill } = orderRes;

      const checkoutResponse = await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: config.keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'Smart City Portal',
          description: order.description,
          image: '/assets/logo.png',
          prefill,
          notes: { receipt: order.receipt },
          theme: { color: '#0B3D91' },
          handler: resolve,
          modal: {
            ondismiss: () => {
              const err = new Error('Payment cancelled.');
              err.cancelled = true;
              reject(err);
            },
          },
        });
        rzp.open();
      });

      const { payment } = await verifyPayment({
        razorpay_order_id: checkoutResponse.razorpay_order_id,
        razorpay_payment_id: checkoutResponse.razorpay_payment_id,
        razorpay_signature: checkoutResponse.razorpay_signature,
      });
      return payment;
    } finally {
      setProcessing(false);
    }
  }, []);

  return { pay, processing };
}
