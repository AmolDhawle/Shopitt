'use client';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import { ChevronRight, Download, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { saveAs } from 'file-saver';

import React, { useDeferredValue, useMemo, useState } from 'react';

interface Event {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  stock: number;
  createdAt: string;
  startingDate: Date;
  endingDate: Date;
  images: { url: string }[];
  shop: { name: string };
}

interface Meta {
  totalEvents: number;
  currentPage: number;
  totalPages: number;
}

interface EventsResponse {
  success: boolean;
  events: Event[];
  meta: Meta;
}

const EventsPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [page, setPage] = useState(1);
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;

  const queryOptions: UseQueryOptions<EventsResponse> = {
    queryKey: ['events-list', page] as const,
    queryFn: async () => {
      const res = await axiosInstance.get<EventsResponse>(
        `/admin/api/get-all-events?page=${page}&limit=${limit}`,
      );
      console.log('events', res.data);
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  };

  const { data, isLoading } = useQuery<EventsResponse>(queryOptions);

  //   const { data, isLoading } = useQuery({
  //     queryKey: ['events-list', page],
  //     queryFn: async () => {
  //       const res = await axiosInstance.get(
  //         `/admin/api/get-all-events?page=${page}&limit=${limit}`,
  //       );

  //       console.log('res', res.data);
  //       return res.data;
  //     },
  //     placeholderData: (prev) => prev,
  //     staleTime: 1000 * 60 * 5,
  //   });

  const allEvents = data?.events || [];
  const meta = data?.meta;

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event: any) => {
      const values = Object.values(event).join(' ').toLowerCase();
      return values.includes(deferredGlobalFilter.toLowerCase());
    });
  }, [allEvents, deferredGlobalFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'images',
        header: 'Image',
        cell: ({ row }: any) => (
          <Image
            src={row.original.images[0]?.url || '/placeholder.png'}
            alt={row.original.title}
            width={40}
            height={40}
            className="w-10 h-10 rounded object-cover"
          />
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }: any) => (
          <Link
            href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
            className="hover:text-blue-500 hover:border-b"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'salePrice',
        header: 'Price',
        cell: ({ row }: any) => `₹${row.original.salePrice}`,
      },

      {
        accessorKey: 'stock',
        header: 'Stock',
      },
      {
        accessorKey: 'startingDate',
        header: 'Start',
        cell: ({ row }: any) =>
          row.original.startingDate
            ? new Date(row.original.startingDate).toLocaleDateString()
            : '-',
      },
      {
        accessorKey: 'endingDate',
        header: 'Start',
        cell: ({ row }: any) =>
          row.original.endingDate
            ? new Date(row.original.endingDate).toLocaleDateString()
            : '-',
      },
      {
        accessorKey: 'shop.name',
        header: 'Shop Name',
        cell: ({ row }: any) => row.original.shop?.name || '-',
      },
    ],
    [],
  );
  const table = useReactTable({
    data: filteredEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const exportCSV = () => {
    const rows = table.getFilteredRowModel().rows;

    const csvData = rows.map((row) => {
      const event = row.original;

      return `${event.title},${event.salePrice},${event.stock},${event.startingDate},${event.endingDate},${event.shop.name}`;
    });

    const blob = new Blob(
      [`Title,Price,Stock,Start,End,Shop\n${csvData.join('\n')}`],
      { type: 'text/csv;charset=utf-8;' },
    );

    saveAs(blob, `events-page-${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Products</h2>
        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg flex items-center gap-2"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center mb-4">
        <Link href={'/dashboard'} className="text-blue-400 cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="text-gray-200" />
        <span className="text-white">All Products</span>
      </div>

      {/* Search */}
      <div className="flex items-center bg-gray-900 p-2 mb-4 rounded-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading products...</p>
        ) : (
          <>
            <table className="w-full text-white">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-800">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-3 text-left">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-800 hover:bg-gray-900 transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-white">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm">
                Page {meta?.currentPage || 1} of {meta?.totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setPage((p) =>
                    meta?.totalPages ? Math.min(p + 1, meta.totalPages) : p + 1,
                  )
                }
                disabled={page === meta?.totalPages}
                className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
