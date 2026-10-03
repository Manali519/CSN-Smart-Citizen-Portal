import React, { useEffect, useState } from 'react';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout.js';
import { fetchMyPayments } from '../services/payments/index.js';
import './PaymentTest.css';

const PRESET_AMOUNTS = [1, 49, 199, 499];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10000;

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

const formatDate = (value) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function PaymentTest() {
  const { pay, processing } = useRazorpayCheckout();
  const [amount, setAmount] = useState('49');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchMyPayments()
      .then((res) => setHistory(res.payments || []))
      .catch(() => setHistory([]));
  }, []);

  const amountValue = Number(amount);
  const amountValid = Number.isInteger(amountValue) && amountValue >= MIN_AMOUNT && amountValue <= MAX_AMOUNT;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amountValid || processing) return;
    setError('');
    setResult(null);

    try {
      const payment = await pay({ amount: amountValue, description: description.trim() || undefined });
      setResult(payment);
      setHistory((prev) => [payment, ...prev.filter((p) => p._id !== payment._id)].slice(0, 20));
    } catch (err) {
      if (!err.cancelled) setError(err.message || 'Payment could not be completed.');
    }
  }

  return (
    <section className="section payment-test">
      <div className="container payment-test-inner">
        <header className="payment-test-header">
          <span className="payment-test-tag">Razorpay · Test Mode</span>
          <h1>Online Payment</h1>
          <p>
            Make a test payment through Razorpay Checkout. 
          </p>
        </header>

        <div className="payment-test-grid">
          <form className="payment-card" onSubmit={handleSubmit} noValidate>
            <h2>Payment details</h2>

            <label htmlFor="pay-amount">Amount (₹)</label>
            <input
              id="pay-amount"
              type="number"
              inputMode="numeric"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!amountValid}
              aria-describedby="pay-amount-hint"
              disabled={processing}
            />
            <small id="pay-amount-hint" className={amountValid ? '' : 'payment-error-text'}>
              Whole rupees, ₹{MIN_AMOUNT} – ₹{MAX_AMOUNT.toLocaleString('en-IN')}.
            </small>

            <div className="payment-presets" role="group" aria-label="Quick amounts">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`payment-preset${amountValue === value ? ' is-active' : ''}`}
                  onClick={() => setAmount(String(value))}
                  disabled={processing}
                >
                  ₹{value}
                </button>
              ))}
            </div>

            <label htmlFor="pay-description">Description (optional)</label>
            <input
              id="pay-description"
              type="text"
              maxLength={120}
              placeholder="Smart City Portal test payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={processing}
            />

            {error && (
              <p className="payment-alert payment-alert-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary payment-submit" disabled={!amountValid || processing}>
              {processing ? 'Processing…' : `Pay ₹${amountValid ? amountValue.toLocaleString('en-IN') : '—'}`}
            </button>
          </form>

          <aside className="payment-card payment-help">
            <h2>Test credentials</h2>
            <ul>
              <li>
                <strong>UPI:</strong> use VPA <code>success@razorpay</code>
              </li>
              <li>
                <strong>Card:</strong> any Razorpay test card, any future expiry, any CVV, any OTP
              </li>
              <li>
                <strong>Netbanking:</strong> pick any bank and choose <em>Success</em>
              </li>
            </ul>
            <a
              href="https://razorpay.com/docs/payments/payments/test-card-details/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Razorpay test card list ↗
            </a>
          </aside>
        </div>

        {result && (
          <div className="payment-card payment-success" role="status" aria-live="polite">
            <h2>Payment successful</h2>
            <dl>
              <dt>Amount</dt>
              <dd>{formatInr(result.amount)}</dd>
              <dt>Receipt</dt>
              <dd>{result.receipt}</dd>
              <dt>Payment ID</dt>
              <dd><code>{result.razorpayPaymentId}</code></dd>
              <dt>Order ID</dt>
              <dd><code>{result.razorpayOrderId}</code></dd>
              {result.method && (
                <>
                  <dt>Method</dt>
                  <dd className="payment-method">{result.method}</dd>
                </>
              )}
              <dt>Paid at</dt>
              <dd>{formatDate(result.paidAt)}</dd>
            </dl>
          </div>
        )}

        {history.length > 0 && (
          <div className="payment-card payment-history">
            <h2>Recent test payments</h2>
            <div className="payment-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Receipt</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Method</th>
                    <th scope="col">Paid at</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p._id}>
                      <td>{p.receipt}</td>
                      <td>{formatInr(p.amount)}</td>
                      <td className="payment-method">{p.method || '—'}</td>
                      <td>{formatDate(p.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
