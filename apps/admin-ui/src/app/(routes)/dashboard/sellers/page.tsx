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
import Link from 'next/link';
import { saveAs } from 'file-saver';
import React, { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';

interface Seller {
  id: string;
  name: string;
  email: string;

  createdAt: string;
}

interface Meta {
  totalSellers: number;
  currentPage: number;
  totalPages: number;
}

interface SellersResponse {
  success: boolean;
  sellers: Seller[];
  meta: Meta;
}

const SellersPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');

  const [page, setPage] = useState(1);

  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;

  const queryOptions: UseQueryOptions<SellersResponse> = {
    queryKey: ['sellers-list', page],
    queryFn: async () => {
      const res = await axiosInstance.get<SellersResponse>(
        `/admin/api/get-all-sellers?page=${page}&limit=${limit}`,
      );

      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  };

  const { data, isLoading } = useQuery<SellersResponse>(queryOptions);

  const allSellers = data?.sellers || [];
  const meta = data?.meta;

  // filter by search & role
  const filteredSellers = useMemo(() => {
    return allSellers.filter((seller: Seller) => {
      const values = Object.values(seller).join(' ').toLowerCase();
      return values.includes(deferredGlobalFilter.toLowerCase());
    });
  }, [allSellers, deferredGlobalFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'shop.avatar',
        header: 'Avatar',
        cell: ({ row }: any) => (
          <Image
            src={row.original.shop?.avatar || ''}
            alt={row.original.name}
            width={40}
            height={40}
            className="rounded-full w-10 h-10 object-cover"
          />
        ),
      },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'shop.name',
        header: 'Shop Name',
        cell: ({ row }: any) => {
          const shopName = row.original.shop?.name;
          return shopName ? (
            <a
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/shop/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {shopName}
            </a>
          ) : (
            <span className="text-gray-400 italic">No Shop</span>
          );
        },
      },
      {
        accessorKey: 'shop.address',
        header: 'Address',
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }: any) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : '-',
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredSellers,
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
      const seller = row.original;
      return `${seller.name},${seller.email},${new Date(
        seller.createdAt,
      ).toLocaleDateString()}`;
    });

    const blob = new Blob(
      ['Name,Email,Role,Joined Date\n' + csvData.join('\n')],
      { type: 'text/csv;charset=utf-8;' },
    );
    saveAs(blob, `sellers-page-${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Sellers</h2>
        <div className="flex gap-2 items-center">
          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center mb-4">
        <Link href={'/dashboard'} className="text-blue-400 cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="text-gray-200" />
        <span className="text-white">All Sellers</span>
      </div>

      {/* Search */}
      <div className="flex items-center bg-gray-900 p-2 mb-4 rounded-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search sellers..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading sellers...</p>
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

export default SellersPage;
