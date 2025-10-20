import { useState, useEffect } from 'react';
import { Star, MessageCircle, Send, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Review {
  id: string;
  rating: number;
  comment: string;
  response: string;
  responded_at: string;
  is_featured: boolean;
  source: string;
  created_at: string;
  users: {
    full_name: string;
    email: string;
  };
  bookings: {
    services: {
      name: string;
    };
  };
}

export default function ReviewsManagement({ salonId }: { salonId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadReviews();
  }, [salonId]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        users!inner(full_name, email),
        bookings!inner(
          services!inner(name)
        )
      `)
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as any);
    }
  };

  const handleResponse = async (reviewId: string) => {
    await supabase
      .from('reviews')
      .update({
        response: responseText,
        responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    setResponding(null);
    setResponseText('');
    loadReviews();
  };

  const toggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    await supabase
      .from('reviews')
      .update({ is_featured: !currentStatus })
      .eq('id', reviewId);

    loadReviews();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      dist[review.rating as keyof typeof dist]++;
    });
    return dist;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Customer Reviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900 mb-2">{getAverageRating()}</div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(parseFloat(getAverageRating())))}
            </div>
            <p className="text-sm text-slate-600">{reviews.length} total reviews</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 md:col-span-2">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">{rating} ★</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-12 text-right">
                  {distribution[rating as keyof typeof distribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No reviews yet</p>
            <p className="text-sm text-slate-500">
              Reviews will appear here after customers complete their bookings
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-700">
                      {review.users.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{review.users.full_name}</h4>
                      <p className="text-sm text-slate-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    <span className="text-sm text-slate-600">
                      • Service: {review.bookings.services.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeatured(review.id, review.is_featured)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    review.is_featured
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  {review.is_featured ? 'Featured' : 'Feature'}
                </button>
              </div>

              {review.comment && (
                <p className="text-slate-700 mb-4 leading-relaxed">{review.comment}</p>
              )}

              {review.response ? (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Your Response</span>
                    <span className="text-xs text-slate-500">
                      • {new Date(review.responded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{review.response}</p>
                </div>
              ) : responding === review.id ? (
                <div className="space-y-3">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                    placeholder="Thank you for your review..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResponse(review.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send Response
                    </button>
                    <button
                      onClick={() => {
                        setResponding(null);
                        setResponseText('');
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResponding(review.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Respond
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
