import {Sequelize} from "sequelize";

const db = new Sequelize('Dhanman-Database-sample', 'root', '', {
    host: "localhost",
    dialect: "mysql"
});

export default db;