insert into db_logs (`dev`, scriptName) values ('ritu', '018_sub_mood_table_created.sql');

DROP TABLE IF EXISTS `sub_mood`;
CREATE TABLE `sub_mood` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moodId` bigint(20) DEFAULT 0,
  `postId` bigint(20) DEFAULT 0,
  `name` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
);
