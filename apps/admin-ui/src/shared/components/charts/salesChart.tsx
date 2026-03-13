'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type OrdersData = {
  month: string;
  count: number;
};

type SalesChartProps = {
  ordersData: OrdersData[];
};

const SalesChart = ({ ordersData }: SalesChartProps) => {
  const categories = ordersData.map((item) => item.month);
  const seriesData = ordersData.map((item) => item.count);

  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: '#94a3b8',
    },

    grid: {
      borderColor: '#1e293b',
      strokeDashArray: 4,
    },

    stroke: {
      curve: 'smooth',
      width: 3,
    },

    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.05,
      },
    },

    colors: ['#60a5fa'],

    dataLabels: {
      enabled: false,
    },

    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },

    yaxis: {
      labels: {
        formatter: (val) => `${val}`,
      },
    },

    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} orders`,
      },
    },

    markers: {
      size: 4,
      strokeWidth: 0,
      hover: {
        size: 6,
      },
    },
  };

  const series = [
    {
      name: 'Orders',
      data: seriesData,
    },
  ];

  return (
    <div className="w-full h-[320px] mt-6">
      <Chart options={options} series={series} type="area" height="100%" />
    </div>
  );
};

export default SalesChart;
