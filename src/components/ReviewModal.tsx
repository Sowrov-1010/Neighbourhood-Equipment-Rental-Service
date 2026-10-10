import React, { useState } from 'react';
import { RentalRequest } from '../types';
import { useApp } from '../context/AppContext';
import { X, Star, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ReviewModalProps {
  request: RentalRequest;
  onClose: () => void;
}

const POSITIVE_TAGS = [
  'Punctual Return',
  'Great Condition',
  'Prompt Payment',
  'Polite Communication',
];

const NEGATIVE_TAGS = [
  'Payment Issue',
  'Not Returning at Right Time',
  'Damaged Equipment',
  'Unresponsive',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({ request, onClose }) => {
  const { currentUser, submitReview } = useApp();

  const isLender = currentUser.id === request.lenderId;
  const targetUserId = isLender ? request.borrowerId : request.lenderId;
  const targetUserName = isLender ? request.borrowerName : request.lenderName;

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual Return']);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview({
      rentalId: request.id,
      targetUserId,
      rating,
      comment: comment.trim() || 'Seamless neighborhood equipment rental.',
      tags: selectedTags,
    });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
              MUTUAL PEER REVIEW (FR-10)
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Rate Experience with {targetUserName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-stone-900">Review Submitted</h4>
            <p className="text-xs text-stone-500">
              User rating score and risk classification updated immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Star Rating Selector */}
            <div className="text-center space-y-2">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Select Overall Rating (1 to 5 Stars)
              </div>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? 'fill-amber-400 text-amber-500'
                            : 'fill-stone-100 text-stone-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-mono font-semibold text-stone-600">
                {rating} of 5 Stars
              </div>
            </div>

            {/* Categorized Feedback Tags (FR-10.2) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Categorized Feedback Tags (FR-10.2)
              </div>

              {/* Positive Tags */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>Positive Indicators</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Negative Tags */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-red-800 flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" />
                  <span>Risk / Negative Indicators (Triggers Risk Decay)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NEGATIVE_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white font-semibold shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wide block mb-1">
                Written Review Comment
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe promptness, item condition upon return, communication..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-600 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Publish Mutual Rating
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
