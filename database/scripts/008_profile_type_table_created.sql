insert into db_logs (`dev`, scriptName) values ('himanshu', '008_profile_type_table_created.sql');

-- -----------------------------------------------------
-- Table `profile_type`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `profile_type`;
CREATE TABLE `profile_type` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `displayName` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `profile_type` (`id`,`name`) VALUES (1,'Personal');
INSERT INTO `profile_type` (`id`,`name`) VALUES (2,'Business');
INSERT INTO `profile_type` (`id`,`name`) VALUES (3,'Anonymous');

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

INSERT INTO `post_type` (`id`,`name`) VALUES (1,'Normal');
INSERT INTO `post_type` (`id`,`name`) VALUES (2,'Selling');
INSERT INTO `post_type` (`id`,`name`) VALUES (3,'Offer');
