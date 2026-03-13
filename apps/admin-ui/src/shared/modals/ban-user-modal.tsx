'use client';

import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import React from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  isBanned?: boolean;
};

type BanUserModalProps = {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  onUnban: () => void;
  loading?: boolean;
};

const BanUserModal = ({
  user,
  onClose,
  onConfirm,
  onUnban,
  loading = false,
}: BanUserModalProps) => {
  const isBanned = user?.isBanned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          {isBanned ? (
            <RotateCcw className="text-green-400" size={26} />
          ) : (
            <AlertTriangle className="text-red-400" size={26} />
          )}

          <h3 className="text-xl font-semibold text-white">
            {isBanned ? 'Unban User' : 'Ban User'}
          </h3>
        </div>

        {/* Warning */}
        <div
          className={`rounded-lg p-4 text-sm ${
            isBanned
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}
        >
          {isBanned ? (
            <>
              This user is currently banned.
              <br />
              Unbanning will restore their access.
            </>
          ) : (
            <>
              You are about to ban{' '}
              <span className="font-semibold text-white">"{user.name}"</span>
              .
              <br />
              The user will lose access to their account immediately.
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>

          <button
            onClick={isBanned ? onUnban : onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-semibold ${
              isBanned
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {loading ? 'Processing...' : isBanned ? 'Unban User' : 'Ban User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal;
