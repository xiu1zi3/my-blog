import React from 'react';

// 通用旋转加载器
const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="relative w-20 h-20">
      {/* 外层圆环 */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/15"></div>
      {/* 主旋转圆环 */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      {/* 第二层反向旋转 */}
      <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-secondary animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
      {/* 中心装饰点 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full dot-flash"></div>
        <div className="w-2 h-2 bg-secondary rounded-full dot-flash"></div>
        <div className="w-2 h-2 bg-primary rounded-full dot-flash"></div>
      </div>
    </div>
  </div>
);

// 骨架线组件 - 带流光效果
const SkeletonLine = ({ className = '', style = {} }) => (
  <div className={`skeleton-line ${className}`} style={style}></div>
);

// 文章卡片骨架屏
const ArticleCardSkeleton = () => (
  <div className="card">
    <div className="mb-4">
      {/* 分类标签骨架 */}
      <SkeletonLine className="h-5 w-20 rounded-full mb-3" />
      {/* 标题骨架 */}
      <SkeletonLine className="h-6 w-3/4 rounded mb-3" />
      <SkeletonLine className="h-6 w-1/2 rounded mb-4" />
      {/* 摘要骨架 */}
      <SkeletonLine className="h-4 w-full rounded mb-2" />
      <SkeletonLine className="h-4 w-5/6 rounded mb-2" />
      <SkeletonLine className="h-4 w-2/3 rounded" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex space-x-2">
        <SkeletonLine className="h-5 w-12 rounded" />
        <SkeletonLine className="h-5 w-12 rounded" />
      </div>
      <SkeletonLine className="h-4 w-20 rounded" />
    </div>
  </div>
);

// 首页加载骨架屏
const HomeSkeleton = () => (
  <div className="min-h-screen fade-in">
    {/* Hero 区域骨架 */}
    <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
      <div className="container mx-auto px-4 text-center">
        <div>
          <SkeletonLine className="h-12 md:h-16 w-1/2 mx-auto rounded-lg mb-4" style={{ background: 'rgba(64, 158, 255, 0.15)' }} />
          <SkeletonLine className="h-6 md:h-8 w-2/3 mx-auto rounded-lg mb-8" style={{ background: 'rgba(64, 158, 255, 0.1)' }} />
          <SkeletonLine className="h-10 w-32 mx-auto rounded-lg" style={{ background: 'rgba(64, 158, 255, 0.2)' }} />
        </div>
      </div>
    </section>

    {/* 进度条装饰 */}
    <div className="loading-progress w-full"></div>

    {/* 文章列表骨架 */}
    <section className="py-12">
      <div className="container mx-auto px-4">
        <SkeletonLine className="h-8 md:h-10 w-32 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </div>
    </section>
  </div>
);

// 文章详情页骨架屏
const ArticleSkeleton = () => (
  <div className="container mx-auto px-4 py-12 fade-in">
    <div className="max-w-3xl mx-auto">
      {/* 进度条装饰 */}
      <div className="loading-progress w-full mb-12"></div>

      {/* 头图骨架 */}
      <div className="mb-8 flex justify-center">
        <div className="w-2/3 max-w-2xl skeleton-line aspect-[16/9] rounded-xl overflow-hidden"></div>
      </div>

      <div className="mb-6">
        {/* 分类标签 */}
        <SkeletonLine className="h-5 w-20 rounded-full mb-4" />
        {/* 标题 */}
        <SkeletonLine className="h-9 md:h-10 w-full rounded mb-4" />
        <SkeletonLine className="h-9 md:h-10 w-2/3 rounded mb-8" />
        {/* 标签和日期 */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <SkeletonLine className="h-5 w-12 rounded" />
            <SkeletonLine className="h-5 w-12 rounded" />
          </div>
          <SkeletonLine className="h-4 w-24 rounded" />
        </div>
      </div>

      {/* 正文骨架 */}
      <div className="space-y-4">
        <SkeletonLine className="h-5 w-full rounded" />
        <SkeletonLine className="h-5 w-11/12 rounded" />
        <SkeletonLine className="h-5 w-full rounded" />
        <SkeletonLine className="h-5 w-10/12 rounded" />
        <SkeletonLine className="h-5 w-full rounded" />
        <div className="h-8 w-1/3 mt-8">
          <SkeletonLine className="h-8 w-full rounded" />
        </div>
        <SkeletonLine className="h-5 w-full rounded" />
        <SkeletonLine className="h-5 w-11/12 rounded" />
        <SkeletonLine className="h-5 w-full rounded" />
        {/* 代码块骨架 */}
        <div className="h-40 w-full skeleton-line rounded-lg mt-4 overflow-hidden"></div>
        <SkeletonLine className="h-5 w-full rounded" />
        <SkeletonLine className="h-5 w-9/12 rounded" />
        <SkeletonLine className="h-5 w-full rounded" />
        <SkeletonLine className="h-5 w-11/12 rounded" />
        <SkeletonLine className="h-5 w-8/12 rounded" />
      </div>
    </div>
  </div>
);

// 标签页骨架屏
const TagsSkeleton = () => (
  <div className="min-h-screen py-12 fade-in">
    <div className="container mx-auto px-4">
      {/* 进度条装饰 */}
      <div className="loading-progress w-full mb-12"></div>

      {/* 标题 */}
      <div className="flex justify-center mb-8">
        <SkeletonLine className="h-9 md:h-11 w-40 rounded" />
      </div>

      {/* 标签云骨架 - 使用固定宽度数组确保渲染稳定性 */}
      <div className="card mb-8 p-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {[90, 70, 120, 80, 100, 130, 75, 110, 95, 85, 115, 65].map((width, i) => (
            <SkeletonLine
              key={i}
              className="h-5 rounded"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 分类页骨架屏
const CategoriesSkeleton = () => (
  <div className="min-h-screen py-12 fade-in">
    <div className="container mx-auto px-4">
      {/* 进度条装饰 */}
      <div className="loading-progress w-full mb-12"></div>

      {/* 标题 */}
      <div className="flex justify-center mb-8">
        <SkeletonLine className="h-9 md:h-11 w-40 rounded" />
      </div>

      {/* 分类按钮骨架 */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <SkeletonLine className="h-10 rounded-full px-4" style={{ minWidth: '80px' }} />
          </div>
        ))}
      </div>

      {/* 文章列表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </div>
    </div>
  </div>
);

// 带文字提示的加载器
const LoadingWithText = ({ text = '加载中' }) => (
  <div className="container mx-auto px-4 py-20 fade-in">
    <div className="flex flex-col items-center justify-center space-y-8">
      <Spinner />
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-medium text-gray-700 dark:text-gray-300">{text}</span>
          <span className="flex space-x-1">
            <span className="w-2 h-2 bg-primary rounded-full dot-flash inline-block"></span>
            <span className="w-2 h-2 bg-secondary rounded-full dot-flash inline-block"></span>
            <span className="w-2 h-2 bg-primary rounded-full dot-flash inline-block"></span>
          </span>
        </div>
        <div className="w-48 loading-progress"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          正在准备精彩内容...
        </p>
      </div>
    </div>
  </div>
);

// 主加载组件
const Loading = ({ type = 'default', text }) => {
  switch (type) {
    case 'home':
      return <HomeSkeleton />;
    case 'article':
      return <ArticleSkeleton />;
    case 'tags':
      return <TagsSkeleton />;
    case 'categories':
      return <CategoriesSkeleton />;
    case 'text':
      return <LoadingWithText text={text} />;
    default:
      return <LoadingWithText text={text} />;
  }
};

export default Loading;
