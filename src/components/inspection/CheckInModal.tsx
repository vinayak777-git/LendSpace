import React, { useState } from 'react';
import { Booking, Resource } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { bookingService } from '../../services/bookingService';
import {
  X,
  ClipboardCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Star,
  Sparkles,
} from 'lucide-react';

interface CheckInModalProps {
  booking: Booking;
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
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

  const [notes, setNotes] = useState('Machine inspected upon arrival; ready for operation.');
  const [rating, setRating] = useState(5);
  const [photoPreview, setPhotoPreview] = useState<string>(
    resource.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await bookingService.checkInBooking(
        booking.id,
        {
          checklist,
          notes,
          photos: photoPreview ? [photoPreview] : [],
          rating,
        },
        currentUser
      );
      showToast('Safety check-in recorded! Your active session has begun.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
              Pre-Operation Check-In • {resource.title}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Initial Condition & Safety Verification
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
          {/* Instructions banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Pre-Checkout Condition Inspection</span>
              <p className="text-emerald-800 leading-relaxed">
                Inspect the equipment before starting. If any part is damaged or unclean, uncheck the item and add a note so you are not held liable during final return.
              </p>
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Safety & Cleanliness Checklist
            </label>
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                  item.passed
                    ? 'border-slate-200 bg-white'
                    : 'border-amber-300 bg-amber-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.passed}
                      onChange={() => handleToggleCheck(idx)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="font-medium text-slate-800">{item.item}</span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.passed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {item.passed ? 'PASSED' : 'ISSUE NOTED'}
                  </span>
                </div>

                {!item.passed && (
                  <div className="mt-2.5 pl-6">
                    <input
                      type="text"
                      placeholder="Describe the issue found (e.g. slight scratch on lens)..."
                      value={item.note || ''}
                      onChange={(e) => handleUpdateNote(idx, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Photo Verification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Initial Photo Verification
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Check-in preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer border border-slate-200 transition-colors">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Upload / Replace Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMockPhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Visual proof captured at check-in will be compared side-by-side upon return.
                </p>
              </div>
            </div>
          </div>

          {/* Condition Rating & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Initial Condition Rating
              </label>
              <div className="flex items-center gap-1.5">
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
                <span className="text-xs font-bold text-slate-700 ml-2">{rating}/5 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                General Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes on workstation status..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

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
            <span>{isSubmitting ? 'Recording...' : 'Confirm Check-In & Start Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
