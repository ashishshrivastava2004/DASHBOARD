import React, { useState } from 'react';
import { WaitlistEntry } from '../../types';
import { X, Sparkles, UserPlus } from 'lucide-react';

interface NewWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: Omit<WaitlistEntry, 'id' | 'signup_date' | 'position'>) => void;
}

export const NewWaitlistModal: React.FC<NewWaitlistModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<WaitlistEntry['tier']>('Standard Queue');
  const [referrals, setReferrals] = useState(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    onAddEntry({
      full_name: fullName,
      email,
      phone: phone || undefined,
      drop_code: 'DROP_01',
      tier,
      referral_count: referrals,
      status: 'waiting',
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-10 overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-900" />
            <h2 className="font-clash text-lg font-bold text-neutral-900">Add to Drop 01 Waitlist</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Julian Rowe"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Subscriber Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="julian@archdesign.com"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Access Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as WaitlistEntry['tier'])}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
              >
                <option value="VIP Early Access">VIP Early Access</option>
                <option value="Standard Queue">Standard Queue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Referral Count
              </label>
              <input
                type="number"
                min="0"
                value={referrals}
                onChange={(e) => setReferrals(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Phone (Optional SMS Alert)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 212 555 0199"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Curator Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referred by Paris studio gallery partner..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-neutral-900 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-neutral-900 hover:bg-black text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Subscriber</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
