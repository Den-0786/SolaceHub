import { useState, useEffect } from 'react';
import { X, Upload, Calendar, User, Image as ImageIcon } from 'lucide-react';

export default function DeceasedEntryForm({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    dateOfBirth: '',
    dateOfDeath: '',
    photo: null,
    photoPreview: null
  });

  const [age, setAge] = useState('');

  useEffect(() => {
    if (formData.dateOfBirth && formData.dateOfDeath) {
      calculateAge(formData.dateOfBirth, formData.dateOfDeath);
    }
  }, [formData.dateOfBirth, formData.dateOfDeath]);

  const calculateAge = (dob, dod) => {
    const birth = new Date(dob);
    const death = new Date(dod);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    
    setAge(age.toString());
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photo: file,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      age
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <User size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">New Deceased Entry</h2>
              <p className="text-xs text-gray-500">Enter deceased information</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="space-y-3 sm:space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                required
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (A.K.A)</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="e.g., 'Uncle Kofi'"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sunrise (Date of Birth) <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                required
              />
            </div>

            {/* Date of Death */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sunset (Date of Death) <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.dateOfDeath}
                onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                required
              />
            </div>

            {/* Auto-generated Age */}
            {age && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-indigo-600" />
                  <div>
                    <p className="text-xs text-indigo-600 font-medium">Calculated Age</p>
                    <p className="text-base font-bold text-gray-900">{age} years old</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo of Deceased</label>
              <div className="flex items-center gap-3">
                {formData.photoPreview ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-indigo-200">
                    <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg text-sm font-medium transition-colors">
                    <Upload size={14} /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the deceased</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
