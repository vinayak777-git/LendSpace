import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Camera,
  Upload,
  Star,
  Trash2,
  FileText,
} from 'lucide-react';
import { ChecklistResponse, ConditionReport } from '../../types';

interface ConditionChecklistProps {
  items: string[];
  initialReport?: ConditionReport;
  readOnly?: boolean;
  phase: 'before' | 'after';
  onSubmit?: (data: {
    checklist: ChecklistResponse[];
    notes: string;
    photos: string[];
    rating: number;
  }) => Promise<void>;
  className?: string;
}

export const ConditionChecklist: React.FC<ConditionChecklistProps> = ({
  items,
  initialReport,
  readOnly = false,
  phase,
  onSubmit,
  className = '',
}) => {
  const [checklist, setChecklist] = useState<ChecklistResponse[]>(
    initialReport?.checklist ||
      items.map((item) => ({ item, passed: true, note: '' }))
  );
  const [notes, setNotes] = useState(initialReport?.notes || '');
  const [rating, setRating] = useState(initialReport?.rating || 5);
  const [photos, setPhotos] = useState<string[]>(initialReport?.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = (idx: number, passed: boolean) => {
    if (readOnly) return;
    const next = [...checklist];
    next[idx].passed = passed;
    setChecklist(next);
  };

  const handleNoteChange = (idx: number, noteText: string) => {
    if (readOnly) return;
    const next = [...checklist];
    next[idx].note = noteText;
    setChecklist(next);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !e.target.files) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos([...photos, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (idx: number) => {
    if (readOnly) return;
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || readOnly) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ checklist, notes, photos, rating });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Checklist items */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Inspection Checklist ({phase === 'before' ? 'Pre-Use Check-In' : 'Post-Use Return'})
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {checklist.map((item, idx) => (
            <div key={idx} className="p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  {item.item}
                </span>
                {readOnly ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.passed
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {item.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{item.passed ? 'Passed' : 'Defect / Issue'}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleItem(idx, true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        item.passed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(idx, false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        !item.passed
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Issue</span>
                    </button>
                  </div>
                )}
              </div>
              {!item.passed && !readOnly && (
                <input
                  type="text"
                  placeholder="Describe the issue or defect..."
                  value={item.note || ''}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                  className="w-full text-xs py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              )}
              {item.note && readOnly && (
                <p className="text-xs text-rose-600 dark:text-rose-400 italic">
                  Note: {item.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rating (1-5 stars) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Condition Rating ({rating}/5)
        </label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => setRating(star)}
              className={`p-1 text-lg transition-transform ${
                readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
              } ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* General Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Inspection Notes &amp; Observations
        </label>
        <textarea
          rows={3}
          readOnly={readOnly}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note any scratches, calibration readings, cleanliness state, or unusual noises..."
          className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Photos Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-500" />
            <span>Condition Photo Proof ({photos.length})</span>
          </label>
          {!readOnly && (
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No inspection photos attached
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((src, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group aspect-video bg-slate-100 dark:bg-slate-800"
              >
                <img
                  src={src}
                  alt={`Inspection photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!readOnly && onSubmit && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>Submit {phase === 'before' ? 'Check-In' : 'Return'} Verification</span>
          )}
        </button>
      )}
    </form>
  );
};
