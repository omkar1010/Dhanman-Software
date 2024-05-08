import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { getMe } from "../features/authSlice";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

import Autosuggest from "react-autosuggest";
import { CSVLink } from "react-csv";

// Add your validation schema
const schema = yup.object().shape({
  comp_name: yup.string().required("Company Name is required"),
  prod_name: yup.string().required("Product Name is required"),
  gradeId: yup.number().required("Grade is required"),
  No_of_casting_in_mould: yup
    .number()
    .typeError("Number of castings must be a valid number")
    .required("Number of castings is required"),
  Casting_Weight: yup
    .number()
    .typeError("Casting weight must be a valid number")
    .required("Casting weight is required"),
});

const Production = () => {
  const [companies, setCompanies] = useState([]);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [grades, setGrades] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState("");

  const [customers, setCustomers] = useState([]);

  const [currentCustomerId, setCurrentCustomerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const dispatches = useDispatch();
  const navigate = useNavigate();
  const { isError, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatches(getMe());
  }, [dispatches]);

  useEffect(() => {
    if (isError) {
      navigate("/");
    }
    if (user && user.role !== "melting" && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isError, user, navigate]);

  const handleDeleteCustomer = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this customer?"
      );
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/customers/${id}`);
        setIsLoaded(false);
        fetchData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditCustomer = (customer) => {
    reset({
      cust_name: customer.cust_name,
      comp_name: customer.comp_name,
      comp_add: customer.comp_add,
      gstn_number: customer.gstn_number,
      cont_num: customer.cont_num,
    });

    setCurrentCustomerId(customer.id);

    setIsEditing(true);
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchCompanies();
    fetchGrades();
    fetchData();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("http://localhost:5000/customers");
      setCompanies(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await axios.get("http://localhost:5000/grades");
      setGrades(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/products?includeNames=true"
      );

      const sortedData = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Map the products and include the grade name, company name, and product name in each product
      const mappedData = sortedData.map((product) => ({
        ...product,
        comp_name: product?.customer?.comp_name || "N/A",
        prod_name: product?.product?.prod_name || "N/A",
        grade_name: product?.MS_Grade?.Grade_Name || "N/A",
      }));

      setFilteredData(mappedData); // Set the filtered data
      setFilteredProducts(mappedData); // Set the filtered products
      setIsLoaded(true);
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Set the selected company name and product name in the data object
      data.comp_name = selectedCompany;
      data.prod_name = data.prod_name.trim(); // Trim any leading/trailing spaces

      // If editing, update the product
      if (isEditing) {
        const confirmUpdate = window.confirm(
          "Are you sure you want to update this Product?"
        );
        if (confirmUpdate) {
          await updateProduct(data);
          setIsEditing(false);
        }
      } else {
        // If adding, create a new product
        await addProduct(data);

        // Fetch the updated data after adding the new product
        setIsLoaded(false);
        await fetchData();

        // Reset the form fields
        reset();
        setSelectedCompany(""); // Reset the selected company
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addProduct = async (data) => {
    try {
      await axios.post("http://localhost:5000/products", data);
    } catch (error) {
      console.log(error);
    }
  };

  const updateProduct = async (data) => {
    try {
      const productId = currentProductId;
      await axios.patch(`http://localhost:5000/products/${productId}`, data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this product?"
      );
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/products/${id}`);
        setIsLoaded(false);
        await fetchData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditProduct = (product) => {
    reset({
      comp_name: product.comp_name,
      prod_name: product.prod_name,
      gradeId: product.gradeId,
      No_of_casting_in_mould: product.No_of_casting_in_mould,
      Casting_Weight: product.Casting_Weight,
    });

    setSelectedCompany(product.comp_name);
    setCurrentProductId(product.id);

    setIsEditing(true);
  };

  const handleExportCSV = () => {
    const csvData = filteredProducts.map((product) => ({
      Company_Name: product.comp_name,
      Product_Name: product.prod_name,
      Grade_Name: product.grade_name,
      No_of_casting_in_mould: product.No_of_casting_in_mould,
      Casting_Weight: product.Casting_Weight,
    }));

    return (
      <CSVLink
        data={csvData}
        filename={`products-${new Date().toISOString()}.csv`}
      >
        Export CSV
      </CSVLink>
    );
  };

  const handleCompanySearch = (value) => {
    const suggestions = companies.filter((company) =>
      company.comp_name.toLowerCase().includes(value.toLowerCase())
    );
    setCompanySuggestions(suggestions);
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company.comp_name);
    // Filter products based on the selected company name
    const filteredProducts = filteredData.filter(
      (product) => product.comp_name === company.comp_name
    );
    setFilteredProducts(filteredProducts);
    // Reset the form's company name field
    reset({ comp_name: company.comp_name });
  };

  const handleCompanyChange = (event, { newValue }) => {
    setSelectedCompany(newValue);

    const filteredProducts = filteredData.filter(
      (product) => product.comp_name === newValue
    );
    setFilteredProducts(filteredProducts);
  };

  const getSuggestionValue = (company) => {
    return company.comp_name;
  };

  const renderSuggestion = (suggestion) => {
    return <div>{suggestion?.comp_name}</div>;
  };

  const inputProps = {
    placeholder: "Search Company",
    value: selectedCompany,
    onChange: handleCompanyChange,
  };

  return (
    <>
      <div className="hero-body">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-6">
              {/* Customer Form */}
              <form
                className="p-8 rounded-s-md"
                style={{ backgroundColor: "#CAFFF0" }}
                onSubmit={handleSubmit(onSubmit)}
              >
                <h2
                  className="text-center m-5 text-header-add"
                  style={{
                    color: "#006A4D",
                    fontFamily: "Inter",
                    fontSize: "28px",
                  }}
                >
                  Add New Customer
                </h2>

                {/* Form fields... */}
                <div className="field field-equal-width">
                  <div className="control">
                    <label className="label">Company Name</label>
                    <Autosuggest
                      suggestions={companySuggestions}
                      onSuggestionsFetchRequested={({ value }) =>
                        handleCompanySearch(value)
                      }
                      onSuggestionsClearRequested={() =>
                        setCompanySuggestions([])
                      }
                      getSuggestionValue={getSuggestionValue}
                      renderSuggestion={renderSuggestion}
                      inputProps={{
                        ...inputProps,
                        style: {
                          width: "100%", // Default width for all devices
                          maxWidth: "400px", // Maximum width for larger screens
                          margin: "0 auto", // Center the input field
                          padding: "6px", // Add some padding for better appearance
                          boxSizing: "border-box", // Ensure padding is included in the total width
                          border: "0.5px ridge #D8D8D8", // Remove the border
                        },
                      }}
                      onSuggestionSelected={(_, { suggestion }) =>
                        handleCompanySelect(suggestion)
                      }
                      value={selectedCompany}
                    />

                    {errors.comp_name && (
                      <p className="help is-danger">
                        {errors.comp_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">Product Name</label>
                    <Controller
                      name="prodId"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`input ${
                            errors.prodId ? "is-danger" : ""
                          }`}
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((product) => {
                            console.log(product); // Log the entire product object
                            console.log(product.prodId, product.prod_name); // Log the values for each product
                            return (
                              <option
                                key={product.prodId}
                                value={product.prodId}
                              >
                                {product.prod_name}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    />
                    {errors.prodId && (
                      <p className="help is-danger">{errors.prodId.message}</p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">Company Address</label>
                    <Controller
                      name="comp_add"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.comp_add ? "is-danger" : ""
                          }`}
                          type="text"
                          placeholder="Enter Company Address"
                        />
                      )}
                    />
                    {errors.comp_add && (
                      <p className="help is-danger">
                        {errors.comp_add.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">GST Number</label>
                    <Controller
                      name="gstn_number"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.gstn_number ? "is-danger" : ""
                          }`}
                          type="text"
                          placeholder="Enter GST Number"
                        />
                      )}
                    />
                    {errors.gstn_number && (
                      <p className="help is-danger">
                        {errors.gstn_number.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">Contact Number</label>
                    <Controller
                      name="cont_num"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.cont_num ? "is-danger" : ""
                          }`}
                          type="text"
                          placeholder="Enter Contact Number"
                        />
                      )}
                    />
                    {errors.cont_num && (
                      <p className="help is-danger">
                        {errors.cont_num.message}
                      </p>
                    )}
                  </div>
                </div>

                <center>
                  <div className="field">
                    <div className="control">
                      <button type="submit" className="button is-success">
                        {isEditing ? "Update" : "Add"}
                      </button>
                    </div>
                  </div>
                </center>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="container mt-5">
        {/* Date Filter */}
        <div className="date-filter-container">
          <div
            className="field"
            style={{
              padding: "10px",
              justifyContent: "space-between",
              alignItems: "center",
              display: "flex",
            }}
          >
            <div className="w-auto" style={{ display: "flex", gap: "10px" }}>
              <div className="field">
                <label className="label">Start Date:</label>
                <div className="control">
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">End Date:</label>
                <div className="control">
                  <input
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {/* <div className="field">
                      <div className="control">
                        <button
                          className="button is-primary"
                          onClick={handleDateFilter}
                        >
                          Filter
                        </button>
                      </div>
                    </div> */}
            </div>
            {/* Export CSV Button */}
            {handleExportCSV()}
          </div>
        </div>
        <table className="table is-striped is-bordered is-fullwidth">
          <thead>
            <tr>
              <th>Sr.No</th>
              <th>Customer Name</th>
              <th>Company Name</th>
              <th>GST Number</th>
              <th>Contact Number</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoaded ? (
              customers.map((customer, index) => {
                const createdAtDate = new Date(
                  customer.createdAt
                ).toLocaleDateString(); // Extract the date and format it

                return (
                  <tr key={customer.id}>
                    <td>{index + 1}</td>
                    <td>{customer.cust_name}</td>
                    <td>{customer.comp_name}</td>
                    <td>{customer.gstn_number}</td>
                    <td>{customer.cont_num}</td>
                    <td>{createdAtDate}</td> {/* Display the formatted date */}
                    <td>
                      {user && (
                        <>
                          {user.role === "admin" || user.role === "dispatch" ? (
                            <>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="edit-button ml-1"
                              >
                                <i className="fi fi-rr-edit"></i>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCustomer(customer.id)
                                }
                                className="delete-button ml-2"
                              >
                                <i className="fi fi-rs-trash"></i>
                              </button>
                            </>
                          ) : (
                            <span>No actions</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7">Loading...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Production;
