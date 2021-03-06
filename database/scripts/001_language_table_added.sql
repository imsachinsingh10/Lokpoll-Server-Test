insert into db_logs (`dev`, scriptName) values ('himanshu', '001_language_table_added.sql');

-- -----------------------------------------------------
-- Table `language`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `language`;
CREATE TABLE `language` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `isActive` tinyint(2) DEFAULT 0,
  `addedOn` datetime DEFAULT NULL,
  `position` tinyint(4),
  PRIMARY KEY (`id`)
);
