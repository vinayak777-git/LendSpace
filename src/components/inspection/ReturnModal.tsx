import React, { useState } from 'react';
import { Booking, Resource } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { bookingService } from '../../services/bookingService';
import {
  X,
  RotateCcw,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Star,
  Columns,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReturnModalProps {
  booking: Booking;
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  booking,
  resource,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, showToast } = useAppStore();

  const standardItems = resource.checklistItems || [
    'Workspace and tool head clean and free of leftover materials',
    'Power cords, emergency stop, and indicators functional',
    'Safety shields, ventilation, and interlocks securely engaged',
    'All included accessories accounted for in designated storage slots',
  ];

  const [checklist, setChecklist] = useState<
    { item: string; passed: boolean; note?: string }[]
  >(
    standardItems.map((item) => ({
      item,
      passed: true,
      note: '',
    }))
  );

  const [notes, setNotes] = useState('Session concluded successfully. Work area vacuumed and reset.');
  const [rating, setRating] = useState(5);
  const [photoPreview, setPhotoPreview] = useState<string>(
    resource.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if session is late
  const isLate = new Date().getTime() > new Date(booking.end).getTime();

  if (!isOpen) return null;

  const handleToggleCheck = (index: number) => {
    setChecklist((prev) =>
      prev.map((c, i) => (i === index ? { ...c, passed: !c.passed } : c))
    );
  };

  const handleUpdateNote = (index: number, note: string) => {
    setChecklist((prev) =>
      prev.map((c, i) => (i === index ? { ...c, note } : c))
    );
  };

  const handleMockPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await bookingService.returnBooking(
        booking.id,
        {
          checklist,
          notes,
          photos: photoPreview ? [photoPreview] : [],
          rating,
        },
        currentUser
      );

      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      showToast('Return submitted! Before & after comparison logged in audit trail.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Return submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beforeReport = booking.checkInReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
              Equipment Return • {resource.title}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Final Return Inspection & Before/After Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Overdue Warning if late */}
          {isLate && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block">Late Return Flagged</span>
                <span>
                  This session ended at{' '}
                  {new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Submitting now will record this transaction as overdue.
                </span>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Container */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Columns className="w-4 h-4 text-emerald-600" />
                <span>Side-by-Side Condition Inspection Matrix</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Comparing check-in baseline vs final return
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: Before (Check-In Baseline) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    BEFORE (Check-In)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {beforeReport
                      ? new Date(beforeReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Initial baseline'}
                  </span>
                </div>

                {/* Before Photo */}
                <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={
                      beforeReport?.photos?.[0] ||
                      resource.images?.[0] ||
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
                    }
                    alt="Before condition"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Before Checklist */}
                <div className="space-y-1.5">
                  {(beforeReport?.checklist || checklist).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[200px] text-slate-600">{c.item}</span>
                      <span
                        className={`font-semibold shrink-0 ${
                          c.passed ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {c.passed ? '✓ Clean' : '⚠ Issue'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Notes: {beforeReport?.notes || 'Baseline pre-checkout status verified.'}
                </div>
              </div>

              {/* RIGHT: After (Current Return Inspection) */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AFTER (Final Return)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">NOW</span>
                </div>

                {/* After Photo Upload */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-emerald-200 bg-slate-100 group">
                  <img
                    src={photoPreview}
                    alt="After condition"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold">
                    <Camera className="w-4 h-4" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMockPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Return Checklist Checkboxes */}
                <div className="space-y-2">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] truncate">
                        <input
                          type="checkbox"
                          checked={item.passed}
                          onChange={() => handleToggleCheck(idx)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="truncate text-slate-800">{item.item}</span>
                      </label>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          item.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.passed ? 'CLEAN' : 'DAMAGED'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-emerald-100">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Final condition notes..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 block">Equipment Performance Rating</span>
              <span className="text-slate-500 text-[11px]">How did the equipment perform during your reservation?</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting Return...' : 'Submit Final Return Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
