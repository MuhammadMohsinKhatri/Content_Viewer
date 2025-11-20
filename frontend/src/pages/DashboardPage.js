import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ContentCard from '../components/ContentCard';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage = () => {
  const { user, isCreator } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [isCreator]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = isCreator 
        ? await dashboardAPI.getCreatorDashboard()
        : await dashboardAPI.getUserDashboard();
      setData(result);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  if (isCreator) {
    return <CreatorDashboard data={data} user={user} />;
  } else {
    return <UserDashboard data={data} user={user} />;
  }
};

const CreatorDashboard = ({ data, user }) => {
  const { content_count, total_earnings, content_items } = data || {};

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.creator_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600">
          Here's how your content is performing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{content_count || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">KSH {total_earnings?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500">Pending payout</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">
                {content_items?.reduce((sum, item) => sum + (item.paid_views || 0), 0) || 0}
              </p>
              <p className="text-xs text-gray-500">Paid views</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            📤 Upload New Content
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Content</h2>
        </div>
        
        {content_items && content_items.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {content_items.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">
                      {item.paid_views} paid views • 
                      Uploaded {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      KSH {(item.paid_views * 2.5).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Earned</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.expires_at > new Date().toISOString() 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.expires_at > new Date().toISOString() ? 'Active' : 'Expired'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Expires {formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-6xl text-gray-300 mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content uploaded yet</h3>
            <p className="text-gray-600 mb-4">
              Start earning by uploading your first piece of content!
            </p>
            <Link
              to="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upload Your First Content
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const UserDashboard = ({ data, user }) => {
  const { purchased_count, purchased_content } = data || {};

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-gray-600">
          Your purchased content and activity
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Content Library</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{purchased_count || 0}</p>
            <p className="text-sm text-gray-600">Items purchased</p>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🔍 Browse New Content
          </Link>
          <Link
            to="/register"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🎨 Become a Creator
          </Link>
        </div>
      </div>

      {/* Purchased Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Content Library</h2>
        </div>
        
        {purchased_content && purchased_content.length > 0 ? (
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {purchased_content.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.file_type === 'audio' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.file_type === 'audio' ? '🎵 Audio' : '🎬 Video'}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    By {item.creator_name}
                  </p>
                  
                  {/* Media Player */}
                  <div className="mb-3">
                    {item.file_type === 'audio' ? (
                      <audio controls className="w-full">
                        <source src={item.file_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <video controls className="w-full rounded">
                        <source src={item.file_url} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Purchased {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-6xl text-gray-300 mb-4">🛒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content purchased yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your content library by purchasing some amazing content!
            </p>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Content
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
