import { useState } from 'react';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { addStopToItinerary } from '../data/api';
import toast, { Toaster } from 'react-hot-toast';

const PlaceDetailScreen = ({ place, onBack, userLanguage }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToPlan = async () => {
    setIsAdding(true);
    try {
      // For simplicity, this adds to the first day of the itinerary.
      // A more complex implementation could let the user choose the day.
      await addStopToItinerary(null, place.id); // Pass null for day to use backend default
      toast.success(`${place.name} added to your plan!`, {
        position: "bottom-center",
      });
    } catch (error) {
      console.error('Failed to add stop to itinerary:', error);
      toast.error('Could not add to plan.', {
        position: "bottom-center",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const name = userLanguage === 'Marathi' && place.name_mr ? place.name_mr : place.name;
  const description = userLanguage === 'Marathi' && place.description_mr ? place.description_mr : place.description;
  const address = userLanguage === 'Marathi' && place.address_mr ? place.address_mr : place.address;

  return (
    <div className="h-full w-full bg-[#FBF8F3] flex flex-col">
      <Toaster />
      <div className="relative h-64 w-full">
        <img
          src={place.imageUrl || 'https://via.placeholder.com/400x200'}
          alt={name}
          className="h-full w-full object-cover"
        />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/70 backdrop-blur-sm rounded-full p-2 text-gray-800"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
          <div className="flex items-center gap-2 text-sm text-yellow-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            <span>{place.rating?.toFixed(1) || '4.0'}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={14} />
          <span>{address || 'Pune, Maharashtra'}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {place.category}
          </span>
          {place.accessible && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Accessible
            </span>
          )}
        </div>

        <p className="mt-6 text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <button
          onClick={handleAddToPlan}
          disabled={isAdding}
          className="w-full bg-[#8B3A2A] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-opacity-90 disabled:bg-gray-400"
        >
          <Plus size={20} />
          {isAdding ? (userLanguage === 'Marathi' ? 'जोडत आहे...' : 'Adding...') : (userLanguage === 'Marathi' ? 'प्लॅनमध्ये जोडा' : 'Add to Plan')}
        </button>
      </div>
    </div>
  );
};

export default PlaceDetailScreen;