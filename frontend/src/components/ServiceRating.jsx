import React, { useState } from 'react';
import './ServiceRating.css';


export default function ServiceRating({
  requestId,
  requestType = 'service_request',
  initialRating = null,
  onRatingSubmitted,
}) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(initialRating);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStarClick = (score) => {
    if (submittedRating) return; // already rated
    setRating(score);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setErrorMsg('Please select a star rating (1-5) before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (onRatingSubmitted) {
        await onRatingSubmitted({ requestId, type: requestType, rating, review: feedbackText });
      }
      setSubmittedRating(rating);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRating) {
    return (
      <div className="service-rating-container service-rating-submitted">
        <div className="rating-badge-success">
          <span className="rating-check-icon">✓</span>
          <div>
            <strong>Service Feedback Submitted</strong>
            <p className="rating-summary-text">
              You rated this service:{' '}
              <span className="rating-stars-display">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-glyph ${star <= submittedRating ? 'active' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </span>{' '}
              ({submittedRating}/5)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-rating-container">
      <div className="service-rating-header">
        <span className="rating-icon">⭐</span>
        <div>
          <h4>Rate Your Completed Service</h4>
          <p>How was your experience? Help us improve municipal operations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="service-rating-form">
        <div className="star-rating-selector" role="radiogroup" aria-label="1 to 5 star rating">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                className={`star-button ${isFilled ? 'filled' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            );
          })}
          <span className="rating-label-hint">
            {hoverRating || rating
              ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]
              : 'Select rating'}
          </span>
        </div>

        <div className="rating-feedback-field">
          <textarea
            placeholder="Optional: Tell us what went well or how we can improve..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={2}
            maxLength={250}
          />
        </div>

        {errorMsg && <p className="rating-error-message">{errorMsg}</p>}

        <button
          type="submit"
          className="btn-submit-rating"
          disabled={!rating || isSubmitting}
        >
          {isSubmitting ? 'Submitting Feedback...' : `Submit ${rating ? `${rating}-Star ` : ''}Feedback`}
        </button>
      </form>
    </div>
  );
}
