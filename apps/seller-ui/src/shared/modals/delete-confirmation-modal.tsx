'use client';

import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import React from 'react';

type Product = {
  id: string;
  title: string;
  isDeleted: boolean;
  deletedAt?: string | null;
};

type DeleteConfirmationModalProps = {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  onRestore: () => void;
  loading?: boolean;
};

const DeleteConfirmationModal = ({
  product,
  onClose,
  onConfirm,
  onRestore,
  loading = false,
}: DeleteConfirmationModalProps) => {
  const isDeleted = product?.isDeleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          {isDeleted ? (
            <RotateCcw className="text-green-400" size={26} />
          ) : (
            <AlertTriangle className="text-red-400" size={26} />
          )}

          <h3 className="text-xl font-semibold text-white">
            {isDeleted ? 'Restore Product' : 'Delete Product'}
          </h3>
        </div>

        {/* Message Box */}
        <div
          className={`rounded-lg p-4 text-sm ${
            isDeleted
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}
        >
          {isDeleted ? (
            <>
              This product is currently scheduled for deletion.
              <br />
              Restoring it will make it publicly visible again.
            </>
          ) : (
            <>
              You are about to delete{' '}
              <span className="font-semibold text-white">
                "{product.title}"
              </span>
              .
              <br />
              It will be permanently removed after 24 hours.
              <br />
              You can restore it anytime within that period.
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={isDeleted ? onRestore : onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-semibold transition disabled:opacity-50 ${
              isDeleted
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {loading
              ? 'Processing...'
              : isDeleted
                ? 'Restore Product'
                : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
