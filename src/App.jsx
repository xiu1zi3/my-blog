import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';

// 路由级代码分割：各页面（及其依赖的 react-markdown、语法高亮等重库）
// 只会在访问对应路由时才加载，首屏不再下载它们
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Categories = lazy(() => import('./pages/Categories'));
const Tags = lazy(() => import('./pages/Tags'));
const Resources = lazy(() => import('./pages/Resources'));
const Article = lazy(() => import('./pages/Article'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Suspense fallback={<Loading type="text" text="加载中" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/article/:id" element={<Article />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
