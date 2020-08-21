insert into db_logs (`dev`, scriptName) values ('himanshu', '033_mood_category_table.sql');

drop table if exists `mood_category`;
CREATE TABLE `mood_category` (
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`createdAt` datetime DEFAULT NULL,
`createdBy` bigint(20) DEFAULT 0,
`imageUrl` varchar(5000) DEFAULT NULL,
`name_hi` varchar(100) DEFAULT NULL,
`name_en` varchar(100) DEFAULT NULL,
`name_or` varchar(100) DEFAULT NULL,
`name_ta` varchar(100) DEFAULT NULL,
`description_hi` varchar(100) DEFAULT NULL,
`description_en` varchar(100) DEFAULT NULL,
`description_or` varchar(100) DEFAULT NULL,
`description_ta` varchar(100) DEFAULT NULL,
`isActive` tinyint(4) DEFAULT 1,
`position` int(11) DEFAULT 0,
PRIMARY KEY (`id`)
);

alter table mood add column categoryId bigint(20) after id;
