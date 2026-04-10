import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          关于我
        </h1>
        
        {/* 个人信息卡片 */}
        <div className="card mb-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">修子</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl text-gray-600 font-bold mb-2">修子</h2>
              <p className="text-primary mb-4">专注全栈实战，分享踩坑笔记</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  全栈开发者
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  技术博主
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  前端工程师
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                热爱技术，喜欢探索新的前端框架和后端技术，致力于分享实用的开发经验和最佳实践。
              </p>
            </div>
          </div>
        </div>

        {/* 兴趣方向 */}
        <div className="card mb-12">
          <h2 className="text-2xl text-gray-600 font-bold mb-6">兴趣方向</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="text-gray-600">前端工程化与性能优化</span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="text-gray-600">微信小程序开发</span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="text-gray-600">Node.js 后端开发</span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="text-gray-600">AI 应用开发</span>
            </div>
          </div>
        </div>
 
        {/* 教育经历 */}
        <div className="card mb-12">
          <h2 className="text-2xl text-gray-600 font-bold mb-6">教育经历</h2>
          <div className="relative pl-8 border-l-2 border-primary">
            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-lg text-gray-600 font-semibold">2021-2025 - 某大学 - 计算机科学与技术 - 本科</h3>
            <p className="text-gray-600 mt-2">
                主修课程：数据结构、算法设计、操作系统、计算机网络、数据库原理等，
                在校期间获得优秀学生奖学金，参与多个校园科技项目。
              </p>
          </div>
        </div>

        {/* 工作经历 */}
        <div className="card mb-12">
          <h2 className="text-2xl text-gray-600 font-bold mb-6">工作经历</h2>
          <div className="space-y-6">
            <div className="relative pl-8 border-l-2 border-primary">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
              <h3 className="text-lg text-gray-600 font-semibold">2024-至今 - 某科技公司 - 全栈开发工程师</h3>
              <p className="text-gray-600 mt-2">
                负责公司核心产品的前后端开发，使用 React、Node.js 和 MongoDB 技术栈，
                参与产品规划和技术架构设计，优化系统性能和用户体验。
              </p>
            </div>
            <div className="relative pl-8 border-l-2 border-primary">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
              <h3 className="text-lg text-gray-600 font-semibold">2022-2024 - 某互联网公司 - 前端开发工程师</h3>
              <p className="text-gray-600 mt-2">
                负责公司网站和移动端 H5 页面的开发，使用 Vue.js 和 Element UI，
                优化前端性能，提升用户体验，参与团队技术分享和代码审查。
              </p>
            </div>
          </div>
        </div>
       
        {/* 技术栈 */}
        <div className="card mb-12">
          <h2 className="text-2xl text-gray-600 font-bold mb-6">技术栈</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg text-gray-600 font-semibold mb-3">后端</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Node.js
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Express
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  MongoDB
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg text-gray-600 font-semibold mb-3">前端</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  React
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Tailwind CSS
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Vite
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg text-gray-600 font-semibold mb-3">工具</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Git
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  Docker
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  VS Code
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 社交账号 */}
        <div className="card">
          <h2 className="text-2xl text-gray-600 font-bold mb-6">社交账号</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="#"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
              </svg>
              GitHub
            </a>
            <a
              href="#"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.423 17.947c-.154.227-.413.344-.695.344-.425 0-.767-.263-.916-.634-.149-.371-.149-.81-.149-1.319 0-1.134.228-2.212.684-3.234.456-1.022 1.097-1.958 1.922-2.81.825-.852 1.783-1.57 2.874-2.154 1.091-.584 2.288-.942 3.59-1.074-.207-.394-.492-.744-.854-1.05-1.273-1.026-3.086-1.628-5.44-1.628-2.354 0-4.167.602-5.44 1.628-.362.306-.647.656-.854 1.05 1.302.132 2.499.49 3.59 1.074 1.091.584 2.049 1.3 2.874 2.154.825.852 1.466 1.788 1.922 2.81.456 1.022.684 2.1.684 3.234 0 .509 0 .948-.149 1.319-.149.371-.491.634-.916.634-.282 0-.541-.117-.695-.344-.052-.075-.796-1.129-2.143-3.258-1.347-2.13-2.143-3.223-2.195-3.3-.052-.075-.129-.137-.228-.185-.099-.048-.218-.072-.357-.072-.139 0-.258.024-.357.072-.099.048-.176.11-.228.185-.052.077-.848 1.17-2.195 3.3-1.347 2.129-2.091 3.183-2.143 3.258-.154.227-.413.344-.695.344-.425 0-.767-.263-.916-.634-.149-.371-.149-.81-.149-1.319 0-1.134.228-2.212.684-3.234.456-1.022 1.097-1.958 1.922-2.81.825-.852 1.783-1.57 2.874-2.154 1.091-.584 2.288-.942 3.59-1.074-.207-.394-.492-.744-.854-1.05-1.273-1.026-3.086-1.628-5.44-1.628-2.354 0-4.167.602-5.44 1.628-.362.306-.647.656-.854 1.05 1.302.132 2.499.49 3.59 1.074 1.091.584 2.049 1.3 2.874 2.154.825.852 1.466 1.788 1.922 2.81.456 1.022.684 2.1.684 3.234 0 .509 0 .948-.149 1.319-.149.371-.491.634-.916.634-.282 0-.541-.117-.695-.344z" />
              </svg>
              知乎
            </a>
            <a
              href="#"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.875 18.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm-7.5-3c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm-7.5-3c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm-7.5-3c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3.75 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z" />
              </svg>
              掘金
            </a>
            <a
              href="mailto:example@example.com"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
              </svg>
              邮箱
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;