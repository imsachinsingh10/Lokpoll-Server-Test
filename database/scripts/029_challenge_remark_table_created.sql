insert into db_logs (`dev`, scriptName) values ('ritu', '029_challenge_remark_table_created.sql');

DROP TABLE IF EXISTS `challenge_remark` ;
CREATE TABLE `challenge_remark` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `challengeId` bigint(20) DEFAULT NULL,
  `judgeId` bigint(20) DEFAULT NULL,
  `entryId` bigint(20) DEFAULT NULL,
  `remark` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);


ALTER TABLE `post`
add COLUMN `challengeId` bigint(20) DEFAULT 0;


ALTER TABLE `post`
add COLUMN `isOriginalContest` bigint(20) DEFAULT 0;
