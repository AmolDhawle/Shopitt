'use client';

import BreadCrumbs from 'apps/admin-ui/src/shared/components/breadcrumbs';
import axiosInstance from 'apps/admin-ui/src/utils/axiosInstance';
import { useEffect, useState } from 'react';

const tabs = ['Categories', 'Logo', 'Banner'];

const Customizations = () => {
  const [activeTab, setActiveTab] = useState('Categories');
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(
    {},
  );
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get(
          '/admin/api/get-all-customizations',
        );
        const data = res.data;

        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
        setLogo(data.logo || null);
        setBanner(data.banner || null);
      } catch (error) {
        console.error('Failed to fetch customization data', error);
      }
    };
    fetchCustomization();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axiosInstance.post('/admin/api/add-category', {
        category: newCategory,
      });
      setCategories((prev) => [...prev, newCategory]);
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category', error);
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim()) return;
    try {
      await axiosInstance.post('/admin/api/add-subcategory', {
        category: selectedCategory,
        subCategory: newSubCategory,
      });
      setSubCategories((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), newSubCategory],
      }));
      setNewSubCategory('');
    } catch (error) {
      console.error('Error adding subcategory', error);
    }
  };

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Customization</h2>

      <BreadCrumbs title="Customization" />

      {/* Tabs */}
      <div className="flex items-center text-white gap-8 mt-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="mt-8 text-white">
        {activeTab === 'Categories' && (
          <div className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-gray-400">No categories found.</p>
            ) : (
              categories.map((cat, idx) => (
                <div key={idx}>
                  <p className="font-semibold mb-1">{cat}</p>
                  {subCategories?.[cat]?.length > 0 ? (
                    <ul className="ml-4 text-sm text-gray-400 list-disc">
                      {subCategories[cat].map((sub, i) => (
                        <li key={i}>{sub}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ml-4 text-xs text-gray-500 italic">
                      No subcategories
                    </p>
                  )}
                </div>
              ))
            )}

            {/* Add New Category */}
            <div className="pt-4 space-x-2">
              <input
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-4 py-2 rounded-md bg-gray-900 border border-gray-700 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 transition rounded-md font-medium"
              >
                Add Category
              </button>
            </div>

            {/* Add Subcategory */}
            <div className="pt-4 flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-md text-sm focus:border-blue-500 outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter subcategory"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                className="px-4 py-2 rounded-md bg-gray-900 border border-gray-700 text-white text-sm focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleAddSubCategory}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 transition rounded-md font-medium"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Logo' && (
          <div className="space-y-4">
            {logo ? (
              <img
                src={logo}
                alt="Platform Logo"
                className="w-[120px] h-auto border border-gray-600 "
              />
            ) : (
              <p className="text-gray-400">No logo uploaded.</p>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('file', file);

                  try {
                    const res = await axiosInstance.post(
                      '/admin/api/upload-logo',
                      formData,
                    );

                    setLogo(res.data.logo);
                  } catch (error) {
                    console.error('Logo upload failed', error);
                  }
                }}
                className="text-sm text-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'Banner' && (
          <div className="space-y-4">
            {banner ? (
              <img
                src={banner}
                alt="Platform Banner"
                className="w-full max-w-[600px] h-auto border border-gray-600"
              />
            ) : (
              <p className="text-gray-400">No banner uploaded.</p>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('file', file);

                  try {
                    const res = await axiosInstance.post(
                      '/admin/api/upload-banner',
                      formData,
                    );

                    setBanner(res.data.banner);
                  } catch (error) {
                    console.error('Banner upload failed', error);
                  }
                }}
                className="text-sm text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customizations;
