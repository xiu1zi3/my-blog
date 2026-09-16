import { useCallback, useEffect, useRef, useState } from 'react';

// 相册照片：把要展示给所有访客的图片放到 src/assets/gallery/ 目录即可，
// 构建时会自动收录（支持 jpg/jpeg/png/webp/gif/avif），按文件名排序，无需手动修改本文件。
const photoModules = import.meta.glob(
  '../assets/gallery/*.{jpg,jpeg,png,webp,gif,avif}',
  { eager: true, import: 'default' },
);

function getFileName(path) {
  const raw = path.split('/').pop().replace(/\.[^.]+$/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const photos = Object.entries(photoModules)
  .map(([path, src]) => ({
    id: path,
    name: getFileName(path),
    src,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }));

const AUTOPLAY_INTERVAL = 4000;
const SWIPE_THRESHOLD = 40;

const Gallery = () => {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const touchStartX = useRef(null);

  const goNext = useCallback(() => {
    setIndex((i) => (photos.length ? (i + 1) % photos.length : 0));
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) =>
      photos.length ? (i - 1 + photos.length) % photos.length : 0,
    );
  }, []);

  const goTo = useCallback((i) => {
    if (photos.length) {
      setIndex(((i % photos.length) + photos.length) % photos.length);
    }
  }, []);

  // 自动播放：多于一张且鼠标未悬停时，每 4 秒切换
  useEffect(() => {
    if (hovering || photos.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [hovering]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) goPrev();
      else goNext();
    }
  };

  // 尚未放入任何照片时展示静态占位
  if (photos.length === 0) {
    return (
      <div className="card mb-12">
        <h2 className="text-2xl text-gray-600 font-bold mb-6">我的相册</h2>
        <div className="mx-auto w-full max-w-xl aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-3 px-6 text-gray-400 dark:text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <span className="text-base font-medium">相册暂无照片</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-12">

      <div
        className="relative mx-auto w-full max-w-xl aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        tabIndex={0}
        role="region"
        aria-roledescription="轮播"
        aria-label="相册"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative w-full h-full shrink-0">
              <img
                src={photo.src}
                alt={`相册照片 ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="block w-full h-full object-cover select-none"
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="上一张"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="下一张"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`跳转到第 ${i + 1} 张`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? 'w-5 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
