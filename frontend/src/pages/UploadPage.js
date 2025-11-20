import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { contentAPI } from '../services/api';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid audio or video file (MP3, WAV, MP4, MOV, AVI, WebM)');
      return;
    }

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size must be less than 500MB');
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    
    // Create preview URL for video files
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    try {
      await contentAPI.createContent(formData);
      toast.success('Content uploaded successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Upload failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (type) => {
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.startsWith('video/')) return '🎬';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload New Content
        </h1>
        <p className="text-gray-600">
          Share your audio or video content and start earning. Each view pays KSH 5, with 50% going to you!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="form-label">
            Content Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="form-input"
            placeholder="Enter a catchy title for your content"
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="form-input"
            placeholder="Tell viewers what your content is about..."
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="form-label">
            Upload File *
          </label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              {formData.file ? (
                <div className="space-y-4">
                  {/* File Preview */}
                  {filePreview && (
                    <div className="max-w-sm mx-auto">
                      <video
                        src={filePreview}
                        className="w-full rounded-lg"
                        controls={false}
                        muted
                      />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <span className="text-2xl">
                      {getFileTypeIcon(formData.file.type)}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {formData.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(formData.file.size)} • {formData.file.type}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, file: null }));
                      setFilePreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="audio/*,video/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Audio (MP3, WAV, OGG) or Video (MP4, MOV, AVI, WebM) up to 500MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Content Guidelines
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Content will be available for 2 weeks after upload</li>
                  <li>You earn KSH 2.50 for each paid view (50% of KSH 5.00)</li>
                  <li>Payouts are processed weekly on Fridays</li>
                  <li>Ensure your content is original and family-friendly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Upload as:</h4>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.creator_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700">
              {user?.creator_name || user?.username}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.file}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="loading-spinner mr-2"></div>
                Uploading...
              </span>
            ) : (
              'Upload Content'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;
