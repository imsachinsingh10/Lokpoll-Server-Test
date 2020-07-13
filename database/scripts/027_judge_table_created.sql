insert into db_logs (`dev`, scriptName) values ('ritu', '027_judge_table_created.sql');

DROP TABLE IF EXISTS `judge` ;
CREATE TABLE `judge` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `workingStatus` varchar(40) DEFAULT 'inactive',
  `regDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);
