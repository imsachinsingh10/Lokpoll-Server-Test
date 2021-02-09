insert into db_logs (`dev`, scriptName) values ('himanshu', '008_profile_type_table_created.sql');

-- -----------------------------------------------------
-- Table `profile`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `profile`;
CREATE TABLE `profile` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(20) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  `imageUrl` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

ALTER TABLE `user`
DROP COLUMN `lastName`,
CHANGE COLUMN `firstName` `name` VARCHAR(50) NULL DEFAULT NULL ;
