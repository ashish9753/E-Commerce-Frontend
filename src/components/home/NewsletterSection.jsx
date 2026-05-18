import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { validators } from '../../utils/validators';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validators.email(email);
    if (err) { toast(err, 'error'); return; }
    toast('Subscribed! Check your inbox for exclusive deals.');
    setEmail('');
  };

  return (
    <section className="py-18">
      <div className="wrap">
        <div className="bg-surface rounded-3xl p-15 grid grid-cols-2 gap-12 items-center max-md:grid-cols-1 max-md:p-8">
          <div>
            <div className="kicker">Newsletter</div>
            <h3 className="font-serif text-[42px] leading-[1.05] tracking-tight font-normal mt-2">
              Get exclusive deals & <i>early access</i>
            </h3>
            <p className="text-mute mt-2.5">Join 50,000+ subscribers. Get the best deals, new arrivals, and exclusive offers right in your inbox.</p>
          </div>
          <div>
            <form className="flex gap-2.5 mt-5" onSubmit={handleSubmit}>
              <input
                className="input h-12.5 flex-1"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary h-12.5">Subscribe</button>
            </form>
            <p className="text-xs text-mute mt-2.5">No spam. Unsubscribe anytime. By subscribing you agree to our privacy policy.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
