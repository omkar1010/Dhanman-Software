import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import MS_CustomerModel from "./MS_CustomerModel.js";
import MS_Product from "./MS_Product.js";

const { DataTypes } = Sequelize;

const TR_Dispatch = db.define(
  "tr_dispatch",
  {
    compId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    prodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    Dispatch_Date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
        isDate: true,
      },
    },
    Dispatch_Quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: -9999,
        max: 9999,
      },
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    freezeTableName: true,
  }
);

Users.hasMany(TR_Dispatch);
TR_Dispatch.belongsTo(Users, { foreignKey: "userId" });
TR_Dispatch.belongsTo(MS_CustomerModel, { foreignKey: "compId" });
TR_Dispatch.belongsTo(MS_Product, { foreignKey: "prodId" });

export default TR_Dispatch;
