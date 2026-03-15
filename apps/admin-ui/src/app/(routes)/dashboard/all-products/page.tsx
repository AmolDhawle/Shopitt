'use client';

import React, { useMemo, useState, useDeferredValue, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronRight, Download, Eye, Search, Star } from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';

interface Product {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  stock: number;
  createdAt: string;
  ratings: number;
  category: string;
  images: { url: string }[];
  shop: { name: string };
}

interface Meta {
  totalProducts: number;
  currentPage: number;
  totalPages: number;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  meta: Meta;
}

const ProductList = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const deferredFilter = useDeferredValue(globalFilter);

  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  const queryOptions: UseQueryOptions<ProductsResponse> = {
    queryKey: ['all-products', page] as const,
    queryFn: async () => {
      const res = await axiosInstance.get<ProductsResponse>(
        `/admin/api/get-all-products?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  };

  const { data, isLoading } = useQuery<ProductsResponse>(queryOptions);

  const products = data?.products || [];
  const meta = data?.meta;

  // Prefetch next page
  useEffect(() => {
    if (meta?.totalPages && page < meta.totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['all-products', page + 1],
        queryFn: async () => {
          const res = await axiosInstance.get<ProductsResponse>(
            `/admin/api/get-all-products?page=${page + 1}&limit=${limit}`,
          );
          return res.data;
        },
      });
    }
  }, [page, meta, queryClient]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'image',
        header: 'Image',
        cell: ({ row }: any) => (
          <Image
            src={row.original.images[0]?.url}
            alt="product"
            width={200}
            height={200}
            className="w-12 h-12 rounded-md object-cover"
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.title.length > 25
              ? `${row.original.title.substring(0, 25)}...`
              : row.original.title;

          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:underline"
              title={row.original.title}
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }: any) => <span>₹{row.original.salePrice}</span>,
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }: any) => (
          <span
            className={row.original.stock < 10 ? 'text-red-500' : 'text-white'}
          >
            {row.original.stock} left
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1 text-yellow-400">
            <Star fill="#fde047" size={18} />
            <span>{row.original.ratings || 5}</span>
          </div>
        ),
      },
      {
        accessorKey: 'shop',
        header: 'Shop',
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.shop.name.length > 25
              ? `${row.original.shop.name.substring(0, 25)}...`
              : row.original.shop.name;

          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:underline"
              title={row.original.shop.name}
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt).toLocaleDateString();
          return <span className="text-white text-sm">{date}</span>;
        },
      },
      {
        header: 'Actions',
        cell: ({ row }: any) => (
          <div className="flex gap-3">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              <Eye size={18} />
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter: deferredFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const exportCSV = () => {
    const rows = table.getFilteredRowModel().rows;

    const csvData = rows.map((row) => {
      const p = row.original;

      return `${p.title},${p.salePrice},${p.stock},${p.category},${p.ratings},${p.shop.name}`;
    });

    const blob = new Blob(
      [`Title,Price,Stock,Category,Rating,Shop\n${csvData.join('\n')}`],
      { type: 'text/csv;charset=utf-8;' },
    );

    saveAs(blob, `products-page-${page}.csv`);
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

export default ProductList;
