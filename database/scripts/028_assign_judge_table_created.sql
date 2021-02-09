insert into db_logs (`dev`, scriptName) values ('ritu', '028_assign_judge_table_created.sql');

DROP TABLE IF EXISTS `assign_judge` ;
CREATE TABLE `assign_judge` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `challengeId` bigint(20) DEFAULT NULL,
  `judgeId` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
