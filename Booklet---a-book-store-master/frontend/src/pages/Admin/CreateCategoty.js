import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "../../config/axios";
import { getApiErrorMessage } from "../../utils/errorUtils";

import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";
import { FiEdit2, FiFolder, FiPlusCircle, FiTrash2 } from "react-icons/fi";
const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  //handle Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/v1/category/create-category", {
        name,
      });
      if (data?.success) {
        toast.success(`${name} is created`);
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to create category"));
    }
  };

  //get all cat
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to load categories"));
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  //update category
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        { name: updatedName }
      );
      if (data?.success) {
        toast.success(`${updatedName} is updated`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to update category"));
    }
  };
  //delete category
  const handleDelete = async (pId) => {
    try {
      const { data } = await axios.delete(
        `/api/v1/category/delete-category/${pId}`
      );
      if (data.success) {
        toast.success(`category is deleted`);

        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to delete category"));
    }
  };
  return (
    <Layout title={"Admin - Categories"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="p-1 sm:p-2 space-y-5">
              <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                      <FiFolder className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-primary-900">
                        Manage Categories
                      </h1>
                      <p className="text-sm text-primary-600">
                        Create, update, and organize your product categories.
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-3 py-2 shadow-sm">
                    <span className="text-xs uppercase tracking-wide text-primary-500">
                      Total
                    </span>
                    <span className="text-lg font-semibold text-primary-900">
                      {categories?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-primary-800">
                    Create New Category
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs text-primary-500">
                    <FiPlusCircle className="h-3.5 w-3.5" />
                    Quick add
                  </span>
                </div>
                <CategoryForm
                  handleSubmit={handleSubmit}
                  value={name}
                  setValue={setName}
                  placeholder="Enter category name"
                  buttonText="Add Category"
                />
              </div>

              <div className="rounded-xl border border-primary-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-primary-100 px-3 py-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    Category List
                  </h2>
                  <span className="text-[11px] text-primary-500">
                    {categories?.length || 0} items
                  </span>
                </div>

                {categories?.length ? (
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {categories?.map((c, idx) => (
                        <div
                          key={c._id}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 pl-2 pr-1 py-1"
                        >
                          <span className="text-[10px] font-semibold text-primary-500">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-primary-800 max-w-[200px] truncate">
                            {c.name}
                          </span>
                          <button
                            className="h-6 w-6 rounded-full border border-accent-200 bg-white text-accent-700 hover:bg-accent-50 inline-flex items-center justify-center"
                            onClick={() => {
                              setVisible(true);
                              setUpdatedName(c.name);
                              setSelected(c);
                            }}
                            aria-label={`Edit ${c.name}`}
                            title="Edit"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-6 w-6 rounded-full border border-red-200 bg-white text-red-700 hover:bg-red-50 inline-flex items-center justify-center"
                            onClick={() => {
                              handleDelete(c._id);
                            }}
                            aria-label={`Delete ${c.name}`}
                            title="Delete"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary-50 text-primary-500 border border-primary-100 flex items-center justify-center">
                      <FiFolder className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-primary-800">
                      No categories yet
                    </h3>
                    <p className="mt-1 text-sm text-primary-500">
                      Create your first category using the form above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          onCancel={() => setVisible(false)}
          footer={null}
          open={visible}
          centered
          title={
            <div className="text-base font-semibold text-primary-900">
              Update Category
            </div>
          }
        >
          <div className="pt-1">
            <CategoryForm
              value={updatedName}
              setValue={setUpdatedName}
              handleSubmit={handleUpdate}
              placeholder="Update category name"
              buttonText="Save Changes"
              autoFocus
            />
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default CreateCategory;
