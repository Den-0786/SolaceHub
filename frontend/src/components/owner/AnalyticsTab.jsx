import { useState, useMemo } from 'react';
import { CalendarDays, CalendarRange, Calendar, TrendingUp, BarChart3, LayoutDashboard, CalendarCheck } from 'lucide-react';

const buildBuckets = (events, deployments, period) => {
  const now = new Date();
  let buckets = [];

  if (period === 'Weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        key: d.toDateString(),
        events: 0,
        deployments: 0,
      });
    }
  } else if (period === 'Monthly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
        events: 0,
        deployments: 0,
      });
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      buckets.push({ label: String(y), key: String(y), events: 0, deployments: 0 });
    }
  }

  const bucketOf = (dateValue) => {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    for (const b of buckets) {
      if (period === 'Weekly' && date.toDateString() === b.key) return b;
      if (period === 'Monthly' && `${date.getFullYear()}-${date.getMonth()}` === b.key) return b;
      if (period === 'Yearly' && String(date.getFullYear()) === b.key) return b;
    }
    return null;
  };

  (events || []).forEach((e) => {
    const b = bucketOf(e.created_at || e.date);
    if (b) b.events += 1;
  });
  (deployments || []).forEach((d) => {
    const b = bucketOf(d.created_at || d.start_date);
    if (b) b.deployments += 1;
  });

  return buckets.map((b) => ({
    label: b.label,
    value1: b.events,
    value2: b.deployments,
    revenue1: b.events,
    revenue2: b.deployments,
  }));
};

export default function AnalyticsTab({ events = [], deployments = [] }) {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Weekly');
  const [hoveredData, setHoveredData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const currentData = useMemo(
    () => buildBuckets(events, deployments, analyticsPeriod),
    [events, deployments, analyticsPeriod]
  );

  const totalEvents = currentData.reduce((sum, d) => sum + d.value1, 0);
  const totalDeployments = currentData.reduce((sum, d) => sum + d.value2, 0);
  const activeEvents = (events || []).filter((e) => e.is_active).length;

  const maxValue = useMemo(() => Math.max(...currentData.map((d) => Math.max(d.value1, d.value2)), 1), [currentData]);

  const generateStreamPath = (data, valueKey) => {
    if (data.length === 0) return '';

    const width = 100 / data.length;
    const points = data.map((d, i) => {
      const x = (i * width) + (width / 2);
      const normalizedValue = (d[valueKey] / maxValue) * 100;
      const y = 90 - normalizedValue;
      return { x, y };
    });

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const xc = (prev.x + curr.x) / 2;
      const yc = (prev.y + curr.y) / 2;
      path += ` C ${xc},${prev.y} ${xc},${curr.y} ${curr.x},${curr.y}`;
    }

    path += ` L 100,100 L 0,100 Z`;
    return path;
  };

  const generateLinePath = (data, valueKey) => {
    if (data.length === 0) return '';

    const width = 100 / data.length;
    const points = data.map((d, i) => {
      const x = (i * width) + (width / 2);
      const normalizedValue = (d[valueKey] / maxValue) * 100;
      const y = 90 - normalizedValue;
      return { x, y };
    });

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const xc = (prev.x + curr.x) / 2;
      const yc = (prev.y + curr.y) / 2;
      path += ` C ${xc},${prev.y} ${xc},${curr.y} ${curr.x},${curr.y}`;
    }

    return path;
  };

  const handleMouseEnter = (data, e) => {
    setHoveredData(data);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (hoveredData) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const getTooltipPosition = () => {
    const tooltipWidth = 200;
    const tooltipHeight = 90;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mousePosition.x + 15;
    let top = mousePosition.y + 15;

    if (left + tooltipWidth > viewportWidth - 20) {
      left = mousePosition.x - tooltipWidth - 15;
    }

    if (top + tooltipHeight > viewportHeight - 20) {
      top = mousePosition.y - tooltipHeight - 15;
    }

    left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

    return { left, top };
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Progress <span className="text-indigo-600">&</span> Analytics</h2>
          <p className="text-gray-500">Growth trends for registered events and hired deployments</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto overflow-x-auto gap-1">
          {['Weekly', 'Monthly', 'Yearly'].map((period) => (
            <button
              key={period}
              onClick={() => setAnalyticsPeriod(period)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                analyticsPeriod === period
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period === 'Weekly' && <CalendarDays size={14} className="inline mr-1" />}
              {period === 'Monthly' && <CalendarRange size={14} className="inline mr-1" />}
              {period === 'Yearly' && <Calendar size={14} className="inline mr-1" />}
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#F5F0EB', borderColor: '#8B7E74' }}>
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard size={18} style={{ color: '#1C1C1E' }} />
            <span className="text-sm" style={{ color: '#8B7E74' }}>New Events</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#1C1C1E' }}>{totalEvents.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#8B7E74' }}>Registered in selected period</p>
        </div>
        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#F5F0EB', borderColor: '#8B7E74' }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={18} style={{ color: '#C9A87C' }} />
            <span className="text-sm" style={{ color: '#8B7E74' }}>New Deployments</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#1C1C1E' }}>{totalDeployments.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#8B7E74' }}>Hired in selected period</p>
        </div>
        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#F5F0EB', borderColor: '#8B7E74' }}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck size={18} style={{ color: '#8B7E74' }} />
            <span className="text-sm" style={{ color: '#8B7E74' }}>Active Events</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#1C1C1E' }}>{activeEvents.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#8B7E74' }}>Currently live</p>
        </div>
      </div>

      {/* Streammap Visualization */}
      <div className="rounded-2xl border p-6 shadow-sm relative" style={{ backgroundColor: '#F5F0EB', borderColor: '#8B7E74' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ color: '#1C1C1E' }}>Events & Deployments Growth</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5" style={{ color: '#8B7E74' }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1C1C1E' }}></span> Events
            </span>
            <span className="flex items-center gap-1.5" style={{ color: '#8B7E74' }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C9A87C' }}></span> Deployments
            </span>
          </div>
        </div>

        {/* Floating Tooltip */}
        {hoveredData && (
          <div
            className="fixed px-4 py-3 rounded-lg shadow-xl z-50 pointer-events-none"
            style={{
              backgroundColor: '#1C1C1E',
              left: getTooltipPosition().left,
              top: getTooltipPosition().top
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: '#F5F0EB' }}>{hoveredData.label}</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1C1C1E' }}></div>
              <p className="text-xs font-semibold" style={{ color: '#F5F0EB' }}>{hoveredData.value1} event(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C9A87C' }}></div>
              <p className="text-xs font-semibold" style={{ color: '#F5F0EB' }}>{hoveredData.value2} deployment(s)</p>
            </div>
          </div>
        )}

        <div className="h-80 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="streamGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1C1C1E', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: '#1C1C1E', stopOpacity: 0.05 }} />
              </linearGradient>
              <linearGradient id="streamGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#C9A87C', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: '#C9A87C', stopOpacity: 0.05 }} />
              </linearGradient>
            </defs>

            {/* Stream 1 (Deep Charcoal) */}
            <path
              d={generateStreamPath(currentData, 'value1')}
              fill="url(#streamGradient1)"
              stroke="none"
              className="transition-all duration-300"
            />
            <path
              d={generateLinePath(currentData, 'value1')}
              fill="none"
              stroke="#1C1C1E"
              strokeWidth="0.8"
              className="transition-all duration-300"
            />

            {/* Stream 2 (Gold/Brass) */}
            <path
              d={generateStreamPath(currentData, 'value2')}
              fill="url(#streamGradient2)"
              stroke="none"
              className="transition-all duration-300"
            />
            <path
              d={generateLinePath(currentData, 'value2')}
              fill="none"
              stroke="#C9A87C"
              strokeWidth="0.8"
              className="transition-all duration-300"
            />

            {/* Interactive Areas for Hover */}
            {currentData.map((d, i) => {
              const x = (i * (100 / currentData.length)) + (100 / currentData.length / 2);
              const width = 100 / currentData.length;

              return (
                <g key={i}>
                  <rect
                    x={x - width / 2}
                    y={0}
                    width={width}
                    height={100}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(d, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs" style={{ color: '#8B7E74' }}>
            {currentData.map((d, i) => (
              <span key={i} className="text-center flex-1">{d.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
