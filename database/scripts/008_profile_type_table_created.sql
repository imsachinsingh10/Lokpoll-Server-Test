insert into db_logs (`dev`, scriptName) values ('himanshu', '008_profile_type_table_created.sql');

-- -----------------------------------------------------
-- Table `profile_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `profile_type`;
CREATE TABLE `profile_type` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

alter table post add column profileTypeId bigint(20);

-- -----------------------------------------------------
-- Table `post_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `post_type`;
CREATE TABLE `post_type` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

alter table post add column postTypeId bigint(20);

-- -----------------------------------------------------
-- Table `profile`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `profile`;
CREATE TABLE `profile` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(20) DEFAULT NULL,
  `profileTypeId` varchar(20) DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

ALTER TABLE `user`
DROP COLUMN `lastName`,
CHANGE COLUMN `firstName` `name` VARCHAR(50) NULL DEFAULT NULL ;
