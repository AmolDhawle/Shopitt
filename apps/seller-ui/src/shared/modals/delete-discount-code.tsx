import { AlertTriangle, Loader2, X } from 'lucide-react';
import React, { useEffect } from 'react';

type Props = {
  discount: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
};

const DeleteDiscountCodeModal = ({
  discount,
  onClose,
  onConfirm,
  isDeleting = false,
}: Props) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isDeleting, onClose]);

  if (!discount) return null;

  const isExpired =
    discount.expiresAt && new Date(discount.expiresAt) < new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={!isDeleting ? onClose : undefined}
    >
      <div
        className="bg-gray-900 w-[480px] rounded-xl shadow-2xl border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Delete Discount Code
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="text-sm text-gray-300">
            You are about to permanently delete this discount:
          </div>

          {/* Coupon Info Box */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">
                {discount.publicName}
              </span>

              <span className="font-mono text-cyan-400 text-sm">
                {discount.discountCode}
              </span>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {discount.discountType === 'PERCENTAGE'
                ? `${discount.discountValue}%`
                : `₹${discount.discountValue}`}{' '}
              •{' '}
              {isExpired
                ? 'Expired'
                : discount.expiresAt
                  ? `Expires ${new Date(
                      discount.expiresAt,
                    ).toLocaleDateString()}`
                  : 'No expiry'}
            </div>
          </div>

          <div className="text-sm text-red-400 font-medium">
            This action cannot be undone.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center gap-2 disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDiscountCodeModal;
