import TR_Dispatch from "../models/TR_Dispatch.js";
import MS_Product from "../models/MS_Product.js";
import MS_CustomerModel from "../models/MS_CustomerModel.js";

// Get all dispatches
export const getDispatdches = async (req, res) => {
  try {
    const dispatch = await TR_Dispatch.findAll({
      attributes: [
        "id",
        "Dispatch_Date",
        "compId",
        "prodId",
        "Dispatch_Quantity",
        "userId",
      ],
      // No need to include TR_Product_Registration here
    });
    res.status(200).json(dispatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


export const getDispatches = async (req, res) => {
  try {
    const dispatches = await TR_Dispatch.findAll({
      attributes: [
        "id",
        "Dispatch_Date",
        "compId",
        "prodId",
        "Dispatch_Quantity",
        "userId",
      ],
    });

    const dispatchesWithNames = await Promise.all(
      dispatches.map(async (dispatch) => {
        const company = await MS_CustomerModel.findOne({
          where: { PK_CompanyID: dispatch.compId },
        });

        const product = await MS_Product.findOne({
          where: { PK_ProductID: dispatch.prodId },
        });

        return {
          id: dispatch.id,
          Dispatch_Date: dispatch.Dispatch_Date,
          compId: dispatch.compId,
          comp_name: company ? company.comp_name : null,
          prodId: dispatch.prodId,
          prod_name: product ? product.prod_name : null,
          Dispatch_Quantity: dispatch.Dispatch_Quantity,
          userId: dispatch.userId,
        };
      })
    );

    res.status(200).json(dispatchesWithNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Get dispatch by ID
export const getDispatchById = async (req, res) => {
  const { id } = req.params;
  try {
    const dispatch = await TR_Dispatch.findOne({
      where: { id },
      attributes: [
        "id",
        "Dispatch_Date",
        "compId",
        "prodId",
        "Dispatch_Quantity",
        "userId",
      ],
    });
    if (!dispatch) return res.status(404).json({ msg: "Dispatch not found" });
    res.status(200).json(dispatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Create a new dispatch
export const createDispatch = async (req, res) => {
  const { comp_name, prod_name, Dispatch_Date, Dispatch_Quantity } = req.body;

  try {
    const customer = await MS_CustomerModel.findOne({
      where: {
        comp_name: comp_name,
      },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ msg: "Customer not found with the given comp_name" });
    }

    // const product = await MS_Product.findOne({
    //   where: {
    //     prod_name: prod_name,
    //   },
    // });

    // if (!product) {
    //   return res
    //     .status(404)
    //     .json({ msg: "Product not found with the given prod_name" });
    // }

    // Access the userId from the request object (assuming it's set by authentication middleware)
    const userId = req.user.id; // Modify this line based on how userId is stored in the request

    const dispatch = await TR_Dispatch.create({
      compId: customer.PK_CompanyID,
      prodId: prod_name,
      Dispatch_Date,
      Dispatch_Quantity,
      userId: userId, // Set the userId based on the authenticated user's role
    });

    res.status(201).json({
      msg: "dispatch created successfully",
      dispatch: {
        id: dispatch.id,
        compId: customer.PK_CompanyID,
        prodId: prod_name,
        Dispatch_Date,
        Dispatch_Quantity,
        userId,
        createdAt: dispatch.createdAt,
        updatedAt: dispatch.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Update an existing dispatch
export const updateDispatch = async (req, res) => {
  const { Dispatch_Date, compId, prodId, Dispatch_Quantity } = req.body;
  try {
    const dispatch = await TR_Dispatch.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!dispatch)
      return res.status(404).json({ msg: "Dispatch Entry not found" });

    // If you want to check if the selected compId and prodId exist in TR_Product_Registration table,
    // you can add that validation here before updating.

    // Access the userId from the request object (assuming it's set by authentication middleware)
    const userId = req.user.id; // Modify this line based on how userId is stored in the request

    await TR_Dispatch.update(
      {
        Dispatch_Date: Dispatch_Date,
        compId: compId,
        prodId: prodId,
        Dispatch_Quantity: Dispatch_Quantity,
        userId: userId, // Set the userId based on the authenticated user's role
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    res.status(200).json({ msg: "Dispatch updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Delete a dispatch
export const deleteDispatch = async (req, res) => {
  try {
    const dispatch = await TR_Dispatch.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!dispatch) return res.status(404).json({ msg: "Dispatch not found" });

    await TR_Dispatch.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({ msg: "Dispatch deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
