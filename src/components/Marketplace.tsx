import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Eye, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Listing {
  id: string;
  slug: string;
  featured_image: string;
  description: string;
  specialties: string[];
  average_rating: number;
  total_reviews: number;
  view_count: number;
  verified: boolean;
  salon: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        salon:salons(name, address, phone)
      `)
      .eq('is_published', true)
      .order('verified', { ascending: false })
      .order('average_rating', { ascending: false });

    if (data) {
      setListings(data as any);
    }
    setLoading(false);
  };

  const filteredListings = listings.filter(
    (listing) =>
      listing.salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.specialties?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewListing = async (listing: Listing) => {
    await supabase
      .from('marketplace_listings')
      .update({ view_count: listing.view_count + 1 })
      .eq('id', listing.id);

    window.location.href = `/book/${listing.slug}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-center">Discover Beauty Salons</h1>
          <p className="text-slate-200 text-center mb-8">
            Find and book appointments with top-rated salons in your area
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search salons, services, or locations..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border-0 text-slate-900 placeholder-slate-400 shadow-lg focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-20 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-700 mb-2">No salons found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => handleViewListing(listing)}
              >
                <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                  {listing.featured_image ? (
                    <img
                      src={listing.featured_image}
                      alt={listing.salon.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <span className="text-4xl font-bold">
                        {listing.salon.name.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  {listing.verified && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                    {listing.salon.name}
                  </h3>

                  {listing.salon.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{listing.salon.address}</span>
                    </div>
                  )}

                  {listing.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {listing.specialties && listing.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs"
                        >
                          {specialty}
                        </span>
                      ))}
                      {listing.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                          +{listing.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-slate-900">
                          {listing.average_rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({listing.total_reviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Eye className="w-4 h-4" />
                        <span>{listing.view_count}</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
