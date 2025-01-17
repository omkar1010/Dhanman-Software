import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import Autosuggest from "react-autosuggest";
import { CSVLink } from "react-csv";

const schema = yup.object().shape({
  comp_name: yup.object(), // Change to compId
  prod_name: yup.string().required("Product is required"),
  Dispatch_Date: yup.date().required("dispatch Date is required"),
  Dispatch_Quantity: yup
    .number()
    .typeError("dispatch Quantity must be a valid number")
    .required("dispatch Quantity is required"),
});

// const schema = yup.object().shape({
//   comp_name: yup.string(), // Change to compId
//   prod_name: yup.string(),
//   Dispatch_Date: yup.date(),
//   Dispatch_Quantity: yup
//     .number(),
// });
const DispatchProductPage = () => {
  const [companies, setCompanies] = useState([]);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState({});
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dispatchList, setDispatchList] = useState([])
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDispatchId, setCurrentScheduleId] = useState("");
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
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/products");
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/dispatches");

      const sortedData = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Fetch the product data from the products endpoint
      const productResponse = await axios.get("http://localhost:5000/products");
      const productsData = productResponse.data.reduce(
        (acc, product) => ({
          ...acc,
          [product.prodId]: product.prod_name,
        }),
        {}
      );

      // Map the dispatches and include the product name in each dispatch
      const uniqueCompIds = new Set();
      const uniqueProdIds = new Set();
      
      const filteredData = response.data.reduce((acc, dispatch) => {
        if (!uniqueCompIds.has(dispatch.compId) && !uniqueProdIds.has(dispatch.prodId)) {
          uniqueCompIds.add(dispatch.compId);
          uniqueProdIds.add(dispatch.prodId);
      
          return [
            ...acc,
            {
              ...dispatch,
              comp_name: productsData[dispatch.compId] || "N/A",
              prod_name: productsData[dispatch.prodId] || "N/A",
            },
          ];
        }
        return acc;
      }, []);

      setFilteredProducts(filteredData);
      setDispatchList(response.data)
      
      setIsLoaded(true);
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmitData =  async (data) => {
    console.log("function called");
    try {
      // Set the selected company name and product name in the data object
      data.comp_name = selectedCompany.comp_name;
      data.prod_name = data.prod_name.trim(); // Trim any leading/trailing spaces

      // If editing, update the product
      if (isEditing) {
        const confirmUpdate = window.confirm(
          "Are you sure you want to update this Product?"
        );
        if (confirmUpdate) {
          await updateDispatch(data);
          setIsEditing(false);
        }
      } else {
        // If adding, create a new product
        await AddDispatch(data);

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


  const AddDispatch = async (data) => {
    try {
      await axios.post(`http://localhost:5000/dispatches`, data);
    } catch (error) {
      console.log(error);
    }
  };

  const updateDispatch = async (data) => {
    try {
      const dispatchId = currentDispatchId;
      await axios.patch(`http://localhost:5000/dispatches/${dispatchId}`, data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this dispatch?"
      );
      if (confirmDelete) {
        await axios.delete(`http://localhost:5000/dispatche/${id}`);
        setIsLoaded(false);
        fetchData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditSchedule = (dispatch) => {
    reset({
      comp_name: dispatch.comp_name,
      prod_name: dispatch.prod_name,
      Dispatch_Date: dispatch.Dispatch_Date,
      Dispatch_Quantity: dispatch.Dispatch_Quantity,
    });

    setSelectedCompany({
      compId: dispatch.compId,
      comp_name: dispatch.comp_name,
    });
    setCurrentScheduleId(dispatch.id);

    setIsEditing(true);
  };

  const handleExportCSV = () => {
    const csvData = filteredProducts.map((dispatch) => ({
      Company_Name: dispatch.comp_name,
      Product_Name: dispatch.prod_name,
      Dispatch_Date: dispatch.Dispatch_Date,
      Schedule_Quantity: dispatch.Dispatch_Quantity,
    }));

    return (
      <CSVLink
        data={csvData}
        filename={`dispatches-${new Date().toISOString()}.csv`}
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
    setSelectedCompany(company);

    if (company.compId) {
      // If company.compId exists, filter products based on the selected company ID (compId)
      const filteredProducts = products.filter(
        (product) => product.compId === company.compId
      );
      setFilteredProducts(filteredProducts);
    } else if (company.comp_name) {
      // If company.comp_name exists, filter products based on the selected company name (comp_name)
      const filteredProducts = products.filter(
        (product) => product.comp_name === company.comp_name
      );
      setFilteredProducts(filteredProducts);
    }
  };

  const handleCompanyChange = (event, { newValue }) => {
    if (!newValue) {
      // If newValue is empty, reset the selectedCompany state
      setSelectedCompany({});
      // Reset the filtered products to show all products
      setFilteredProducts(products);
    } else {
      // If newValue is not empty, set compId to null and only set comp_name
      setSelectedCompany({ compId: null, comp_name: newValue });
      // Filter the products based on the entered company name (comp_name)
      const filteredProducts = products.filter(
        (product) => product.comp_name === newValue
      );
      setFilteredProducts(filteredProducts);
    }
  };

  const getSuggestionValue = (company) => {
    return company.comp_name;
  };

  const renderSuggestion = (company) => {
    return <div>{company.comp_name}</div>;
  };

  const inputProps = {
    placeholder: "Search Company",
    value: selectedCompany?.comp_name || "", // Use optional chaining to safely access comp_name
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
                onSubmit={
                  handleSubmit(onSubmitData)
                }
              >
                <h2
                  className="text-center m-5 text-header-add"
                  style={{
                    color: "#006A4D",
                    fontFamily: "Inter",
                    fontSize: "28px",
                  }}
                >
                  Add New dispatch
                </h2>

                <div className="field">
                  <div className="control">
                    <label className="label">dispatch Date</label>
                    <Controller
                      name="Dispatch_Date"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.Dispatch_Date ? "is-danger" : ""
                          }`}
                          type="date"
                          placeholder="Enter dispatch Date"
                        />
                      )}
                    />
                    {errors.Dispatch_Date && (
                      <p className="help is-danger">
                        {errors.Dispatch_Date.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control" style={{ width: "100%" }}>
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
                        name:"comp_name",
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
                    />
                    {errors.compId && (
                      <p className="help is-danger">{errors.compId.message}</p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <label className="label">Product Name</label>
                    <Controller
                      name="prod_name"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`input ${
                            errors.prodId ? "is-danger" : ""
                          }`}
                          value={field.value} // Set the value to the prodId from the form data
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((product) => (
                            <option key={product.prodId} value={product.prodId}>
                              {product.product?.prod_name}
                            </option>
                          ))}
                        </select>
                      )}
                    />

                    {errors.prodId && (
                      <p className="help is-danger">{errors.prodId.message}</p>
                    )}
                  </div>
                </div>

                {/* dispatch Quantity */}
                <div className="field">
                  <div className="control">
                    <label className="label">dispatch Quantity</label>
                    <Controller
                      name="Dispatch_Quantity"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`input ${
                            errors.Dispatch_Quantity ? "is-danger" : ""
                          }`}
                          type="number"
                          placeholder="Enter dispatch Quantity"
                        />
                      )}
                    />
                    {errors.Dispatch_Quantity && (
                      <p className="help is-danger">
                        {errors.Dispatch_Quantity.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <div className="control">
                    <button type="submit" className="button is-primary">
                      {isEditing ? "Update" : "Add"}
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
              <th>dispatch Date</th>
              <th>dispatch Quantity</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoaded ? (
              dispatchList.map((dispatch, index) => (
                <tr key={dispatch.id}>
                  <td>{index + 1}</td>
                  <td>{dispatch.comp_name}</td>
                  <td>{dispatch.prod_name}</td>
                  <td>{dispatch.Dispatch_Date}</td>
                  <td>{dispatch.Dispatch_Quantity}</td>
                  <td>{new Date(dispatch.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="edit-button ml-1"
                      onClick={() => handleEditSchedule(dispatch)}
                    >
                      <i className="fi fi-rr-edit"></i>
                    </button>{" "}
                    <button
                      className="delete-button ml-2"
                      onClick={() => handleDeleteSchedule(dispatch.id)}
                    >
                      <i className="fi fi-rs-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="has-text-centered">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DispatchProductPage;
