import { useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import type { AvailabilityResult } from '@/types';
import { minutesToLabel } from '@/availability';
import {
  requestExplanation,
  deriveReasonCode,
  type ExplanationResponse,
} from '@/explanationAdapter';

interface ResultPanelProps {
  result: AvailabilityResult | null;
  start: number;
  end: number;
  duration: number;
  showDuration: boolean;
  roomName: string;
}

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; response: ExplanationResponse };

export function ResultPanel({ result, start, end, duration, showDuration, roomName }: ResultPanelProps) {
  const [explain, setExplain] = useState<ExplainState>({ status: 'idle' });

  const handleExplain = async () => {
    if (!result) return;
    setExplain({ status: 'loading' });
    const reasonCode = deriveReasonCode(result.reason, result.available);
    const startLabel = minutesToLabel(start);
    const endLabel = minutesToLabel(end);
    const response = await requestExplanation({
      roomLabel: roomName || 'the selected room',
      startLabel,
      endLabel,
      isAvailable: result.available,
      reasonCode,
    });
    setExplain({ status: 'ready', response });
  };

  const handleDismissExplanation = () => {
    setExplain({ status: 'idle' });
  };

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
        Select a room and time, then check availability.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl p-4 transition-all duration-300 ${
          result.available
            ? 'border border-emerald-200 bg-emerald-50'
            : 'border border-rose-200 bg-rose-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {result.available ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`font-bold text-lg ${
                result.available ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {result.available ? 'Available' : 'Unavailable'}
            </p>
            <p
              className={`text-sm mt-0.5 ${
                result.available ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.reason}
            </p>
            {showDuration && (
              <p className="text-xs text-slate-500 mt-1.5">
                Requested: {minutesToLabel(start)} – {minutesToLabel(end)} ({duration} min)
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExplain}
                disabled={explain.status === 'loading'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] focus:ring-2 focus:ring-sky-500/30 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                aria-expanded={explain.status === 'ready'}
                aria-controls="explanation-box"
              >
                {explain.status === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Explaining…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Explain availability
                  </>
                )}
              </button>
              {explain.status === 'ready' && (
                <button
                  type="button"
                  onClick={handleDismissExplanation}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                >
                  <RotateCcw className="w-3 h-3" />
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {explain.status === 'ready' && (
        <div
          id="explanation-box"
          role="region"
          aria-label="Availability explanation"
          className={`rounded-xl border p-4 ${
            explain.response.source === 'fallback'
              ? 'border-amber-200 bg-amber-50'
              : 'border-sky-200 bg-sky-50'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {explain.response.source === 'fallback' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  explain.response.source === 'fallback'
                    ? 'text-amber-700'
                    : 'text-sky-700'
                }`}
              >
                {explain.response.source === 'fallback'
                  ? 'Explanation unavailable'
                  : 'Explanation'}
              </p>
              <p
                className={`text-sm mt-1 ${
                  explain.response.source === 'fallback'
                    ? 'text-amber-800'
                    : 'text-sky-900'
                }`}
              >
                {explain.response.explanation}
              </p>
              {explain.response.source === 'fallback' && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  This is a fallback message — the availability status above remains authoritative.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
