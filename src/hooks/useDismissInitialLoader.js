import { useEffect } from 'react';

// 首屏内容就绪后移除 index.html 中的初始加载动画，
// 保证进入站点时只播放这一个加载动画（React 侧骨架屏在移除前被加载器遮住，不会露出）
const useDismissInitialLoader = (ready = true) => {
  useEffect(() => {
    if (ready && typeof window.__dismissInitialLoader === 'function') {
      window.__dismissInitialLoader();
    }
  }, [ready]);
};

export default useDismissInitialLoader;
