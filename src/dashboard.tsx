export default function Dashboard() {
  return (
    <div className="bg-[#f8fbff] min-h-screen">
      <div className="bg-[#f8fbff] min-h-screen">
        <header className="bg-[#e3f0fb] flex items-center justify-between px-8 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="40,22 52,10 64,22" fill="none" stroke="#29b6f6" stroke-width="5" />
              <text x="28" y="50" font-family="Segoe UI, Arial, sans-serif" font-weight="bold" font-size="38" fill="#1a3766">Elevance</text>
              <text x="60" y="74" font-family="Segoe UI, Arial, sans-serif" font-weight="bold" font-size="24" fill="#1a3766">Health</text>
              <rect x="190" y="14" width="8" height="65" rx="2" fill="#29b6f6" />
            </svg>

            <span className="border-l-2 border-blue-400 h-8 mx-2"></span>
            <h1 className="text-2xl font-bold text-[#2a4373]">
              Enterprise Cost of Care Analytics Platform (ECAP)
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-gray-600 flex items-center space-x-1">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" /></svg>
              <span>John Smith</span>
              <span className="text-xs text-gray-400">| COC_PBI_US</span>
            </span>
            <button className="rounded-full bg-white p-2 shadow">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            </button>
          </div>
        </header>
        <div className="relative px-8 py-6 mb-8">
          <div className="absolute right-8 top-0 bg-[#e3f0fb] rounded-b-full w-80 h-32"></div>
          <div className="">
            <div className="text-[#2a4373] font-semibold">Target CoC Savings in 2025</div>
            <div className="flex items-center mt-2">
              <div className="w-64 h-2 bg-gray-200 rounded-full mr-2 relative">
                <div className="absolute left-0 top-0 h-2 bg-blue-400 rounded-full" style={{ width: "47%" }}></div>
                <div className="absolute left-[47%] top-[-8px] w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-blue-400 font-bold ml-2">47%</span>
            </div>
            <div className="text-2xl font-bold text-[#2a4373]">$5.1 B</div>
          </div>
        </div>
        <main className="px-12">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#2a4373] mb-4">
                Welcome to Enterprise Cost of Care Analytics Platform (ECAP)
              </h2>
              <p className="text-[#2a4373] text-lg mb-4 max-w-2xl">
                ECAP is a digitally enabled analytics platform to serve as a single source of truth for Cost of Care analytics across the Elevance Health enterprise. The platform provides self service and interactive visualizations, insight-driven recommendations and effectiveness measurements of initiatives.
              </p>
              <a href="#" className="text-blue-700 font-semibold underline">Newsletter</a>
            </div>
            <div className="bg-white rounded-xl shadow p-6 ml-0 md:ml-8 mt-8 md:mt-0 w-full md:w-[500px]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#2a4373]">Key Performance Indicator</span>
                <a href="#" className="text-blue-500 font-semibold">MLR</a>
              </div>
              <div className="h-48 flex items-center justify-center text-gray-400">
                <img src="/chart-placeholder.png" alt="Chart" className="w-full h-full object-contain" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Q1 2025</span>
                <span>Q2 2025</span>
                <span>Q3 2025</span>
                <span>Q4 2025</span>
              </div>
            </div>
          </div>
          <div className="flex bg-transparent px-4 pt-8">
            <button className="flex flex-col items-center justify-center w-64 h-28 rounded-t-xl bg-[#e6f5fd] shadow text-[#15396a] font-bold text-base border border-b-0 border-[#e6f5fd] mr-2 focus:outline-none">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="#15396a" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 17v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                <path d="M8 17v-4m4 4v-8m4 8v-6" />
              </svg>
              TREND & INSIGHTS
            </button>
            <button className="flex flex-col items-center justify-center w-64 h-28 rounded-t-xl bg-white shadow text-[#15396a] font-bold text-base border border-b-0 border-gray-200 mr-2 focus:outline-none">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="#29b6f6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 017 7c0 3.5-2.5 5-3 7a2 2 0 01-4 0c-.5-2-3-3.5-3-7a7 7 0 017-7z" />
                <circle cx="12" cy="19" r="1" />
              </svg>
              IDEATION & INTERVENTIONS
            </button>
            <button className="flex flex-col items-center justify-center w-64 h-28 rounded-t-xl bg-white shadow text-[#15396a] font-bold text-base border border-b-0 border-gray-200 mr-2 focus:outline-none">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="#29b6f6" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              SAVINGS
            </button>
            <button className="flex flex-col items-center justify-center w-64 h-28 rounded-t-xl bg-white shadow text-[#15396a] font-bold text-base border border-b-0 border-gray-200 mr-2 focus:outline-none">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="#29b6f6" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 3" />
              </svg>
              Quality & Health Equity
            </button>
            <button className="flex flex-col items-center justify-center w-64 h-28 rounded-t-xl bg-white shadow text-[#15396a] font-bold text-base border border-b-0 border-gray-200 focus:outline-none">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="#29b6f6" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4a8 8 0 018 8c0 4.418-3.582 8-8 8s-8-3.582-8-8a8 8 0 018-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              INTELLIGENT INQUIRY
            </button>
          </div>
          <div className="bg-[#e3f0fb] py-8 px-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-6">
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Financial Executive</button>
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Executive</button>
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Restated Financial</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Cost of Care</button>
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Capitation</button>
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Specialty RX</button>
              <button className="bg-white rounded-lg shadow px-8 py-4 font-semibold text-[#2a4373] text-lg hover:bg-blue-50 transition">Trend</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
