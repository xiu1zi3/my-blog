import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-8">页面不存在</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          抱歉，您访问的页面不存在或已被删除。
        </p>
        <Link to="/" className="btn-primary">
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;