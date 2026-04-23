import { useState, useEffect, useRef, useCallback } from 'react';
import { db, dbLoad, dbSave, dbDelete } from '../db';
import { hashPIN } from '../utils/crypto';
import { I } from './ui/Icons';
import Modal from './ui/Modal';

const PIN_KEY = 'crew-pin-hash';
const FAILS_KEY = 'crew-pin-fails';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('check'); // 'create' | 'verify' | 'check'
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const inputRef = useRef(null);

  // Countdown ticker when locked
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    (async () => {
      const pinHash = await dbLoad(PIN_KEY);
      const fails = await dbLoad(FAILS_KEY);
      if (fails?.lockedUntil > Date.now()) setLockedUntil(fails.lockedUntil);
      setStep(pinHash ? 'check' : 'create');
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => inputRef.current?.focus(), 150);
  }, [loading, step]);

  const cur = step === 'verify' ? confirmPin : pin;
  const setCur = step === 'verify' ? setConfirmPin : setPin;

  const recordFail = async () => {
    const prev = (await dbLoad(FAILS_KEY)) || { count: 0, lockedUntil: 0 };
    const count = prev.count + 1;
    const nextLock = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : prev.lockedUntil;
    await dbSave(FAILS_KEY, { count, lockedUntil: nextLock });
    if (count >= MAX_ATTEMPTS) setLockedUntil(nextLock);
    return count;
  };

  const go = useCallback(async () => {
    if (error) return;

    if (step === 'create') {
      if (pin.length !== 4) return;
      setStep('verify');
      setConfirmPin('');
      return;
    }

    if (step === 'verify') {
      if (confirmPin.length !== 4) return;
      if (confirmPin !== pin) {
        setError('PIN이 일치하지 않습니다');
        setConfirmPin('');
        return;
      }
      await dbSave(PIN_KEY, await hashPIN(pin));
      onUnlock();
      return;
    }

    // step === 'check'
    if (pin.length !== 4) return;

    if (lockedUntil > Date.now()) return;

    const h = await hashPIN(pin);
    const stored = await dbLoad(PIN_KEY);
    if (h === stored) {
      await dbDelete(FAILS_KEY);
      onUnlock();
    } else {
      const count = await recordFail();
      const remaining = MAX_ATTEMPTS - count;
      setError(remaining > 0
        ? `PIN이 올바르지 않습니다 (${remaining}회 남음)`
        : `${LOCKOUT_MS / 1000}초간 잠금됩니다`
      );
      setPin('');
    }
  }, [step, pin, confirmPin, onUnlock, error, lockedUntil]);

  useEffect(() => {
    if (cur.length === 4) go();
  }, [cur, go]);

  const doReset = async () => {
    await db.people.clear();
    await db.settings.clear();
    setResetModalOpen(false);
    setStep('create');
    setPin('');
    setConfirmPin('');
    setError('');
    setLockedUntil(0);
  };

  const dots = val => (
    <div className="flex gap-4 justify-center my-8">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
            i < val.length ? 'bg-blue-500 scale-110' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-300 text-sm">로딩 중...</div>
      </div>
    );
  }

  const isLocked = lockedUntil > now;
  const lockRemain = Math.ceil((lockedUntil - now) / 1000);

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8">
        <div className="anim-scale w-full max-w-xs">
          <div className="flex justify-center mb-6">
            <I.Lock />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1 m-0">
            {step === 'create' ? 'PIN 설정' : step === 'verify' ? 'PIN 확인' : '잠금 해제'}
          </h1>
          <p className="text-sm text-gray-400 text-center m-0">
            {step === 'create'
              ? '새로운 4자리 PIN을 설정해주세요'
              : step === 'verify'
              ? '한 번 더 입력해주세요'
              : isLocked
              ? `${lockRemain}초 후에 다시 시도하세요`
              : 'PIN 번호를 입력해주세요'}
          </p>

          {dots(cur)}

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={cur}
              disabled={isLocked}
              onChange={e => {
                setCur(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className={`w-full text-center text-2xl tracking-[0.5em] font-mono py-3.5 bg-white rounded-xl border-[1.5px] outline-none transition-colors
                ${isLocked
                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 focus:border-blue-400'
                }`}
              placeholder="••••"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute right-3 p-1 bg-transparent border-0 cursor-pointer"
            >
              {showPin ? <I.EyeOff /> : <I.Eye />}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center mt-3 font-medium anim-shake">
              {error}
            </div>
          )}

          {step === 'check' && (
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="w-full mt-6 py-3 text-sm text-gray-400 bg-transparent border-0 cursor-pointer hover:text-gray-500 transition-colors"
            >
              PIN 초기화
            </button>
          )}
        </div>
      </div>

      <Modal
        open={resetModalOpen}
        title="PIN 초기화"
        message="PIN을 초기화하면 등록된 모든 인원 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="초기화"
        danger
        onConfirm={doReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </>
  );
}
