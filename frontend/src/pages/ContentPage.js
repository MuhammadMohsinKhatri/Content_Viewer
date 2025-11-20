import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { contentAPI, paymentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ContentPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentAPI.getContentById(id);
      setContent(data);
      
      // Check if user has already purchased this content
      // This would require an API endpoint or check in the user's purchased content
      // For now, we'll assume they need to purchase
      setHasAccess(false);
    } catch (error) {
      toast.error('Content not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase content');
      navigate('/login', { state: { from: { pathname: `/content/${id}` } } });
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setPaymentLoading(true);

    try {
      await paymentAPI.initiatePayment({
        content_id: id,
        phone_number: phoneNumber
      });
      
      toast.success('Payment initiated! Please check your phone for payment instructions.');
      
      // In a real implementation, you'd want to poll for payment status
      // or handle webhook callbacks to update the UI
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Payment failed';
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading content..." />;
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Content not found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
          Back to Browse
        </Link>
      </div>
    );
  }

  const timeLeft = new Date(content.expires_at) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Browse
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Content Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  content.file_type === 'audio' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {content.file_type === 'audio' ? '🎵 Audio Content' : '🎬 Video Content'}
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  daysLeft > 3 
                    ? 'bg-green-100 text-green-800'
                    : daysLeft > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {content.creator_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span>By {content.creator_name}</span>
                </div>
                <span>•</span>
                <span>{content.views} views</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {content.description && (
                <p className="text-gray-700 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-8">
          {hasAccess ? (
            // User has purchased access - show the media
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Content</h3>
              {content.file_type === 'audio' ? (
                <audio controls className="w-full">
                  <source src={content.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <video controls className="w-full rounded-lg">
                  <source src={content.file_url} type="video/mp4" />
                  Your browser does not support the video element.
                </video>
              )}
            </div>
          ) : (
            // User needs to purchase access
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Premium Content
                </h3>
                <p className="text-gray-600 mb-6">
                  Get instant access to this {content.file_type} content for just KSH {content.price}.
                  50% goes directly to support the creator.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="text-left">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (for M-Pesa payment)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 254712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your M-Pesa number to receive payment instructions
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handlePurchase}
                  disabled={paymentLoading || !phoneNumber.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Processing Payment...
                    </span>
                  ) : (
                    `Pay KSH ${content.price} to Access`
                  )}
                </button>
                
                {!isAuthenticated && (
                  <p className="mt-4 text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                      Sign up here
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Revenue Split:</span> 50% to creator, 50% to platform
            </div>
            <div>
              <span className="font-medium">Support:</span> Help creators earn from their content
            </div>
          </div>
        </div>
      </div>

      {/* Related Content Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          More from {content.creator_name}
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>More content from this creator coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;
