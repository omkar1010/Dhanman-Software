import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import { getMe } from "../features/authSlice";
import Autosuggest from "react-autosuggest";
import { CSVLink } from "react-csv";
import "../index.css"

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

const AddProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isError, user } = useSelector((state) => state.auth);
  const [companies, setCompanies] = useState([]);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [grades, setGrades] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState("");

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      navigate("/");
    }
    if (user && user.role !== "dispatch" && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isError, user, navigate]);

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
              <form
                className="p-8 rounded-s-md"
                style={{ backgroundColor: "#CAFFF0" }}
                onSubmit={handleSubmit(onSubmit)}
              >
                <h2
                  className="text-center m-5 text-header-add font-semibold"
                  style={{
                    color: "#006A4D",
                    fontFamily: "Inter",
                    fontSize: "28px",
                  }}
                >
                  Add New Product
                </h2>

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
                      name="prod_name"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="input"
                          type="text"
                          placeholder="Enter product name"
                        />
                      )}
                    />
                    {errors.prod_name && (
                      <p className="help is-danger">
                        {errors.prod_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">Grade</label>
                    <Controller
                      name="gradeId"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`input ${
                            errors.gradeId ? "is-danger" : ""
                          }`}
                        >
                          <option value="">Select Grade</option>
                          {grades.map((grade) => (
                            <option
                              key={grade.PK_GradeId}
                              value={grade.PK_GradeId}
                            >
                              {grade.Grade_Name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.gradeId && (
                      <p className="help is-danger">{errors.gradeId.message}</p>
                    )}
                  </div>
                </div>

                {/* Number of Castings */}
                <div className="field">
                  <div className="control">
                    <label className="label">Number of Castings</label>
                    <Controller
                      name="No_of_casting_in_mould"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.No_of_casting_in_mould ? "is-danger" : ""
                          }`}
                          type="number"
                          placeholder="Enter Number of Castings"
                        />
                      )}
                    />
                    {errors.No_of_casting_in_mould && (
                      <p className="help is-danger">
                        {errors.No_of_casting_in_mould.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Casting Weight */}
                <div className="field">
                  <div className="control">
                    <label className="label">Casting Weight</label>
                    <Controller
                      name="Casting_Weight"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.Casting_Weight ? "is-danger" : ""
                          }`}
                          type="number"
                          placeholder="Enter Casting Weight"
                        />
                      )}
                    />
                    {errors.Casting_Weight && (
                      <p className="help is-danger">
                        {errors.Casting_Weight.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <button type="submit" className="button is-primary">
                      {isEditing ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <table className="table is-striped is-bordered is-fullwidth">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Company Name</th>
              <th>Product Name</th>
              <th>Grade</th>
              <th>No. of Castings</th>
              <th>Casting Weight</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoaded ? (
              filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>{product.comp_name}</td>
                  <td>{product.prod_name}</td>
                  <td>{product.grade_name}</td>
                  <td>{product.No_of_casting_in_mould}</td>
                  <td>{product.Casting_Weight}</td>
                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td>
                    {user && (
                      <>
                        {user.role === "admin" || user.role === "dispatch" ? (
                          <>
                            <button
                              className="edit-button ml-1"
                              onClick={() => handleEditProduct(product)}
                            >
                              <i className="fi fi-rr-edit"></i>
                            </button>{" "}
                            <button
                              className="delete-button ml-2"
                              onClick={() => handleDeleteProduct(product.id)}
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className="has-text-centered">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* <div className="container mt-5 has-text-centered">
        <div className="buttons">{handleExportCSV()}</div>
      </div> */}
    </>
  );
};

export default AddProductPage;
