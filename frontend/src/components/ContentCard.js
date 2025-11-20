import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ContentCard = ({ content }) => {
  const {
    id,
    title,
    description,
    file_type,
    creator_name,
    price,
    views,
    created_at,
    expires_at
  } = content;

  const timeLeft = new Date(expires_at) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="card-body">
        {/* Content Type Badge */}
        <div className="flex justify-between items-start mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            file_type === 'audio' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {file_type === 'audio' ? '🎵 Audio' : '🎬 Video'}
          </span>
          <span className="text-xs text-gray-500">
            {daysLeft > 0 ? `${daysLeft} days left` : 'Expires soon'}
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {description || 'No description available'}
        </p>

        {/* Creator and Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {creator_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{creator_name}</p>
              <p className="text-xs text-gray-500">{views} views</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">KSH {price}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/content/${id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200 block"
        >
          View Content
        </Link>
      </div>
    </div>
  );
};

export default ContentCard;
