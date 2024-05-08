import TR_Schedule from "../models/TR_Schedule.js";
import MS_CustomerModel from "../models/MS_CustomerModel.js";
import MS_Product from "../models/MS_Product.js";

export const getSchedules = async (req, res) => {
  try {
    const schedules = await TR_Schedule.findAll({
      attributes: ["id", "compId", "prodId", "Schedule_Date", "Shedule_Quantity", "userId"],
    });

    const schedulesWithNames = await Promise.all(
      schedules.map(async (schedule) => {
        const company = await MS_CustomerModel.findOne({
          where: { PK_CompanyID: schedule.compId },
        });

        const product = await MS_Product.findOne({
          where: { PK_ProductID: schedule.prodId },
        });

        return {
          id: schedule.id,
          compId: schedule.compId,
          comp_name: company ? company.comp_name : null,
          prodId: schedule.prodId,
          prod_name: product ? product.prod_name : null,
          Schedule_Date: schedule.Schedule_Date,
          Shedule_Quantity: schedule.Shedule_Quantity,
          userId: schedule.userId,
        };
      })
    );

    res.status(200).json(schedulesWithNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


export const getScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await TR_Schedule.findOne({
      where: { id },
      attributes: ["id", "compId", "prodId", "Schedule_Date", "Shedule_Quantity", "userId"],
    });
    if (!schedule) return res.status(404).json({ msg: "Schedule not found" });
    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


export const createSchedule = async (req, res) => {
  const { comp_name, prod_name, Schedule_Date, Shedule_Quantity } = req.body;

  try {
    const customer = await MS_CustomerModel.findOne({
      where: {
        comp_name: comp_name,
      },
    });

    if (!customer) {
      return res.status(404).json({ msg: "Customer not found with the given comp_name" });
    }

    // const product = await MS_Product.findOne({
    //   where: {
    //     prod_name: prod_name,
    //   },
    // });

    // if (!product) {
    //   return res.status(404).json({ msg: "Product not found with the given prod_name" });
    // }

    // Access the userId from the request object (assuming it's set by authentication middleware)
    const userId = req.user.id; // Modify this line based on how userId is stored in the request

    const schedule = await TR_Schedule.create({
      compId: customer.PK_CompanyID,
      prodId: prod_name,
      Schedule_Date,
      Shedule_Quantity,
      userId: userId, // Set the userId based on the authenticated user's role
    });

    res.status(201).json({
      msg: "Schedule created successfully",
      schedule: {
        id: schedule.id,
        compId: customer.PK_CompanyID,
        prodId: prod_name,
        Schedule_Date,
        Shedule_Quantity,
        userId,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};


export const updateSchedule = async (req, res) => {
  const { compId, prodId, Schedule_Date, Shedule_Quantity } = req.body;
  try {
    const schedule = await TR_Schedule.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!schedule) return res.status(404).json({ msg: "Schedule not found" });

    // If you want to check if the selected compId and prodId exist in TR_Product_Registration table,
    // you can add that validation here before updating.

    // Access the userId from the request object (assuming it's set by authentication middleware)
    const userId = req.user.id; // Modify this line based on how userId is stored in the request

    await TR_Schedule.update(
      {
        compId: compId,
        prodId: prodId,
        Schedule_Date: Schedule_Date,
        Shedule_Quantity: Shedule_Quantity,
        userId: userId, // Set the userId based on the authenticated user's role
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    res.status(200).json({ msg: "Schedule updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await TR_Schedule.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!schedule) return res.status(404).json({ msg: "Schedule not found" });

    await TR_Schedule.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({ msg: "Schedule deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
