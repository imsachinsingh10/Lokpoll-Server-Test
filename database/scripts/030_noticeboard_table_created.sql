insert into db_logs (`dev`, scriptName) values ('ritu', '030_noticeboard_table_created.sql');

drop table if exists noticeboard;
CREATE TABLE `noticeboard` (
	`id` bigint(20) NOT NULL AUTO_INCREMENT,
	`languageCode` varchar(20) DEFAULT NULL,
	`topic` varchar(250) DEFAULT NULL,
	`description` longtext DEFAULT NULL,
	`posterUrl` longtext DEFAULT NULL,
	`startDate` datetime DEFAULT null,
	`deadlineDate` datetime DEFAULT null,
    `createdAt` datetime DEFAULT null,
	PRIMARY KEY (`id`)
);

