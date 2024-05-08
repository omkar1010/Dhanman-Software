import MS_Rejection from "../models/MS_Rejection.js";
import TR_Rejection from "../models/TR_Rejection.js";
import MS_Product from "../models/MS_Product.js";
import { Op } from "sequelize";


export const getRejections = async (req, res) => {
    try {
      let response;
      if (req.role === "admin") {
        response = await TR_Rejection.findAll({
          attributes: [
            "id",
            "compId",
            "prodId",
            "rejecId",
            "Rejection_Date",
            "Rejection_Quantity",
            "last_updated"
          ],
          include: [
            {
              model: MS_Product,
              attributes: ["PK_ProductID", "ProductName"]
            },
            {
              model: MS_Rejection,
              attributes: ["PK_RejectonID", "RejectionType"]
            },
            {
              model: User,
              attributes: ["name", "email"]
            }
          ]
        });
      } else {
        response = await TR_Rejection.findAll({
          attributes: [
            "id",
            "compId",
            "prodId",
            "rejecId",
            "Rejection_Date",
            "Rejection_Quantity",
            "last_updated"
          ],
          where: {
            userId: req.userId
          },
          include: [
            {
              model: MS_Product,
              attributes: ["PK_ProductID", "ProductName"]
            },
            {
              model: MS_Rejection,
              attributes: ["PK_RejectonID", "RejectionType"]
            },
            {
              model: User,
              attributes: ["name", "email"]
            }
          ]
        });
      }
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  
  export const getRejectionById = async (req, res) => {
    try {
      const rejection = await TR_Rejection.findOne({
        where: {
          id: req.params.id
        }
      });
      if (!rejection) return res.status(404).json({ msg: "Data not found" });
      let response;
      if (req.role === "admin") {
        response = await TR_Rejection.findOne({
          attributes: [
            "id",
            "compId",
            "prodId",
            "rejecId",
            "Rejection_Date",
            "Rejection_Quantity",
            "last_updated"
          ],
          where: {
            id: rejection.id
          },
          include: [
            {
              model: MS_Product,
              attributes: ["PK_ProductID", "ProductName"]
            },
            {
              model: MS_Rejection,
              attributes: ["PK_RejectonID", "RejectionType"]
            },
            {
              model: User,
              attributes: ["name", "email"]
            }
          ]
        });
      } else {
        response = await TR_Rejection.findOne({
          attributes: [
            "id",
            "compId",
            "prodId",
            "rejecId",
            "Rejection_Date",
            "Rejection_Quantity",
            "last_updated"
          ],
          where: {
            [Op.and]: [{ id: rejection.id }, { userId: req.userId }]
          },
          include: [
            {
              model: MS_Product,
              attributes: ["PK_ProductID", "ProductName"]
            },
            {
              model: MS_Rejection,
              attributes: ["PK_RejectonID", "RejectionType"]
            },
            {
              model: User,
              attributes: ["name", "email"]
            }
          ]
        });
      }
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  
  export const createRejection = async (req, res) => {
    const {
      compId,
      prodId,
      rejecId,
      Rejection_Date,
      Rejection_Quantity
    } = req.body;
    try {
      await TR_Rejection.create({
        compId,
        prodId,
        rejecId,
        Rejection_Date,
        Rejection_Quantity,
        userId: req.userId
      });
      res.status(201).json({ msg: "Rejection Created Successfully" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  
  export const updateRejection = async (req, res) => {
    try {
      const rejection = await TR_Rejection.findOne({
        where: {
          id: req.params.id
        }
      });
      if (!rejection) return res.status(404).json({ msg: "Data not found" });
      const {
        compId,
        prodId,
        rejecId,
        Rejection_Date,
        Rejection_Quantity
      } = req.body;
      if (req.role === "admin") {
        await TR_Rejection.update(
          {
            compId,
            prodId,
            rejecId,
            Rejection_Date,
            Rejection_Quantity
          },
          {
            where: {
              id: rejection.id
            }
          }
        );
      } else {
        if (req.userId !== rejection.userId)
          return res.status(403).json({ msg: "Access forbidden" });
        await TR_Rejection.update(
          {
            compId,
            prodId,
            rejecId,
            Rejection_Date,
            Rejection_Quantity
          },
          {
            where: {
              [Op.and]: [{ id: rejection.id }, { userId: req.userId }]
            }
          }
        );
      }
      res.status(200).json({ msg: "Rejection Updated Successfully" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  
  export const deleteRejection = async (req, res) => {
    try {
      const rejection = await TR_Rejection.findOne({
        where: {
          id: req.params.id
        }
      });
      if (!rejection) return res.status(404).json({ msg: "Data not found" });
      if (req.role === "admin") {
        await TR_Rejection.destroy({
          where: {
            id: rejection.id
          }
        });
      } else {
        if (req.userId !== rejection.userId)
          return res.status(403).json({ msg: "Access forbidden" });
        await TR_Rejection.destroy({
          where: {
            [Op.and]: [{ id: rejection.id }, { userId: req.userId }]
          }
        });
      }
      res.status(200).json({ msg: "Rejection Deleted Successfully" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
  