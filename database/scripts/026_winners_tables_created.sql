insert into db_logs (`dev`, scriptName) values ('ritu', '026_winners_tables_created.sql');

-- -----------------------------------------------------
-- Table `post`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `result`;
CREATE TABLE `result` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) DEFAULT 0,
  `challengeId` bigint(20) DEFAULT 0,
  `challengeEntryId` bigint(20) DEFAULT 0,
  `rank` bigint(20) DEFAULT 0,
  `marks` bigint(20) DEFAULT 0,
  `isDeleted` tinyint(2) DEFAULT 0,
  `creatorId` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
);



