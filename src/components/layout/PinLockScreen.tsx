import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { verifyPin } from '../../lib/security';
import { Lock, Delete } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { settings, setLock } = useFinanceStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!settings.pinHash) {
    return null;
  }

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      // Auto verify when reached standard length 6 or 4
      if (nextPin.length >= 4) {
        verifyPin(nextPin, settings.pinHash!).then((isValid) => {
          if (isValid) {
            setLock(false);
          } else if (nextPin.length === 6) {
            setErrorMsg('PIN salah, silakan coba lagi');
            setPin('');
          }
        });
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  const handleManualSubmit = async () => {
    if (pin.length < 4) {
      setErrorMsg('Masukkan minimal 4 digit PIN');
      return;
    }
    const isValid = await verifyPin(pin, settings.pinHash!);
    if (isValid) {
      setLock(false);
    } else {
      setErrorMsg('PIN salah, silakan coba lagi');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-teal-900/30 text-teal-400 border border-teal-800/40">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">Noven Wallet Terkunci</h2>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan PIN keamanan untuk membuka akses keuangan Anda
          </p>
        </div>

        {/* Pin Dots */}
        <div className="flex justify-center gap-3 my-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                idx < pin.length
                  ? 'bg-teal-400 scale-110 shadow-xs shadow-teal-400/50'
                  : 'border border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium animate-pulse">
            {errorMsg}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 text-xl font-medium rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 transition border border-slate-800"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Hapus digit"
            className="h-14 flex items-center justify-center rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 active:scale-95 transition border border-slate-800/50"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 text-xl font-medium rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 transition border border-slate-800"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleManualSubmit}
            className="h-14 flex items-center justify-center text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white active:scale-95 transition"
          >
            Buka
          </button>
        </div>
      </div>
    </div>
  );
};
