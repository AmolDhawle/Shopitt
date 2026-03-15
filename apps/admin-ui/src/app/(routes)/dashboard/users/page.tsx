'use client';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import { Ban, ChevronRight, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import React, { useDeferredValue, useMemo, useState } from 'react';
import BanUserModal from 'apps/admin-ui/src/shared/modals/ban-user-modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Meta {
  totalUsers: number;
  currentPage: number;
  totalPages: number;
}

interface UsersResponse {
  success: boolean;
  users: User[];
  meta: Meta;
}

const UsersPage = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'AllRoles' | 'Admin' | 'User'>(
    'AllRoles',
  );
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [page, setPage] = useState(1);

  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const limit = 10;

  const queryOptions: UseQueryOptions<UsersResponse> = {
    queryKey: ['users-list', page],
    queryFn: async () => {
      const res = await axiosInstance.get<UsersResponse>(
        `/admin/api/get-all-users?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  };

  const { data, isLoading } = useQuery<UsersResponse>(queryOptions);

  const allUsers = data?.users || [];
  const meta = data?.meta;

  // filter by search & role
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((user: User) => {
        const values = Object.values(user).join(' ').toLowerCase();
        return values.includes(deferredGlobalFilter.toLowerCase());
      })
      .filter((user) => roleFilter === 'AllRoles' || user.role === roleFilter);
  }, [allUsers, deferredGlobalFilter, roleFilter]);

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }: any) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : '-',
      },

      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => (
          <button
            onClick={() => openBanModal(row.original)}
            className="p-1 bg-red-600 hover:bg-red-700 rounded"
          >
            <Ban size={16} />
          </button>
        ),
      },
    ],
    [],
  );

  const openBanModal = (user: any) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const table = useReactTable({
    data: filteredUsers,
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
      const user = row.original;
      return `${user.name},${user.email},${user.role},${new Date(
        user.createdAt,
      ).toLocaleDateString()}`;
    });

    const blob = new Blob(['Name,Email,Role,Joined\n' + csvData.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    saveAs(blob, `users-page-${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">All Users</h2>
        <div className="flex gap-2 items-center">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            <option value="AllRoles">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>

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
        <span className="text-white">All Users</span>
      </div>

      {/* Search */}
      <div className="flex items-center bg-gray-900 p-2 mb-4 rounded-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading users...</p>
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

            {showBanModal && selectedUser && (
              <BanUserModal
                user={selectedUser}
                onClose={() => setShowBanModal(false)}
                onConfirm={() => {
                  console.log('Ban user', selectedUser.id);
                  setShowBanModal(false);
                }}
                onUnban={() => {
                  console.log('Unban user', selectedUser.id);
                  setShowBanModal(false);
                }}
              />
            )}

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

export default UsersPage;
