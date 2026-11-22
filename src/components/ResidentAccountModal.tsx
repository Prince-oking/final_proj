import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, UserPlus, Users, X } from 'lucide-react';
import type { ResidentAccount } from '../types/portal';
import { PUROK_LIST, validateResidentRegistration } from '../utils/portalLogic';

interface ResidentAccountModalProps {
  isOpen: boolean;
  residents: ResidentAccount[];
  activeResidentId: string;
  onSelectResident: (id: string) => void;
  onCreateResident: (resident: ResidentAccount) => void;
  onClose: () => void;
}

export function ResidentAccountModal({
  isOpen,
  residents,
  activeResidentId,
  onSelectResident,
  onCreateResident,
  onClose,
}: ResidentAccountModalProps) {
  const [tab, setTab] = useState<'switch' | 'register'>('switch');
  const [fullName, setFullName] = useState('');
  const [purok, setPurok] = useState(PUROK_LIST[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateResidentRegistration({
      fullName,
      purok,
      address,
      phone,
      email,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const newResident: ResidentAccount = {
      id: `res-${Date.now()}`,
      fullName: fullName.trim(),
      purok,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    onCreateResident(newResident);
    setFullName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setErrors({});
    setTab('switch');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resident-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2
              id="resident-account-title"
              className="text-base font-bold text-slate-900"
            >
              Resident Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a sample resident profile or register a new barangay resident.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resident account dialog"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setTab('switch')}
              className={`min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                tab === 'switch'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Switch Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Register Resident</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {tab === 'switch' ? (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {residents.map((resident) => {
                const isSelected = resident.id === activeResidentId;
                return (
                  <button
                    key={resident.id}
                    type="button"
                    onClick={() => {
                      onSelectResident(resident.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {resident.fullName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {resident.purok} · {resident.phone}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 shrink-0">
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Active</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleRegister} noValidate className="space-y-3.5">
              <div>
                <label
                  htmlFor="reg-fullname"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Ramon M. Bautista"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-700 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reg-purok"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    Purok / Zone
                  </label>
                  <select
                    id="reg-purok"
                    value={purok}
                    onChange={(e) => setPurok(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {PUROK_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    Contact Number
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-700 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-address"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  House / Street Address
                </label>
                <input
                  id="reg-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street Name, Landmark"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                {errors.address && (
                  <p className="text-xs text-red-700 mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Email Address <span className="font-normal text-slate-500">(Optional)</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.ph"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                {errors.email && (
                  <p className="text-xs text-red-700 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
                >
                  Save &amp; Use Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
