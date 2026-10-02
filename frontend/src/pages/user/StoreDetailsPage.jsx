import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ImagePlus,
  LogIn,
  Mail,
  MapPin,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Store,
  Trash2,
  X
} from 'lucide-react';
import {
  generateAiReviewDraft,
  getMyRating,
  getStoreById,
  getStoreRatings,
  submitStoreRating,
  updateStoreRating,
  uploadStoreMedia
} from '../../lib/stores';
import { getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { StarRating } from '../../components/stores/StarRating';
import { RatingDistribution } from '../../components/stores/RatingDistribution';
import { ReviewPreviewList } from '../../components/stores/ReviewPreviewList';

const reviewSchema = z.object({
  rating: z.number({ invalid_type_error: 'Please select a rating.' }).int().min(1).max(5, 'Rating must be between 1 and 5.'),
  review: z
    .string()
    .max(2000, 'Review must be 2000 characters or fewer.')
    .optional()
    .or(z.literal(''))
});

const acceptedMediaTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxMediaCount = 5;
const maxMediaBytes = 5 * 1024 * 1024;

const StoreDetailsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-2/3 max-w-lg" />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
);

export const StoreDetailsPage = () => {
  const { storeId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaError, setMediaError] = useState('');

  const storeQuery = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => getStoreById(storeId),
    enabled: Boolean(storeId)
  });

  const reviewsQuery = useQuery({
    queryKey: ['store-reviews', storeId, { preview: true }],
    queryFn: () => getStoreRatings(storeId, { page: 1, limit: 5 }),
    enabled: Boolean(storeId) && storeQuery.isSuccess
  });

  const myRatingQuery = useQuery({
    queryKey: ['store-my-rating', storeId],
    queryFn: () => getMyRating(storeId),
    enabled: Boolean(storeId) && Boolean(user),
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    }
  });

  const myRating = myRatingQuery.data?.data ?? null;
  const hasUserRating = myRatingQuery.isSuccess && Boolean(myRating);
  const hasNoUserRating = myRatingQuery.isError && myRatingQuery.error?.response?.status === 404;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: myRating?.rating ?? 0,
      review: myRating?.review ?? ''
    }
  });

  const reviewText = watch('review') ?? '';
  const selectedRating = watch('rating') ?? 0;

  const startEditing = () => {
    setIsEditingReview(true);
    reset({ rating: myRating?.rating ?? 0, review: myRating?.review ?? '' });
    setAiDraft('');
    setAiPrompt('');
  };

  const cancelEditing = () => {
    setIsEditingReview(false);
    reset({ rating: myRating?.rating ?? 0, review: myRating?.review ?? '' });
    setAiDraft('');
    setAiPrompt('');
  };

  const validateMediaFile = (file) => {
    if (!acceptedMediaTypes.includes(file.type)) {
      return 'Unsupported file type. Please choose a JPEG, PNG, or WEBP image.';
    }

    if (file.size > maxMediaBytes) {
      return 'Each image must be 5MB or smaller.';
    }

    if (selectedMedia.length + 1 > maxMediaCount) {
      return `You can attach up to ${maxMediaCount} images per review.`;
    }

    return '';
  };

  const handleMediaSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles = [];

    for (const file of files) {
      const validationMessage = validateMediaFile(file);
      if (validationMessage) {
        setMediaError(validationMessage);
        continue;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (!validFiles.length) {
      event.target.value = '';
      return;
    }

    setSelectedMedia((current) => [...current, ...validFiles]);
    setMediaError('');
    event.target.value = '';
  };

  const clearSelectedMedia = () => {
    selectedMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedMedia([]);
  };

  const removeSelectedMedia = (id) => {
    setSelectedMedia((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const handleAiGenerate = async () => {
    if (!selectedRating) {
      toast.error('Please choose a rating before generating a review draft.');
      return;
    }

    if (aiGenerating) return;

    setAiGenerating(true);
    setMediaError('');

    try {
      const response = await generateAiReviewDraft(storeId, {
        rating: selectedRating,
        note: aiPrompt.trim() || reviewText.trim() || `Store: ${store?.name ?? 'this store'}`
      });

      const draftText = response?.draft || response?.data?.draft || '';
      if (!draftText) {
        throw new Error('AI returned an empty review draft.');
      }

      setAiDraft(draftText);
      setValue('review', draftText, { shouldValidate: true, shouldDirty: true });
      toast.success('AI review draft added. You can edit it before submitting.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'AI review assistance is temporarily unavailable. You can still write your review manually.'));
    } finally {
      setAiGenerating(false);
    }
  };

  const onSubmitReview = async (values) => {
    try {
      const payload = {
        rating: values.rating,
        review: values.review?.trim() ? values.review.trim() : ''
      };

      const shouldUpdate = hasUserRating || isEditingReview;
      if (shouldUpdate) {
        await updateStoreRating(storeId, payload);
      } else {
        await submitStoreRating(storeId, payload);
      }

      for (const item of selectedMedia) {
        const formData = new FormData();
        formData.append('media', item.file);
        await uploadStoreMedia(storeId, formData);
      }

      toast.success(shouldUpdate ? 'Your review has been updated.' : 'Your review has been submitted.');

      setIsEditingReview(false);
      clearSelectedMedia();
      setAiPrompt('');
      setAiDraft('');
      setMediaError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      await queryClient.invalidateQueries({ queryKey: ['store-reviews', storeId] });
      await queryClient.invalidateQueries({ queryKey: ['store-my-rating', storeId] });
      await myRatingQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save your review right now.'));
    }
  };

  const store = storeQuery.data?.data;
  const isNotFound = storeQuery.isError && storeQuery.error?.response?.status === 404;

  if (storeQuery.isLoading) {
    return <StoreDetailsSkeleton />;
  }

  if (isNotFound) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <Store className="w-12 h-12 mx-auto text-slate-400 mb-4" aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Store not found</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          This store may have been removed or the link is incorrect.
        </p>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to stores
        </Link>
      </div>
    );
  }

  if (storeQuery.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 max-w-xl"
      >
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <h1 className="font-semibold text-red-800 dark:text-red-200">Could not load store</h1>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {getApiErrorMessage(storeQuery.error, 'Please try again.')}
            </p>
            <button
              type="button"
              onClick={() => storeQuery.refetch()}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const reviews = reviewsQuery.data?.data ?? [];

  return (
    <div className="store-details-page page-enter space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/stores" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Stores
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-4 h-4 inline" />
          </li>
          <li className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px] sm:max-w-md">
            {store.name}
          </li>
        </ol>
      </nav>

      <div className="store-profile-heading flex flex-col gap-6 lg:flex-row">
        <div className="store-identity-art shrink-0 lg:w-48">
          <div className="flex h-32 min-h-[8rem] items-center justify-between bg-indigo-50 px-5 lg:h-full lg:min-h-[10rem] lg:flex-col lg:items-start lg:justify-between">
            <Store className="h-8 w-8 text-indigo-700" aria-hidden="true" />
            <span className="eyebrow text-indigo-800">Local business</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <Link
              to="/stores"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              All stores
            </Link>
            <h1 className="editorial-title text-3xl text-slate-900 sm:text-4xl">{store.name}</h1>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            {store.address && (
              <p className="flex items-start gap-2 max-w-xl">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                <span>{store.address}</span>
              </p>
            )}
            {store.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={`mailto:${store.email}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                >
                  {store.email}
                </a>
              </p>
            )}
          </div>

          <div className="rating-overview-strip flex flex-wrap items-center gap-4 py-3">
            <StarRating value={store.averageRating} size="lg" showValue />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {store.totalRatings === 0
                ? 'No ratings yet'
                : `${store.totalRatings} total rating${store.totalRatings === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
      </div>

      <div className="rating-summary-grid grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="rating-breakdown-heading"
          className="rating-breakdown-section lg:col-span-1 bg-white p-5"
        >
          <h2 id="rating-breakdown-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Rating breakdown
          </h2>
          {store.totalRatings > 0 && store.distribution ? (
            <RatingDistribution distribution={store.distribution} totalRatings={store.totalRatings} />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">No rating data yet for this store.</p>
          )}
        </section>

        <section
          aria-labelledby="rate-cta-heading"
          className="review-composer-section lg:col-span-2 bg-white p-5"
        >
          <h2 id="rate-cta-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            {hasUserRating ? 'Your review' : 'Rate this store'}
          </h2>

          {!user ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please log in to rate this store and share your experience.
              </p>
              <Link
                to="/login"
                className="pressable inline-flex items-center gap-2 rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Log in to review
              </Link>
            </div>
          ) : myRatingQuery.isLoading ? (
            <div className="mt-4 space-y-3 animate-pulse">
              <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ) : hasUserRating && !isEditingReview ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">You rated this store</p>
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  Edit
                </button>
              </div>
              <StarRating value={myRating.rating} size="md" />
              {myRating.review ? (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{myRating.review}</p>
              ) : (
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  You rated this store without a written review.
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updated {new Date(myRating.updated_at ?? myRating.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmitReview)} noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your rating
                </label>
                <StarRating
                  interactive
                  value={selectedRating}
                  onChange={(nextValue) => setValue('rating', nextValue, { shouldValidate: true, shouldDirty: true })}
                  ariaLabel="Select a rating for this store"
                  disabled={isSubmitting}
                />
                {errors.rating && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div className="ai-assist-control space-y-2 py-3">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="store-ai-note" className="block text-sm font-semibold text-slate-800">
                    Write with AI
                  </label>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Optional helper
                  </span>
                </div>

                <textarea
                  id="store-ai-note"
                  rows={2}
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="What stood out most about the experience?"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !selectedRating}
                    className="pressable inline-flex items-center gap-2 rounded-md bg-indigo-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    {aiGenerating ? 'Generating...' : 'Generate draft'}
                  </button>

                  {aiDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiDraft('');
                        setValue('review', '', { shouldValidate: true, shouldDirty: true });
                      }}
                      className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                      Clear draft
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="store-review-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Review (optional)
                </label>
                <textarea
                  id="store-review-text"
                  rows={5}
                  {...register('review')}
                  disabled={isSubmitting}
                  placeholder="Share your experience with this store..."
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  aria-invalid={Boolean(errors.review)}
                />
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{errors.review ? errors.review.message : 'Optional unless you want to add a note.'}</span>
                  <span aria-live="polite">{reviewText.length}/2000</span>
                </div>
              </div>

              <div className="media-upload-control space-y-3 border-y border-slate-200 py-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Photos (optional)
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedMedia.length}/{maxMediaCount}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pressable inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ImagePlus className="w-4 h-4" aria-hidden="true" />
                    Add photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleMediaSelection}
                  />
                </div>

                {mediaError && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {mediaError}
                  </p>
                )}

                {selectedMedia.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedMedia.map((item) => (
                      <div key={item.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                        <img
                          src={item.previewUrl}
                          alt="Selected review upload preview"
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedMedia(item.id)}
                          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-700"
                          aria-label="Remove uploaded photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                  <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pressable rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : hasNoUserRating || !hasUserRating ? 'Submit rating' : 'Save changes'}
                </button>
                {isEditingReview && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="pressable rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>

      <section
        aria-labelledby="reviews-preview-heading"
        className="recent-reviews-section border-t border-slate-200 pt-6"
      >
        <h2 id="reviews-preview-heading" className="editorial-title mb-2 text-2xl text-slate-900">
          Recent reviews
        </h2>
        {reviewsQuery.isLoading ? (
          <div className="space-y-3 animate-pulse py-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ) : reviewsQuery.isError ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Reviews could not be loaded right now.
          </p>
        ) : (
          <ReviewPreviewList reviews={reviews} />
        )}
      </section>
    </div>
  );
};
