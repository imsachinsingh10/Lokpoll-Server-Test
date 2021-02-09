insert into db_logs (`dev`, scriptName) values ('himanshu', '010_columns_added_in_user_table.sql');

ALTER TABLE `user`
add COLUMN `profession` varchar(40) NULL DEFAULT null,
add COLUMN `company` varchar(40) NULL DEFAULT null,
add COLUMN `latitude` varchar(40) NULL DEFAULT null,
add COLUMN `longitude` varchar(40) NULL DEFAULT null;

-- -----------------------------------------------------
-- Table `hobby`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `hobby`;
CREATE TABLE `hobby` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT NULL,
  `hobby` varchar(200) DEFAULT NULL,
  `createdAt` datetime DEFAULT null,
  PRIMARY KEY (`id`)
);
