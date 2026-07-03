"use client";

import { useState } from 'react';

export default function AboutPage() {
  const [category, setCategory] = useState('Concern');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) {
        alert("File size exceeds 5MB limit");
        e.target.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert("Only image files are allowed");
        e.target.value = '';
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    const formData = new FormData();
    formData.append('category', category);
    formData.append('message', message);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmitStatus('success');
        setMessage('');
        setScreenshot(null);
        if (document.getElementById('file-input')) {
          document.getElementById('file-input').value = '';
        }
      } else {
        const data = await res.json();
        setSubmitStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setSubmitStatus('Error: Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container">
      <header className="header" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem' }}>About & Support</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

        {/* Left Column: FAQs & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="auth-box" style={{ maxWidth: '100%', padding: '2rem' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Frequently Asked Questions
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>1. Do I need to download anything?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You don't have to download anything. After creating your account, you can use the website instantly from any browser.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>2. Do I need to connect my GrandChase account?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>No, this tracker is completely standalone. Your tracker account is entirely separate from your Steam and GrandChase accounts to ensure your game data remains secure.</p>
            </div>

            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>3. Do I have to pay to use the website?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>No, this tool is 100% free to use. However, donations to help cover server costs are always deeply appreciated!</p>
            </div>
          </div>

          <div className="auth-box" style={{ maxWidth: '100%', padding: '2rem' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Submit Feedback
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Have any concerns, feature suggestions, or bug reports? Submit them here and they will be sent directly to my email!
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Category</label>
                <select
                  className="search-input"
                  style={{ width: '100%', background: 'var(--bg-deep-void)' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Concern">Concern</option>
                  <option value="Suggestions">Suggestions</option>
                  <option value="Bug Reports">Bug Reports</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Message</label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical', background: 'var(--bg-deep-void)', padding: '1rem' }}
                  placeholder="Describe your concern or suggestion here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Screenshot (Optional, Max 5MB)</label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-deep-void)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !message.trim()}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
              </button>

              {submitStatus === 'success' && (
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                  Feedback successfully sent! Thank you.
                </div>
              )}
              {submitStatus && submitStatus !== 'success' && (
                <div style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', color: 'var(--status-danger)', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.3)', textAlign: 'center' }}>
                  {submitStatus}
                </div>
              )}
            </form>

            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Or reach out directly:</h3>
              <div style={{ background: 'var(--bg-deep-void)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p><strong>Discord:</strong> rielcs</p>
                <p style={{ marginTop: '0.5rem' }}><strong>Email:</strong> elepanogabriel2004@gmail.com</p>
                <p style={{ marginTop: '0.5rem' }}><strong>GitHub:</strong> <a href="https://github.com/gaaabu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-bright)' }}>github.com/gaaabu</a></p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Donate */}
        <div className="auth-box" style={{ maxWidth: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <h2 style={{ color: 'var(--status-done)', marginBottom: '1rem', textAlign: 'center' }}>Support the Developer</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            If you find this tracker useful, consider buying me a potcor! All donations go directly toward keeping the servers running and funding future features.
          </p>

          <div style={{ background: 'var(--bg-deep-void)', padding: '2rem', borderRadius: '16px', border: '2px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '350px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Scan with GCash</h3>
            <div style={{ width: '250px', height: '250px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              <img
                src="/images/gcash_qr.webp"
                alt="GCash QR Code"
                style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 10 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span style={{ fontSize: '0.9rem' }}>Upload your QR code to<br /><strong style={{ color: 'var(--accent-bright)' }}>public/images/gcash_qr.webp</strong><br />to display it here.</span>
              </div>
            </div>
            <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              Thank you for your support!
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
