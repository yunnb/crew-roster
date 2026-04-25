import { useState, useEffect, useRef, useCallback } from 'react';
import { db, dbLoad, dbSave, dbDelete } from '../db';
import { hashPIN } from '../utils/crypto';
import { I } from './ui/Icons';
import Modal from './ui/Modal';

const PIN_KEY = 'crew-pin-hash';

/* PIN 해시 저장소 — localStorage(빠름·동기) + IndexedDB(폴백) 이중화.
 * 한쪽이 차단/실패해도 다른 쪽이 살아있으면 PIN이 유지됨. */

const lsGet    = () => { try { return localStorage.getItem(PIN_KEY); } catch { return null; } };
const lsSet    = h  => { try { localStorage.setItem(PIN_KEY, h); return true; } catch { return false; } };
const lsRemove = () => { try { localStorage.removeItem(PIN_KEY); } catch { /* noop */ } };

async function loadPinHash() {
  const ls = lsGet();
  if (ls) return ls;
  // localStorage가 비어있으면 IndexedDB에서 복구 시도
  const idb = await dbLoad(PIN_KEY);
  if (typeof idb === 'string' && idb) {
    lsSet(idb);
    return idb;
  }
  return null;
}

async function savePinHash(hash) {
  const okLs = lsSet(hash);
  // IndexedDB에도 함께 저장 (둘 중 하나는 살아있어야 다음 세션에서 로드 가능)
  try { await dbSave(PIN_KEY, hash); } catch (e) { console.error('PIN dbSave 실패', e); }
  if (!okLs) console.warn('PIN localStorage 저장 실패 — IndexedDB 폴백 사용');
}

async function clearPinHash() {
  lsRemove();
  await dbDelete(PIN_KEY);
}

export default function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('check'); // 'create' | 'verify' | 'check'
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const inputRef = useRef(null);
  const busyRef  = useRef(false); // 신규 PIN 저장 중 재진입 방지

  useEffect(() => {
    (async () => {
      const h = await loadPinHash();
      setStep(h ? 'check' : 'create');
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => inputRef.current?.focus(), 150);
  }, [loading, step]);

  const cur = step === 'verify' ? confirmPin : pin;
  const setCur = step === 'verify' ? setConfirmPin : setPin;

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
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await savePinHash(await hashPIN(pin)); // localStorage + IndexedDB 이중 저장
      } finally {
        onUnlock();
        busyRef.current = false;
      }
      return;
    }

    // step === 'check'
    if (pin.length !== 4) return;
    const h = await hashPIN(pin);
    if (h === (await loadPinHash())) {
      onUnlock();
    } else {
      setError('PIN이 올바르지 않습니다');
      setPin('');
    }
  }, [step, pin, confirmPin, onUnlock, error]);

  useEffect(() => {
    if (cur.length === 4) go();
  }, [cur, go]);

  const doReset = async () => {
    await db.people.clear();
    await db.settings.clear();
    await clearPinHash();
    setResetModalOpen(false);
    setStep('create');
    setPin('');
    setConfirmPin('');
    setError('');
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
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-300 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-8">
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
              onChange={e => {
                setCur(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="w-full text-center text-[16px] tracking-[0.5em] font-mono py-3.5 bg-white rounded-xl border-[1.5px] border-gray-200 outline-none focus:border-blue-400 transition-colors"
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
